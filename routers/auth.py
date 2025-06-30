from fastapi import APIRouter, Depends, HTTPException, status
import aiomysql
from typing import Dict
import entity.schemas
from db.database import get_db_connection

# 创建一个路由实例
router = APIRouter()

@router.post("/login")
async def login_endpoint(
    request_data: entity.schemas.LoginRequest,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户登录请求的 API 端点。
    这个函数现在直接负责：
    1. 接收 HTTP 请求。
    2. 执行数据库 SQL 查询。
    3. 验证业务逻辑（密码校验）。
    4. 返回简单的 HTTP 响应。
    """
    try:
        # 在路由函数内部直接执行数据库操作
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = "SELECT `username`, `password`, `role`, `id` FROM `users` WHERE `username` = %s"
            await cursor.execute(query, (request_data.username,))
            user_in_db = await cursor.fetchone()
            if user_in_db and user_in_db['password'] == request_data.password and user_in_db['role'] == request_data.role:
                # 如果成功，返回一个简单的成功消息
                return {"code": 200, "message": "登录成功!" , "role":user_in_db['role'], "id":user_in_db['id']}

            else:
                # 如果用户不存在或密码错误，抛出401未授权错误
                return {"code": 401, "message": "登录失败!", "role":None, "id":None}

    except Exception as e:
        # 如果数据库操作过程中出现任何其他错误，返回500服务器内部错误
        print(f"数据库或服务器内部错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )

@router.post("/register")
async def register_endpoint(
    request_data: entity.schemas.RegisterRequest,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户注册请求的 API 端点。
    """
    print(request_data)
    # 1. 二次密码确认
    if request_data.password != request_data.confirm_password:
        return {"code": 202, "message": "两次密码不一致!"}

    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query = "SELECT `username` FROM `users` WHERE `username` = %s"
            await cursor.execute(check_query, (request_data.username,))
            if await cursor.fetchone():
                return {"code": 203, "message": "该用户已被注册！"}
            check_query2 = "SELECT `carnumber` FROM `users` WHERE `carnumber` = %s"

            await cursor.execute(check_query2, (request_data.carnumber,))
            if await cursor.fetchone():
                return {"code": 203, "message": "该车牌已被注册！"}
            # 3. 插入新用户数
            insert_query = "INSERT INTO `users` (`username`, `password`,`role`,`carnumber`) VALUES (%s, %s,%s,%s)"
            insert_query2 = "INSERT INTO `userinfo` (`username`) VALUES (%s)"
            await cursor.execute(insert_query, (request_data.username, request_data.password,"驾驶员",request_data.carnumber))
            await cursor.execute(insert_query2, request_data.username)
            return {"code": 201, "message": "注册成功!"}

    except HTTPException as http_exc:
        # 重新抛出已知的HTTP异常，避免被下面的通用异常捕获
        raise http_exc
    except Exception as e:
        print(f"数据库或服务器内部错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )
