from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)
    source: str = Field(default="web", min_length=1, max_length=32)


class UserPublic(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: str
    streak_days: int = 0


class LoginData(BaseModel):
    token: str
    expires_in: int
    token_type: str = "Bearer"
    user: UserPublic


class AppUserItem(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: str
    last_login_at: str | None = None
    login_source: str | None = None
    login_count: int = 0


class AppUserListData(BaseModel):
    items: list[AppUserItem]
    total: int


class ApiResponse(BaseModel):
    code: int
    msg: str
    data: object | None = None
