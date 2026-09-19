from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import create_access_token, get_current_user
from app.config import settings
from app.schemas import (
    ApiResponse,
    AppUserItem,
    AppUserListData,
    LoginData,
    LoginRequest,
    UserPublic,
)
from app.users import (
    WEB_LOGIN_SOURCE,
    UserRecord,
    authenticate,
    list_app_users,
    record_login,
)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    print("[LinJing] API started", flush=True)
    print("[LinJing] Health     http://127.0.0.1:8000/health", flush=True)
    print("[LinJing] Login      POST /api/auth/login", flush=True)
    print("[LinJing] App users  GET  /api/admin/app-users", flush=True)
    yield
    print("[LinJing] API stopped", flush=True)


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ok(data: object, msg: str = "ok") -> dict:
    return ApiResponse(code=200, msg=msg, data=data).model_dump()


def fail(status_code: int, msg: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"code": status_code, "msg": msg, "data": None})


def to_public(user: UserRecord) -> UserPublic:
    return UserPublic(
        id=user.id,
        username=user.username,
        nickname=user.nickname,
        avatar=user.avatar,
        streak_days=user.streak_days,
    )


def to_app_user(user: UserRecord) -> AppUserItem:
    return AppUserItem(
        id=user.id,
        username=user.username,
        nickname=user.nickname,
        avatar=user.avatar,
        last_login_at=user.last_login_at,
        login_source=user.last_login_source or WEB_LOGIN_SOURCE,
        login_count=user.login_count,
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_request, exc: HTTPException):
    return fail(exc.status_code, str(exc.detail))


@app.get("/health")
def health():
    return ok({"status": "up"})


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    user = authenticate(payload.username, payload.password)
    if user is None:
        return fail(401, "用户名或密码错误")

    user = record_login(user.id, payload.source) or user
    token = create_access_token(user.id)
    data = LoginData(
        token=token,
        expires_in=settings.jwt_expires_seconds,
        user=to_public(user),
    )
    return ok(data.model_dump(), "登录成功")


@app.get("/api/auth/me")
def me(current_user: UserRecord = Depends(get_current_user)):
    return ok(to_public(current_user).model_dump())


@app.get("/api/admin/app-users")
def admin_app_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    keyword: str = Query(default=""),
):
    users, total = list_app_users(keyword=keyword, page=page, page_size=page_size)
    payload = AppUserListData(
        items=[to_app_user(user) for user in users],
        total=total,
    )
    # Vben request client expects { code: 0, data: { items, total } }.
    return {
        "code": 0,
        "message": "ok",
        "msg": "ok",
        "data": payload.model_dump(),
    }
