from fastapi import APIRouter, Depends, HTTPException, status
import aiomysql
from typing import Dict
import entity.schemas
from db.database import get_db_connection

# 创建一个路由实例
router = APIRouter()

@router.post("/showuserinfo")
async def showuserinfo_endpoint(
    request_data: entity.schemas.ShowAllUersInfo,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户个人信息展示请求的 API 端点。
    """
    if(request_data.role != "管理员"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query = "SELECT username ,role FROM `users` where username != %s"
            await cursor.execute(check_query, (request_data.username,))
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

@router.post("/showchangeuser")
async def showchangeuser_endpoint(
    request_data: entity.schemas.GetChangeUers,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户个人信息展示请求的 API 端点。
    """
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query = "SELECT u.*, ui.* FROM users u INNER JOIN userinfo ui ON u.username = ui.username WHERE u.username = %s;"
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


@router.post("/changeinfo")
async def changeinfo_endpoint(
    request_data: entity.schemas.SetChangeUers,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理用户修改密码请求的 API 端点。
    """
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query1 = "UPDATE userinfo SET gender = %s, age = %s, work = %s, folk = %s, location = %s WHERE username = %s; "
            check_query2 = "UPDATE users SET role = %s, carnumber = %s WHERE username = %s; "
            await cursor.execute(check_query1, (request_data.gender,request_data.age,request_data.work,request_data.folk,request_data.location,request_data.username))
            await cursor.execute(check_query2,(request_data.role, request_data.carnumber,request_data.username))
            return {"code": 200, "message": "信息修改成功!"}

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

@router.post("/deleteuser")
async def deleteuser_endpoint(
    request_data: entity.schemas.GetChangeUers,
    conn: aiomysql.Connection = Depends(get_db_connection)
) -> Dict:
    """
    处理删除个人信息请求的 API 端点。
    """
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 2. 检查用户名是否已存在
            check_query1 = "DELETE FROM userinfo WHERE username = %s; "
            check_query2 = "DELETE FROM users WHERE username = %s;"
            await cursor.execute(check_query1, request_data.username)
            await cursor.execute(check_query2, request_data.username)
            return {"code": 200, "message": "用户删除成功!"}

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

