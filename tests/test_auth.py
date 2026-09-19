from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_login_success():
    response = client.post("/api/auth/login", json={"username": "alex", "password": "123456"})
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 200
    assert body["data"]["token"]
    assert body["data"]["user"]["username"] == "alex"
    assert body["data"]["user"]["nickname"] == "Alex"


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
