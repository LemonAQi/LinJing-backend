from fastapi.testclient import TestClient

from app.main import app
from app.users import clear_login_records

client = TestClient(app)


def setup_function() -> None:
    clear_login_records()


def test_login_success():
    response = client.post("/api/auth/login", json={"username": "alex", "password": "123456"})
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 200
    assert body["data"]["token"]
    assert body["data"]["user"]["username"] == "alex"
    assert body["data"]["user"]["nickname"] == "Alex"


def test_fluie_can_login():
    response = client.post(
        "/api/auth/login",
        json={"username": "fluie", "password": "123456", "source": "uni"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["user"]["username"] == "fluie"
    assert body["data"]["user"]["nickname"] == "Fluie Grant"


def test_login_rejects_bad_password():
    response = client.post("/api/auth/login", json={"username": "alex", "password": "wrong"})
    assert response.status_code == 401
    body = response.json()
    assert body["code"] == 401
    assert "密码" in body["msg"]


def test_login_requires_fields():
    response = client.post("/api/auth/login", json={"username": "", "password": ""})
    assert response.status_code == 422


def test_me_requires_token():
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_valid_token():
    login_response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    token = login_response.json()["data"]["token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["data"]["username"] == "admin"


def test_app_users_empty_before_login():
    response = client.get("/api/admin/app-users")
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["items"] == []
    assert body["data"]["total"] == 0


def test_app_users_lists_uni_logins():
    client.post("/api/auth/login", json={"username": "fluie", "password": "123456", "source": "uni"})
    client.post("/api/auth/login", json={"username": "alex", "password": "123456", "source": "uni"})

    response = client.get("/api/admin/app-users", params={"keyword": "Fluie"})
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 1
    item = body["data"]["items"][0]
    assert item["username"] == "fluie"
    assert item["nickname"] == "Fluie Grant"
    assert item["login_source"] == "uni"
    assert item["login_count"] == 1
    assert item["last_login_at"]
