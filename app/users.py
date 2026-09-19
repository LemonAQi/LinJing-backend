from dataclasses import dataclass

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@dataclass
class UserRecord:
    id: int
    username: str
    nickname: str
    avatar: str
    password_hash: str
    streak_days: int


def _user(
    user_id: int,
    username: str,
    nickname: str,
    password: str,
    streak_days: int,
    avatar: str,
) -> UserRecord:
    return UserRecord(
        id=user_id,
        username=username,
        nickname=nickname,
        avatar=avatar,
        password_hash=pwd_context.hash(password),
        streak_days=streak_days,
    )


USERS: dict[str, UserRecord] = {
    record.username: record
    for record in (
        _user(
            1,
            "alex",
            "Alex",
            "123456",
            18,
            "https://images.unsplash.com/photo-1548690312-e3e33d4b8cbb?w=200&h=200&fit=crop",
        ),
        _user(
            2,
            "admin",
            "管理员",
            "admin123",
            3,
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
        ),
    )
}


def authenticate(username: str, password: str) -> UserRecord | None:
    user = USERS.get(username.strip())
    if not user:
        return None
    if not pwd_context.verify(password, user.password_hash):
        return None
    return user


def get_user_by_id(user_id: int) -> UserRecord | None:
    for user in USERS.values():
        if user.id == user_id:
            return user
    return None
