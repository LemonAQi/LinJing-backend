# LinJing Backend

林鲸健身应用后端。当前提供用户登录与当前用户查询接口。

## 虚拟环境放在哪

虚拟环境**不会随仓库下发**，要在你本机项目根目录自己创建：

```text
D:\java\work\LinJing-backend\.venv
```

`.venv` 只是这个项目自己的 Python 副本（含 pip、fastapi、uvicorn）。不要提交到 Git。

## Windows（PowerShell）布置步骤

当前报错 `无法将 pip 项识别为 cmdlet` 的意思是：系统 PATH 里没有 `pip`。在 Windows 上应通过 **Python 启动器 `py`** 或 **`python -m pip`** 来装包，不要直接打 `pip`。

先确认 Python 已安装（3.11 或 3.12 即可）：

```powershell
py --version
```

若这条也失败，先从 https://www.python.org/downloads/windows/ 安装 Python，安装时勾选 **Add python.exe to PATH**，然后重开终端。

在项目根目录执行：

```powershell
cd D:\java\work\LinJing-backend
git checkout cursor/user-login-api-fb5e
git pull origin cursor/user-login-api-fb5e

py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

如果激活脚本被拦截（`running scripts is disabled`）：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

再重新执行 `.\.venv\Scripts\Activate.ps1`。激活成功后，提示符前面会出现 `(.venv)`。

Cursor / VS Code：`Ctrl+Shift+P` → **Python: Select Interpreter** → 选  
`D:\java\work\LinJing-backend\.venv\Scripts\python.exe`。

## macOS / Linux

```bash
cd /path/to/LinJing-backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
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
python -m pytest
```
