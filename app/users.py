from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

APP_LOGIN_SOURCE = "app"
APP_LOGIN_SOURCES = ("app", "uni")


@dataclass
class UserRecord:
    id: int
    username: str
    nickname: str
    avatar: str
    password_hash: str
    streak_days: int
    last_login_at: str | None = None
    last_login_source: str | None = None
    login_count: int = 0


SEED_USERS = (
    {
        "id": 1,
        "username": "alex",
        "nickname": "Alex",
        "password": "123456",
        "streak_days": 18,
        "avatar": "https://images.unsplash.com/photo-1548690312-e3e33d4b8cbb?w=200&h=200&fit=crop",
    },
    {
        "id": 2,
        "username": "admin",
        "nickname": "管理员",
        "password": "admin123",
        "streak_days": 3,
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    },
    {
        "id": 3,
        "username": "fluie",
        "nickname": "Fluie Grant",
        "password": "123456",
        "streak_days": 1,
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    },
)


def _connect() -> sqlite3.Connection:
    path = Path(settings.db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def _row_to_user(row: sqlite3.Row) -> UserRecord:
    return UserRecord(
        id=row["id"],
        username=row["username"],
        nickname=row["nickname"],
        avatar=row["avatar"],
        password_hash=row["password_hash"],
        streak_days=row["streak_days"],
        last_login_at=row["last_login_at"],
        last_login_source=row["last_login_source"],
        login_count=row["login_count"] or 0,
    )


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                nickname TEXT NOT NULL,
                avatar TEXT NOT NULL DEFAULT '',
                password_hash TEXT NOT NULL,
                streak_days INTEGER NOT NULL DEFAULT 0,
                last_login_at TEXT,
                last_login_source TEXT,
                login_count INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        existing = {
            row["username"]
            for row in conn.execute("SELECT username FROM users").fetchall()
        }
        for seed in SEED_USERS:
            if seed["username"] in existing:
                continue
            conn.execute(
                """
                INSERT INTO users (
                    id, username, nickname, avatar, password_hash, streak_days
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    seed["id"],
                    seed["username"],
                    seed["nickname"],
                    seed["avatar"],
                    pwd_context.hash(seed["password"]),
                    seed["streak_days"],
                ),
            )
        conn.commit()


def authenticate(username: str, password: str) -> UserRecord | None:
    user = get_user_by_username(username.strip())
    if user is None:
        return None
    if not pwd_context.verify(password, user.password_hash):
        return None
    return user


def get_user_by_id(user_id: int) -> UserRecord | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return _row_to_user(row) if row else None


def get_user_by_username(username: str) -> UserRecord | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        ).fetchone()
    return _row_to_user(row) if row else None


def normalize_login_source(source: str | None) -> str:
    raw = (source or APP_LOGIN_SOURCE).strip().lower()
    if raw in {"uni", "uni-app", "uniapp"}:
        return APP_LOGIN_SOURCE
    return raw or APP_LOGIN_SOURCE


def record_login(user_id: int, source: str = APP_LOGIN_SOURCE) -> UserRecord | None:
    now = datetime.now(timezone.utc).isoformat()
    login_source = normalize_login_source(source)
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET last_login_at = ?, last_login_source = ?, login_count = login_count + 1
            WHERE id = ?
            """,
            (now, login_source, user_id),
        )
        conn.commit()
    return get_user_by_id(user_id)


def list_app_users(
    *,
    keyword: str = "",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[UserRecord], int]:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    offset = (page - 1) * page_size
    placeholders = ", ".join("?" for _ in APP_LOGIN_SOURCES)
    filters = [f"last_login_source IN ({placeholders})", "last_login_at IS NOT NULL"]
    params: list[object] = list(APP_LOGIN_SOURCES)
    trimmed = keyword.strip()
    if trimmed:
        filters.append("(username LIKE ? OR nickname LIKE ?)")
        like = f"%{trimmed}%"
        params.extend([like, like])
    where = " AND ".join(filters)
    with _connect() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) AS total FROM users WHERE {where}",
            params,
        ).fetchone()["total"]
        rows = conn.execute(
            f"""
            SELECT * FROM users
            WHERE {where}
            ORDER BY last_login_at DESC, id DESC
            LIMIT ? OFFSET ?
            """,
            [*params, page_size, offset],
        ).fetchall()
    return [_row_to_user(row) for row in rows], int(total)


def clear_login_records() -> None:
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET last_login_at = NULL, last_login_source = NULL, login_count = 0
            """
        )
        conn.commit()


init_db()
