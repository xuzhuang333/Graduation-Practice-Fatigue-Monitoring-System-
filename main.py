from fastapi import FastAPI
# 导入在其他“文件”中定义的组件
from fastapi.middleware.cors import CORSMiddleware
from db.database import lifespan  # 从 database.py 导入
from routers.auth import router as auth_router # 从 routers/auth.py 导入
from routers.driver import router as driver_router
from routers.controller import router as controller_router
from routers.fatigue_api import router as model_router
# 创建 FastAPI 应用实例
# 将 lifespan 函数关联到 FastAPI 应用，用于管理数据库连接池
app = FastAPI(lifespan=lifespan)

# --- 2. 配置 CORS (跨域资源共享) ---
# 这是允许您朋友的前端代码从他们的电脑访问您这个后端接口的关键
origins = [
    "*",  # 允许所有来源的请求。在生产环境中，为了安全，您应该替换为指定的前端URL，例如 ["http://localhost:3000", "http://127.0.0.1:3000", "http://您朋友的局域网IP"]
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # 允许前端请求携带 cookies
    allow_methods=["*"],  # 允许所有 HTTP 方法 (GET, POST, etc.)
    allow_headers=["*"],  # 允许所有 HTTP 请求头
)
# 将认证路由包含到主应用中
# 这样，所有在 auth_router 中定义的路由都会在应用中生效
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(driver_router, prefix="/api/v2", tags=["Authentication"])
app.include_router(controller_router, prefix="/api/v3", tags=["Authentication"])
app.include_router(model_router, prefix="/api/v4", tags=["Authentication"])
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}
