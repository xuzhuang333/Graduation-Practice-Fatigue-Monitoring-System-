# routers/fatigue_api.py
from fastapi import (
    APIRouter, WebSocket, WebSocketDisconnect, HTTPException,
    File, UploadFile, Depends, BackgroundTasks, Form
)
from pydantic import BaseModel
import numpy as np
import cv2
import os
import tensorflow as tf
import time
from typing import List, Optional
from datetime import datetime
import base64
import json
import aiomysql

# 从您的项目结构中导入依赖
from db.database import get_db_connection
from entity import schemas
from db import database, crud # [1]
# 创建路由实例
router = APIRouter()

# 模型变量和WebSocket连接列表 (与之前相同)
yolo_net, yolo_layers, yolo_labels = None, None, None
lstm_fatigue, lstm_eye, lstm_yawn = None, None, None
active_connections = []


class ModelBuffer:
    def __init__(self):
        print("Initializing new stateful ModelBuffer...")
        self.is_ready = False
        self.lstm_input = []
        self.eye_input = []
        self.yawn_input = []
        self.frame_counter = 0
        self.eye_closed_accumulator = 0
        self.mouth_open_accumulator = 0
        self.fatigue_level_raw = None
        self.eye_closure_raw = None
        self.yawn_raw = None
        self.CONFIRMATION_THRESHOLD_FATIGUE = 40
        self.CONFIRMATION_THRESHOLD_EYE = 3
        self.CONFIRMATION_THRESHOLD_YAWN = 3
        self.CONFIRMATION_THRESHOLD_LOW_RESET = 10
        self.high_fatigue_confirm_counter = 0
        self.eye_closure_confirm_counter = 0
        self.yawn_confirm_counter = 0
        self.low_fatigue_confirm_counter = 0
        self.displayed_fatigue_level = "Initializing"
        self.displayed_eye_closure = False
        self.displayed_yawn = False
        self.high_fatigue_event_logged = False
        self.current_state = "Initializing"
        self.state_start_time = time.time()

    def update_state(self, new_state):
        if new_state != self.current_state:
            if self.current_state == "High" and new_state != "High":
                print("Fatigue level changed from High. Ready to log next High event.")
                self.high_fatigue_event_logged = False
            duration = time.time() - self.state_start_time
            print(f"[STATE_CHANGE] From '{self.current_state}' to '{new_state}'. Duration: {duration:.2f}s")
            self.current_state = new_state
            self.state_start_time = time.time()
            return True
        return False


buffer = ModelBuffer()


class FatigueResponse(BaseModel):
    fatigue_level: str
    eye_closure: bool
    yawn_detected: bool
    current_state_duration: float
    detection_boxes: Optional[List] = None


@router.on_event("startup")
async def startup_event():
    # 1. 加载机器学习模型
    await load_models()

async def load_models():
    global yolo_net, yolo_layers, yolo_labels, lstm_fatigue, lstm_eye, lstm_yawn
    try:
        print("Loading YOLO model...")
        labelsPath = os.path.sep.join(["config", "obj.names"])
        yolo_labels = open(labelsPath).read().strip().split("\n")
        weightsPath = os.path.sep.join(["config", "yolov4-tiny_obj_best.weights"])
        configPath = os.path.sep.join(["config", "yolov4-tiny_obj.cfg"])
        yolo_net = cv2.dnn.readNetFromDarknet(configPath, weightsPath)
        yolo_layers = yolo_net.getLayerNames()
        try:
            yolo_layers = [yolo_layers[i - 1] for i in yolo_net.getUnconnectedOutLayers()]
        except TypeError:
            yolo_layers = [yolo_layers[i[0] - 1] for i in yolo_net.getUnconnectedOutLayers()]
        print("YOLO model loaded successfully!")
    except Exception as e:
        print(f"Error loading YOLO model: {e}")
        # 在真实应用中可能需要更优雅地处理

    try:
        print("Loading LSTM models...")
        lstm_fatigue = tf.keras.models.load_model('./model_dense300')
        lstm_eye = tf.keras.models.load_model('./model_eye')
        lstm_yawn = tf.keras.models.load_model('./model_yawn4')
        print("LSTM models loaded successfully!")
    except Exception as e:
        print(f"Error loading LSTM models: {e}")

async def log_fatigue_to_db(fatigue_data: schemas.FatigueCreate):
    """
    一个独立的后台任务函数，用于记录疲劳数据。
    它会自己从全局连接池获取连接。
    """
    if not database.db_pool:
        print("Database pool is not available for background task.")
        return

    try:
        # 在任务内部获取一个新的连接
        async with database.db_pool.acquire() as conn:
            await crud.create_fatigue_record(conn, fatigue_data)
    except Exception as e:
        # 建议使用日志库，而不是print
        print(f"Error in background task log_fatigue_to_db: {e}")

def detect(frame, W, H):
    # (此函数与之前完全相同)
    global yolo_net, yolo_layers
    blob = cv2.dnn.blobFromImage(frame, 1 / 255.0, (416, 416), swapRB=True, crop=False)
    yolo_net.setInput(blob)
    layerOutputs = yolo_net.forward(yolo_layers)
    boxes, confidences, classIDs = [], [], []
    for output in layerOutputs:
        for detection in output:
            scores = detection[5:]
            classID = np.argmax(scores)
            confidence = scores[classID]
            if confidence > 0.4:
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")
                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))
                boxes.append([x, y, int(width), int(height)])
                confidences.append(float(confidence))
                classIDs.append(classID)
    idxs = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.5)
    return classIDs, boxes, idxs, confidences


def predict_fatigue(input_data, lag_val):
    # (此函数与之前完全相同)
    input_arr = np.array(input_data).reshape((1, 1, lag_val * 2))
    output = lstm_fatigue.predict(input_arr, verbose=0)
    prediction = np.argmax(output)
    if prediction == 0:
        return "Low"
    elif prediction == 1:
        return "Medium"
    else:
        return "High"


def predict_eye_closure(input_data, lag_val):
    # (此函数与之前完全相同)
    input_arr = np.array(input_data).reshape((1, 1, lag_val))
    output = lstm_eye.predict(input_arr, verbose=0)
    return output >= 0.5


def predict_yawn(input_data, lag_val):
    # (此函数与之前完全相同)
    input_arr = np.array(input_data).reshape((1, 1, lag_val))
    output = lstm_yawn.predict(input_arr, verbose=0)
    return output >= 0.5


def process_image(frame, background_tasks: BackgroundTasks, username: str):
    # (此函数与之前完全相同)
    global buffer
    H, W = frame.shape[:2]
    classIDs, boxes, idxs, confidences = detect(frame, W, H)

    if 3 in classIDs: buffer.eye_closed_accumulator += 1
    if 0 in classIDs: buffer.mouth_open_accumulator += 1
    buffer.frame_counter += 1

    if buffer.frame_counter % 5 == 0:
        buffer.lstm_input.append(float(buffer.eye_closed_accumulator))
        buffer.lstm_input.append(float(buffer.mouth_open_accumulator))
        buffer.eye_input.append(float(buffer.eye_closed_accumulator))
        buffer.yawn_input.append(float(buffer.mouth_open_accumulator))
        buffer.eye_closed_accumulator = 0
        buffer.mouth_open_accumulator = 0
        print(len(buffer.lstm_input))
        lag_val, eye_lag_val, yawn_lag_val = 200, 6, 10
        if not buffer.is_ready:
            if (len(buffer.lstm_input) >= lag_val * 2 and
                    len(buffer.eye_input) >= eye_lag_val and
                    len(buffer.yawn_input) >= yawn_lag_val):
                print("All buffers are full. System is now ready for prediction.")
                buffer.is_ready = True
                buffer.update_state("Low")
                buffer.fatigue_level_raw = "Low"
                buffer.displayed_fatigue_level = "Low"

        if buffer.is_ready:
            buffer.lstm_input = buffer.lstm_input[-(lag_val * 2):]
            buffer.fatigue_level_raw = predict_fatigue(buffer.lstm_input, lag_val)
            buffer.eye_input = buffer.eye_input[-eye_lag_val:]
            buffer.eye_closure_raw = bool(predict_eye_closure(buffer.eye_input, eye_lag_val))
            buffer.yawn_input = buffer.yawn_input[-yawn_lag_val:]
            buffer.yawn_raw = bool(predict_yawn(buffer.yawn_input, yawn_lag_val))
            if buffer.fatigue_level_raw == "High":
                buffer.high_fatigue_confirm_counter += 1
            else:
                buffer.high_fatigue_confirm_counter = max(0, buffer.high_fatigue_confirm_counter - 20)
            if buffer.high_fatigue_confirm_counter >= buffer.CONFIRMATION_THRESHOLD_FATIGUE:
                buffer.displayed_fatigue_level = "High"
            elif buffer.fatigue_level_raw == "Medium":
                buffer.displayed_fatigue_level = "Medium"
            else:
                buffer.displayed_fatigue_level = "Low"

            if buffer.displayed_fatigue_level == "High" and not buffer.high_fatigue_event_logged:
                print(f"High fatigue detected for user '{username}'! Logging to database.")
                fatigue_data = schemas.FatigueCreate(
                    username=username,
                    status=buffer.displayed_fatigue_level,
                    event_time=datetime.now()
                )
                background_tasks.add_task(log_fatigue_to_db, fatigue_data)
                buffer.high_fatigue_event_logged = True

            if buffer.eye_closure_raw:
                buffer.eye_closure_confirm_counter += 1
            else:
                buffer.eye_closure_confirm_counter = max(0, buffer.eye_closure_confirm_counter - 1)
            buffer.displayed_eye_closure = buffer.eye_closure_confirm_counter >= buffer.CONFIRMATION_THRESHOLD_EYE
            if buffer.yawn_raw:
                buffer.yawn_confirm_counter += 1
            else:
                buffer.yawn_confirm_counter = max(0, buffer.yawn_confirm_counter - 1)
            buffer.displayed_yawn = buffer.yawn_confirm_counter >= buffer.CONFIRMATION_THRESHOLD_YAWN
            if buffer.fatigue_level_raw == "Low":
                buffer.low_fatigue_confirm_counter += 1
            else:
                buffer.low_fatigue_confirm_counter = 0
            if buffer.low_fatigue_confirm_counter >= buffer.CONFIRMATION_THRESHOLD_LOW_RESET:
                print("Driver state confirmed as Low. Resetting all buffers and counters.")
                if len(buffer.lstm_input) > 0: buffer.lstm_input[:] = [0.0] * len(buffer.lstm_input)
                if len(buffer.eye_input) > 0: buffer.eye_input[:] = [0.0] * len(buffer.eye_input)
                if len(buffer.yawn_input) > 0: buffer.yawn_input[:] = [0.0] * len(buffer.yawn_input)
                buffer.high_fatigue_confirm_counter, buffer.eye_closure_confirm_counter, buffer.yawn_confirm_counter, buffer.low_fatigue_confirm_counter = 0, 0, 0, 0
                buffer.fatigue_level_raw = "Low"
                buffer.displayed_fatigue_level, buffer.displayed_eye_closure, buffer.displayed_yawn = "Low", False, False

            buffer.update_state(buffer.displayed_fatigue_level)

    current_duration = time.time() - buffer.state_start_time
    detection_boxes_data = []
    if len(idxs) > 0:
        for i in idxs.flatten():
            detection_boxes_data.append(
                {"class": yolo_labels[classIDs[i]], "confidence": confidences[i], "box": boxes[i]})

    return {
        "fatigue_level": buffer.displayed_fatigue_level,
        "eye_closure": buffer.displayed_eye_closure,
        "yawn_detected": buffer.displayed_yawn,
        "current_state_duration": current_duration,
        "detection_boxes": detection_boxes_data
    }


@router.websocket("/ws/{username}")
async def websocket_endpoint(
        websocket: WebSocket,
        username: str,
        db: aiomysql.Connection = Depends(get_db_connection)
):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"WebSocket connection established for user: {username}")
    try:
        while True:
            data = await websocket.receive_text()
            try:
                json_data = json.loads(data)
                img_data = json_data.get("image", "")
                if "base64," in img_data:
                    img_data = img_data.split("base64,")[1]

                img_bytes = base64.b64decode(img_data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is not None:
                    background_tasks = BackgroundTasks()
                    result = process_image(frame, background_tasks, username)
                    await websocket.send_json(result)
                    await background_tasks()  # 在WebSocket中需要手动调用
                else:
                    await websocket.send_json({"error": "无法解码图像"})
            except Exception as e:
                await websocket.send_json({"error": str(e)})
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print(f"WebSocket connection closed for user: {username}")


@router.post("/reset_buffer")
async def reset_buffer():
    global buffer
    buffer = ModelBuffer()
    return {"status": "ok", "message": "Stateful buffer has been reset"}


@router.post("/detect_fatigue/", response_model=FatigueResponse)
async def detect_fatigue(
        request: schemas.FatigueJsonRequest,  # 接收我们新定义的JSON模型
        background_tasks: BackgroundTasks,
        db: aiomysql.Connection = Depends(get_db_connection)
):
    try:
        # 从请求体中获取Base64图像数据
        img_data = request.image
        if "base64," in img_data:
            img_data = img_data.split("base64,")[1]

        # 解码图像
        img_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="无法解码图像数据，请检查Base64字符串")
    except (base64.binascii.Error, Exception) as e:
        raise HTTPException(status_code=400, detail=f"图像解码失败: {e}")

    # 从请求体中获取username并传递给处理函数
    result = process_image(frame, background_tasks, request.username)
    return FatigueResponse(**result)


@router.get("/health")
async def health_check():
    return {"status": "ok", "models_loaded": all([yolo_net, lstm_fatigue, lstm_eye, lstm_yawn])}
