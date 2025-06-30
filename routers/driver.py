from fastapi import APIRouter, Depends, HTTPException, status
import aiomysql
from typing import Dict
import entity.schemas
from db.database import get_db_connection
from entity.schemas import ChangeInfoRequest

# 创建一个路由实例
router = APIRouter()

@router.post("/userinfo")
async def userinfo_endpoint(
    request_data: entity.schemas.QueryRequest,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户个人信息展示请求的 API 端点。
    """
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query = "SELECT * FROM `userinfo` WHERE `username` = %s"
            await cursor.execute(check_query, (request_data.username,))
            # 2. 获取查询结果
            user_info = await cursor.fetchone()

            # 3. 判断结果并返回不同的JSON响应
            if user_info:
                # 如果找到了数据
                # FastAPI 会自动将这个字典转换为 JSON
                return {
                    "code": 200,
                    "message": "查询成功",
                    "data": user_info  # 这里是您从数据库查出的整行数据
                }
            else:
                # 如果没有找到数据，返回404错误
                # 使用 HTTPException 是 FastAPI 处理标准 HTTP 错误的最佳方式
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"未找到用户 '{request_data.username}' 的信息"
                )
    except HTTPException as http_exc:
        # 重新抛出已知的HTTP异常，避免被下面的通用异常捕获
        raise http_exc
    except Exception as e:
        print(f"数据库或服务器内部错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )


@router.post("/changeuserinfo")
async def changeuserinfo_endpoint(
    request_data: entity.schemas.ChangeInfoRequest,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户修改密码请求的 API 端点。
    """
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query = "UPDATE userinfo SET gender = %s, age = %s, work = %s, folk = %s, location = %s WHERE username = %s; "
            await cursor.execute(check_query, (request_data.gender,request_data.age,request_data.work,request_data.folk,request_data.location,request_data.username))
            return {"code": 200, "message": "个人信息修改成功!"}

    except HTTPException as http_exc:
        # 重新抛出已知的HTTP异常，避免被下面的通用异常捕获
        raise http_exc
    except Exception as e:
        print(request_data)
        print(f"数据库或服务器内部错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )

@router.post("/changepassword")
async def ChangePassword_endpoint(
    request_data: entity.schemas.ChangePassword,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户修改个人信息请求的 API 端点。
    """
    # 验证1: 新密码与确认密码是否一致
    if request_data.new_password != request_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码与确认密码不匹配"
        )

    # 验证2: 新密码是否与旧密码相同
    if request_data.new_password == request_data.old_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码不能与旧密码相同"
        )

    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 安全警告: 在真实应用中，用户身份(username)应该从认证令牌(Token)中获取，
            # 而不是由前端直接传递，以防止恶意用户修改他人密码。

            # 从数据库获取当前密码用于验证
            query = "SELECT `password` FROM `users` WHERE `username` = %s"
            await cursor.execute(query, (request_data.username,))
            user_in_db = await cursor.fetchone()

            # 验证3: 用户是否存在，以及旧密码是否正确
            if not user_in_db or user_in_db['password'] != request_data.old_password:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="用户名或旧密码错误"
                )

            # 所有验证通过，更新数据库中的密码
            # 警告: 密码应该被哈希处理后再存储！例如: hashed_new_password = pwd_context.hash(request_data.newpassword)
            update_query = "UPDATE `users` SET `password` = %s WHERE `username` = %s"
            await cursor.execute(update_query, (request_data.new_password, request_data.username))

            return {"code": 200, "message": "密码修改成功"}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"数据库或服务器内部错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )

@router.post("/showfatigue")
async def showfatigue_endpoint(
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户个人信息展示请求的 API 端点。
    """
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query = "SELECT * FROM `fatigue` "
            await cursor.execute(check_query)
            # 2. 获取查询结果
            user_info = await cursor.fetchall()

            # 3. 判断结果并返回不同的JSON响应
            if user_info:
                # 如果找到了数据
                # FastAPI 会自动将这个字典转换为 JSON
                return {
                    "code": 200,
                    "message": "查询成功",
                    "data": user_info  # 这里是您从数据库查出的整行数据
                }
            else:
                # 如果没有找到数据，返回404错误
                # 使用 HTTPException 是 FastAPI 处理标准 HTTP 错误的最佳方式
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"未找到用户信息"
                )
    except HTTPException as http_exc:
        # 重新抛出已知的HTTP异常，避免被下面的通用异常捕获
        raise http_exc
    except Exception as e:
        print(f"数据库或服务器内部错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )
