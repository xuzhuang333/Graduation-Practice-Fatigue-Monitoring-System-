# =======================================================================
# database.py: 数据库连接模块
# =======================================================================
# 负责数据库连接的整个生命周期管理。

import aiomysql
from typing import Optional, AsyncGenerator
from fastapi import HTTPException, FastAPI
from config.config import settings

# 全局变量，用于存储数据库连接池
db_pool: Optional[aiomysql.Pool] = None

async def lifespan(app: FastAPI):
    """
    FastAPI 应用的生命周期函数。
    在应用启动时创建连接池，在应用关闭时安全地关闭它。
    """
    print("应用启动，正在创建数据库连接池...")
    global db_pool
    db_pool = await aiomysql.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
        autocommit=True
    )
    yield
    print("应用关闭，正在关闭数据库连接池...")
    if db_pool:
        db_pool.close()
        await db_pool.wait_closed()


async def get_db_connection() -> AsyncGenerator[aiomysql.Connection, None]:
    """
    一个依赖项 (Dependency)，为每个请求提供一个数据库连接。
    """
    if not db_pool:
        raise HTTPException(status_code=503, detail="数据库服务不可用")

    async with db_pool.acquire() as conn:
        yield conn

