from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import create_access_token, get_current_user
from app.config import settings
from app.schemas import ApiResponse, LoginData, LoginRequest, UserPublic
from app.users import UserRecord, authenticate

app = FastAPI(title=settings.app_name, version="0.1.0")

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
