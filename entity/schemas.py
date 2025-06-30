# 定义所有用于数据交换的 Pydantic 模型。
from datetime import datetime

from pydantic import BaseModel

class LoginRequest(BaseModel):
    """登录请求体模型"""
    username: str
    password: str
    role : str

class RegisterRequest(BaseModel):
    """注册请求体模型"""
    username: str
    password: str
    confirm_password: str
    carnumber: str

class QueryRequest(BaseModel):
    """查询个人信息请求体模型"""
    username: str

class ChangeInfoRequest(BaseModel):
    """查询个人信息请求体模型"""
    username : str
    gender : str
    age : str
    folk : str
    work : str
    location : str

class ChangePassword(BaseModel):
    """查询个人信息请求体模型"""
    username : str
    old_password : str
    new_password : str
    confirm_password : str

class ShowAllUersInfo(BaseModel):
    """查询所有信息请求体模型"""
    username : str
    role : str

class GetChangeUers(BaseModel):
    """查询所有信息请求体模型"""
    username : str

class SetChangeUers(BaseModel):
    """处理管理员修改请求体模型"""
    username : str
    gender : str
    age : str
    work : str
    folk : str
    location : str
    role : str
    carnumber : str

class FatigueCreate(BaseModel):
    """用于创建疲劳记录的模型"""
    username: str
    status: str
    event_time: datetime

class FatigueJsonRequest(BaseModel):
    """用于 /detect_fatigue/ 接口的JSON请求体模型"""
    username: str
    image: str  # 接收Base64编码的图像字符串
