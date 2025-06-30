# db/crud.py
from datetime import datetime
import aiomysql
from entity.schemas import FatigueCreate  # 从同级目录的schemas导入


async def create_fatigue_record(db: aiomysql.Connection, fatigue: FatigueCreate):
    """
    在数据库中创建一条新的疲劳记录。

    :param db: 数据库连接对象
    :param fatigue: 包含疲劳数据的Pydantic模型
    """
    query = "INSERT INTO fatigue (username, status, time) VALUES (%s, %s, %s)"
    args = (fatigue.username, fatigue.status, fatigue.event_time)

    try:
        async with db.cursor() as cursor:
            await cursor.execute(query, args)
        # autocommit=True 在连接池创建时已设置，此处无需手动commit
        print(f"Successfully inserted record for user '{fatigue.username}' at {fatigue.event_time}")
        return True
    except Exception as e:
        print(f"Error inserting fatigue record into database: {e}")
        return False

#
# async def ensure_fatigue_table_exists(db: aiomysql.Connection):
#     """
#     检查并创建 fatigue 表（如果它不存在）。
#     这将在应用启动时被调用。
#     """
#     try:
#         async with db.cursor() as cursor:
#             await cursor.execute("""
#                                  CREATE TABLE IF NOT EXISTS fatigue
#                                  (
#                                      id
#                                      INT
#                                      AUTO_INCREMENT
#                                      PRIMARY
#                                      KEY,
#                                      username
#                                      VARCHAR
#                                  (
#                                      255
#                                  ) NOT NULL,
#                                      status VARCHAR
#                                  (
#                                      50
#                                  ) NOT NULL,
#                                      event_time DATETIME NOT NULL
#                                      )
#                                  """)
#         print("Table 'fatigue' is ready.")
#     except Exception as e:
#         print(f"Error creating 'fatigue' table: {e}")
