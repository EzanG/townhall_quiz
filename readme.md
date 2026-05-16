# 年会现场问答互动（Townhall Quiz）

公司年会现场互动答题：约 100 人用手机参与，大屏展示约 280 座会场状态、倒计时、排行榜 TOP10 等。

## 功能概览

| 页面 | 路径 | 说明 |
|------|------|------|
| **大屏 + 场控（PC）** | `/` | 座位图、排行榜、倒计时、主持按钮、手机参与二维码；场控密钥默认不强制校验（见环境变量） |
| **手机参与** | `/play` | 登记（姓名 + 座位号如 `8-15`）+ 答题；可选选项后提交 |
| **参数设置** | `/settings` | 手机参与页完整 URL（二维码）、默认倒计时秒数、`ADMIN_KEY` 存浏览器 |
| 兼容跳转 | `/join`、`/host`、`/display` | 分别重定向到 `/play` 或 `/` |

## 技术栈

- **Next.js 15**（App Router）+ TypeScript + Tailwind CSS
- **SQLite**（`data/quiz.db`）+ Node 内置 **`node:sqlite`**
- **Socket.io**：全场状态实时推送（自定义 Node 服务 `server.ts`，路径 `/api/socket`）

不再依赖 n8n/Dify；单场年会一台内网主机运行即可。

## 快速开始

### 环境要求

- **本地开发**：Node.js **22.5+**（内置 `node:sqlite`）
- **Linux 生产 / Docker**：镜像基于官方 `node:22-bookworm-slim`（见本仓库 `Dockerfile`）

### 安装与初始化

本项目使用 **pnpm** 管理依赖。需先安装 pnpm：

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

```bash
cd townhall_quiz
pnpm install
pnpm run db:generate  # 生成座位布局 JSON（14×20 + 过道）
pnpm run db:migrate   # 创建 data/quiz.db
cp .env.example .env.local
# 可选：编辑 .env.local 中的 ADMIN_KEY、DATABASE_PATH、PORT
```

> 首次 `pnpm install` 可能较慢；之后 pnpm 会使用本地缓存。

### 本地调试

日常开发**不要**执行 `pnpm build`，用开发模式即可联调页面、API、Socket：

```bash
pnpm dev
```

浏览器访问 http://localhost:3000（大屏场控），另开：

- `/play` — 手机参与（或大屏旁开窗口模拟手机）
- `/settings` — 若大屏用 `localhost`、手机用内网 IP，在此填写 **手机可访问的** `/play` 完整 URL，便于二维码正确

默认端口 `3000`，可通过环境变量 `PORT` 修改。

### 生产构建

功能在本地 `pnpm dev` 调通后再执行：

```bash
pnpm build
pnpm start
```

`pnpm start` 使用 `NODE_ENV=production` 启动 `server.ts`（Next 生产模式 + Socket.io）。Windows 下脚本通过 `cross-env` 设置环境变量。

## Docker 部署（推荐生产 / 内网服务器）

适合 Ubuntu、Debian 等 **Linux x86_64/amd64** 主机。Windows 上请使用 **WSL2** 或把镜像构建与运行放在 Linux CI/服务器上（Windows 直接 `docker compose` 亦可，但路径与卷行为以 Linux 文档为准）。

### 前置条件

- 已安装 [Docker Engine](https://docs.docker.com/engine/install/) 与 [Compose V2](https://docs.docker.com/compose/)（`docker compose` 子命令）
- 仓库含 `pnpm-lock.yaml`；构建镜像时会执行 `pnpm run db:generate` 与 `pnpm run db:migrate`（校验迁移脚本），运行时数据库在 **命名卷** 中持久化

### 1. 环境变量

在 `docker-compose.yml` 同目录下，通过环境变量或 `.env` 文件（Compose 会自动读取）注入：

| 变量 | 说明 |
|------|------|
| `ADMIN_KEY` | 主持调 API 时浏览器里保存的密钥应与之一致；正式活动务必改为强随机串 |
| `ADMIN_STRICT` | 可选，设为 `true` 时服务端校验 `x-admin-key` 与 `ADMIN_KEY` 一致（见 compose 内注释示例） |
| `PORT` | 可选，**主机映射与容器内监听同一端口**（与 `.env` / `server.ts` 一致），默认 `3000` |

示例：

```bash
export ADMIN_KEY='请使用足够长的随机字符串'
docker compose up -d --build
```

或创建 `.env`（勿提交到 Git）：

```env
ADMIN_KEY=你的强密钥
PORT=3000
```

### 2. 构建与启动

```bash
docker compose up -d --build
```

指定主机端口：

在 `.env` 中设置 `PORT=8080` 后执行 `docker compose up -d --build`；或单次覆盖：

```bash
PORT=8080 docker compose up -d --build
```

### 3. 数据持久化

`docker-compose.yml` 将命名卷 `quiz_data` 挂载到容器内 `/app/data`，与 `DATABASE_PATH=/app/data/quiz.db` 一致。**删除卷**才会清空答题数据；仅 `docker compose down` 不删卷则数据保留。

容器每次启动会执行 `docker-entrypoint.sh`：`node scripts/migrate.mjs`（幂等加列）后 `pnpm exec tsx server.ts`。

### 4. 镜像说明（多阶段构建）

- **builder**：安装依赖 → 生成座位 JSON → 迁移 → `pnpm build`
- **runner**：仅生产依赖 + `.next` + `src` + `server.ts` 等运行所需文件，体积更小

题目与座位布局来自镜像内的 `src/data/*.json`；若修改题目/座位源文件，需 **重新构建镜像** 才会进新容器。

### 5. 反向代理与 WebSocket

生产建议在容器前加 **Nginx / Caddy**：

- 对外 `443` TLS
- 将 HTTP(S) 反代到 `http://127.0.0.1:PORT`（与 `.env` 中 `PORT` 一致）
- **必须**允许 WebSocket 升级：Socket.io 使用路径 **`/api/socket`**（与 `server.ts` 中 `path` 一致）

示例（Nginx）要点：`proxy_http_version 1.1`、`Upgrade` / `Connection` 头、`proxy_read_timeout` 适当加大。

### 6. 常用运维命令

```bash
docker compose logs -f townhall-quiz
docker compose ps
docker compose down
# 清空答题数据（慎用）：先 docker volume ls 找到 *_quiz_data 再 rm
docker volume rm <你的项目生成的卷名>
```

### 7. 故障排查

| 现象 | 排查 |
|------|------|
| 大屏一直「断开」 | 检查反代是否放行 WebSocket；浏览器控制台 Network 是否连上 `/api/socket` |
| 手机扫二维码打不开 | 在 `/settings` 填写手机能访问的 **公网或内网 http(s)://主机:端口/play** |
| 场控 403 | 设置 `ADMIN_STRICT=true` 时，请求头 `x-admin-key` 须与容器环境变量 `ADMIN_KEY` 一致 |

## 环境变量（`.env.local` / 容器）

| 变量 | 说明 |
|------|------|
| `ADMIN_KEY` | 在 `ADMIN_STRICT=true` 时用于校验场控请求头 `x-admin-key` |
| `ADMIN_STRICT` | 可选，设为 `true` 启用场控密钥校验；**默认不校验**，便于彩排 |
| `PORT` | 可选，默认 `3000` |
| `DATABASE_PATH` | 可选，SQLite 文件路径；Docker 内默认 `/app/data/quiz.db` |
| `HOSTNAME` | 可选，`server.ts` 监听日志用，默认 `localhost` |

以下在浏览器 **localStorage**（`/settings` 写入），不进服务端：

- 手机扫码用的 `/play` 完整地址
- 默认倒计时秒数、场控密钥副本

## 数据设计（极简 2 表）

- **`game`**：单行；`phase`、`timer_sec`、`current_q`、`countdown_end`、**`opened_at`**（本轮「开始作答」时刻，用于答题耗时统计）
- **`player`**：`seat_id` 主键、`correct_count`、`status`（`live` / `out`）、`token`、**`total_correct_time_ms`**（每轮答对耗时毫秒累计）

座位坐标在 [`src/data/seats.layout.json`](src/data/seats.layout.json)，不入库。题目在 [`src/data/questions.json`](src/data/questions.json)。

## 场次阶段（phase）

| phase | 含义 |
|-------|------|
| `lobby` | 仅登记，未开始本题 |
| `countdown` | 同步倒计时；**可与 `open` 一样提交答案**（计时从主持「开始作答」起算） |
| `open` | 倒计时已结束或仍在作答窗口内，仍可提交 |
| `closed` | 本轮已切题或等待主持「下一题」后的静止态 |

## 会场座位

- 14 行 × 20 列 = 280 座
- 第 1–8 排为前区，第 9–14 排为后区（中间横过道）
- 第 1–10 列为左侧，第 11–20 列为右侧（中间纵过道）

重新生成布局：`pnpm run db:generate`

## 题目

编辑 `src/data/questions.json`，格式示例：

```json
[
  {
    "stem": "公司成立于哪一年？",
    "options": { "A": "2020", "B": "2021", "C": "2022", "D": "2023" },
    "correct": "A"
  }
]
```

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/state` | 全场状态（与 Socket `state:update` 结构一致） |
| POST | `/api/login` | 登录 `{ seatId, name, employeeId? }` |
| POST | `/api/answer` | 提交答案 `{ token, choice }` |
| POST | `/api/admin` | 主持控制 JSON `{ action, ... }`，可选头 `x-admin-key` |

Socket：连接后监听 `state:update`。

## 现场部署建议

1. **Docker（推荐）**：Linux 主机按上文 **Docker 部署** 使用 `docker compose`。
2. **直接运行**：内网机器 Node 22，`pnpm install && pnpm build && pnpm start`。
3. 可选 **Nginx** 反代到 80/443，并放行 **WebSocket**（`/api/socket`）。
4. 手机参与地址：大屏侧二维码指向 **`/play`**（在 `/settings` 配置完整 URL）。
5. 彩排清空参与者：主持「重置玩家」或删除数据库文件 / Docker 卷后重启。

## 目录结构

```
townhall_quiz/
├── data/quiz.db          # SQLite（git 忽略；Docker 下在卷内）
├── public/
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
├── server.ts             # 首行加载 env-bootstrap，再 Next + Socket.io
├── scripts/
│   ├── generate-seats.mjs
│   └── migrate.mjs
├── src/
│   ├── app/              # 页面与 API
│   ├── components/
│   ├── data/             # seats.layout.json, questions.json
│   └── lib/              # db、game、gamePhase、socket-server、zh 等
└── readme.md
```

## 中文文案（防乱码）

界面与 API 中的中文统一放在 [`src/lib/zh.ts`](src/lib/zh.ts)，用 **Unicode 转义**（`\uXXXX`）书写。修改文案时只改 `zh.ts` 即可。

## 原始需求对照

1. 座位图与登录状态 — `SeatMap` + `player` 表  
2. 同步倒计时与作答窗口 — `game.timer_sec`、`countdown_end`、`opened_at`  
3. 提交后答对数与排行榜 — Socket + `total_correct_time_ms` 同分排序  
4. 答错淘汰 — `status=out`  
5. 大屏统计与榜单 — 首页三栏布局 + `LeaderboardAside`  
