# LinJing Backend

林鲸健身应用后端。当前提供用户登录与当前用户查询接口。

## 本地启动

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 演示账号

| 用户名 | 密码 | 说明 |
| --- | --- | --- |
| alex | 123456 | 首页默认用户 |
| admin | admin123 | 管理员 |

生产环境请通过 `JWT_SECRET` 覆盖默认密钥，不要使用仓库中的开发默认值。

## 接口

### `POST /api/auth/login`

```json
{ "username": "alex", "password": "123456" }
```

成功响应：

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "<jwt>",
    "expires_in": 86400,
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "username": "alex",
      "nickname": "Alex",
      "avatar": "...",
      "streak_days": 18
    }
  }
}
```

失败返回 HTTP 401：`{ "code": 401, "msg": "用户名或密码错误", "data": null }`。

### `GET /api/auth/me`

Header: `Authorization: Bearer <token>`

### `GET /health`

服务探活。

## 测试

```bash
pytest
```
