# Roleplay AI Chat 🎭

一个基于 Vue 3 + Node.js 的前后端分离角色扮演 AI 对话平台。用户可以自由创建角色、设定人设，与 AI 进行文本或图片对话，体验沉浸式角色扮演。

## ✨ 功能特性

- 🧑‍🎤 **角色管理** — 创建、编辑、删除自定义角色，配置角色名称、人设描述和头像
- 💬 **文本对话** — 与 AI 角色进行多轮对话，自动携带历史上下文保持人设一致性
- 🖼️ **图片对话** — 支持上传图片并围绕图片内容进行对话（基于通义千问 VL 多模态模型）
- ⚡ **流式回复** — AI 回复逐字流式展示，接近真实聊天体验
- 📜 **历史记录** — 按角色聚合查看和管理对话历史
- 🎨 **现代化 UI** — Vue 3 + Vite 构建，响应式设计，界面精致

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5 | 前端框架 |
| Vite | 7.x | 构建工具 |
| Vue Router | 4.x | 路由管理 |
| Pinia | 3.x | 状态管理 |
| Axios | 1.x | HTTP 客户端 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 20 | 运行时 |
| Express | 5.x | Web 框架 |
| mssql | 12.x | SQL Server 驱动 |
| Multer | 2.x | 文件上传 |
| Axios | 1.x | AI 接口调用 |

### 服务 & API

| 服务 | 用途 |
|------|------|
| SQL Server | 业务数据存储（角色、会话、消息、文件元数据） |
| 阿里云 DashScope | 通义千问 qwen-vl-max 多模态模型 |

## 📁 项目结构

```
roleplay-ai/
├── backend/                  # Node.js 后端
│   ├── src/
│   │   ├── controllers/      # 请求控制器
│   │   ├── routes/           # 路由定义
│   │   ├── services/        # 业务逻辑层
│   │   │   ├── aiService.js       # AI 接口封装
│   │   │   ├── chatService.js     # 会话 & 消息
│   │   │   ├── roleService.js     # 角色 CRUD
│   │   │   ├── historyService.js  # 历史记录
│   │   │   └── uploadService.js   # 图片上传
│   │   ├── utils/            # 工具函数
│   │   │   ├── db.js              # SQL Server 连接池
│   │   │   └── loadEnv.js         # 环境变量加载
│   │   └── app.js            # Express 入口
│   ├── sql/
│   │   └── init.sql          # 数据库初始化脚本
│   ├── uploads/              # 用户上传图片（本地存储）
│   └── .env.example          # 环境变量模板
├── frontend/                 # Vue 3 前端
│   ├── src/
│   │   ├── views/            # 页面组件
│   │   │   ├── HomeView.vue       # 首页 / 角色列表
│   │   │   ├── RoleConfigView.vue # 角色创建 / 编辑
│   │   │   ├── ChatView.vue       # 聊天页
│   │   │   └── HistoryView.vue    # 历史记录
│   │   ├── stores/           # Pinia 状态
│   │   ├── router/           # Vue Router 配置
│   │   ├── i18n/             # 轻量国际化文案
│   │   └── main.js           # 应用入口
│   ├── vite.config.js        # Vite 配置（含 /api 代理）
│   └── .env.example
└── docs/                     # 架构 & 设计文档
```

## 🚀 快速开始

### 前置条件

- Node.js ≥ 20.19（或 ≥ 22.12）
- SQL Server（本地或远程均可）
- 阿里云 DashScope API Key（[开通地址](https://dashscope.console.aliyun.com/)）

### 1. 克隆项目

```bash
git clone https://github.com/huquququ/AI-.git roleplay-ai
cd roleplay-ai
```

### 2. 初始化数据库

在 SQL Server 中执行 `backend/sql/init.sql`，会自动创建所需的 `roles`、`conversations`、`messages`、`files` 四张表及索引。

### 3. 配置后端环境变量

复制模板并填写你的实际配置：

```bash
cp backend/.env.example backend/.env.local
```

`backend/.env.local` 内容示例：

```ini
# SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your_sql_server_password
DB_NAME=roleplay_ai

# 阿里云通义千问
ALIYUN_API_KEY=your_api_key_here
ALIYUN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
ALIYUN_MODEL=qwen-vl-max
```

> ⚠️ `.env.local` 已被 `.gitignore` 忽略，**永远不要**把真实密钥提交到仓库。

### 4. 启动后端

```bash
cd backend
npm install
npm run dev    # 开发模式（nodemon 热重载）
# 或 npm start
```

后端默认运行在 `http://localhost:3000`，可访问 `http://localhost:3000/api/health` 验证是否启动成功。

### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，Vite 已配置 `/api` 请求代理到后端 `http://localhost:3000`。

### 6. 打包部署

```bash
cd frontend
npm run build
```

产物在 `frontend/dist/`，可部署到任意静态托管服务（Vercel / Netlify / Nginx 等）。

## 📡 API 概览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 角色 | GET | `/api/roles` | 获取角色列表 |
| | GET | `/api/roles/:id` | 获取单个角色 |
| | POST | `/api/roles` | 创建角色 |
| | PUT | `/api/roles/:id` | 更新角色 |
| | DELETE | `/api/roles/:id` | 删除角色 |
| 对话 | GET | `/api/conversations/:roleId/messages` | 获取对话消息 |
| | POST | `/api/conversations/:roleId/messages` | 发送消息 |
| | GET | `/api/conversations/:roleId/stream` | 流式获取 AI 回复 |
| | DELETE | `/api/conversations/:roleId` | 清空对话 |
| 上传 | POST | `/api/upload` | 上传图片并创建消息 |
| 历史 | GET | `/api/history` | 按角色聚合的历史记录 |
| 健康 | GET | `/api/health` | 健康检查 |

## 🏗️ 系统架构

```
┌──────────────┐     HTTP / SSE      ┌──────────────┐    HTTP POST     ┌──────────────┐
│   Vue 3 前端  │ ──────────────────▶ │  Express 后端 │ ───────────────▶ │ 阿里云 DashScope │
│  (Vite + SPA) │ ◀────────────────── │  (Node.js)   │ ◀─────────────── │  qwen-vl-max  │
└──────┬───────┘                     └──────┬───────┘                   └──────────────┘
       │                                    │
       │ 图片上传                             │ CRUD 查询
       ▼                                    ▼
  Multer 本地存储                      SQL Server
  backend/uploads/                    roles / conversations
                                      messages / files
```

### 核心数据流

**文本对话：** 用户发送消息 → 后端保存用户消息 → 后端读取历史上下文 → 拼接 system prompt + 历史 + 当前消息 → 调用 AI → 流式返回给前端 → AI 回复写入数据库

**图片对话：** 用户选择图片 → 前端压缩 → 上传到后端 → 后端保存文件 + 创建消息记录 + 返回消息 → 触发 AI 回复流程

## 📚 更多文档

- [架构说明](docs/architecture.md)
- [数据库设计](docs/database.md)
- [模块设计](docs/module-design.md)

## 📝 License

ISC
