# LinJing Backend

临境后端服务：NestJS 11 + TypeScript + PostgreSQL（TypeORM）+ Redis。

本仓库当前提供可运行的框架骨架，包含配置校验、统一响应、JWT 鉴权、健康检查和本地依赖编排。

## 技术栈

- NestJS 11 / TypeScript
- PostgreSQL 16 + TypeORM 0.3
- Redis 7（ioredis，刷新令牌存储）
- JWT（access + refresh）
- Swagger（`/docs`）
- class-validator / helmet / throttler

## 目录结构

```text
src/
  common/          过滤器、拦截器、守卫、装饰器、基础实体
  config/          环境变量映射与 Joi 校验
  database/        TypeORM 连接与 migrations
  modules/
    auth/          注册 / 登录 / 刷新 / 登出
    users/         用户实体与当前用户接口
    health/        GET /health
  redis/           Redis 封装
  main.ts
  setup-app.ts     全局管道、CORS、Swagger
```

## 本地启动

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

- API 前缀：`/api/v1`
- 健康检查：`GET /health`（K8s 友好，不走统一包装）
- Swagger：http://localhost:3000/docs

生产环境必须将 `DATABASE_SYNC=false`，改用 migration：

```bash
npm run migration:generate
npm run migration:run
```

## 主要接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | 注册并签发令牌 |
| POST | `/api/v1/auth/login` | 登录 |
| POST | `/api/v1/auth/refresh` | 刷新 access token |
| POST | `/api/v1/auth/logout` | 登出（需 Bearer） |
| GET | `/api/v1/users/me` | 当前用户（需 Bearer） |
| GET | `/health` | PostgreSQL / Redis 探活 |

成功响应统一为：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "timestamp": 0
}
```

## 脚本

```bash
npm run start:dev   # 开发热重载
npm run build
npm run test
npm run test:e2e
npm run lint
```
