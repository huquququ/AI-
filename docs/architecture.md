# 角色扮演 AI 对话平台架构说明

## 1. 项目概述

这是一个前后端分离的角色扮演 AI 对话平台。用户可以创建角色、配置角色设定、与角色进行文本或图片对话，并查看历史记录。

当前代码以“可直接运行的最小产品”为目标，已经具备以下能力：

- 角色创建、编辑、删除
- 文本对话
- 图片上传与图片消息
- 历史记录查看与删除
- AI 回复流式展示

## 2. 当前技术栈

### 2.1 前端

- 框架：Vue 3
- 构建工具：Vite
- 路由：Vue Router
- 状态管理：Pinia
- HTTP 客户端：Axios
- 本地文案层：轻量 `i18n/messages.js`

### 2.2 后端

- 运行时：Node.js
- Web 框架：Express
- 文件上传：Multer
- 数据库驱动：`mssql`
- 数据库：SQL Server
- AI 服务：阿里云 DashScope OpenAI 兼容接口

### 2.3 存储方式

- 业务数据：SQL Server
- 上传文件：本地目录 `backend/uploads`
- 文件访问：通过 Express 静态资源路由 `/uploads`

## 3. 系统结构

### 3.1 前端结构

前端主要由以下层次组成：

1. 视图层
   - `HomeView.vue`：角色列表与入口页
   - `RoleConfigView.vue`：角色配置页
   - `ChatView.vue`：聊天页
   - `HistoryView.vue`：历史记录页

2. 状态层
   - `roleStore.js`：角色列表和角色 CRUD
   - `messageStore.js`：消息获取、发送、AI 回复和清空会话

3. 文案层
   - `src/i18n/messages.js`：本地化文案与 `t()` 方法

### 3.2 后端结构

后端按常见 Express 分层组织：

1. 路由层
   - `routes/roleRoutes.js`
   - `routes/chatRoutes.js`
   - `routes/historyRoutes.js`
   - `routes/uploadRoutes.js`

2. 控制器层
   - 接收请求
   - 调用 service
   - 返回统一 JSON 结果

3. 服务层
   - `roleService.js`：角色管理
   - `chatService.js`：会话、消息、流式回复
   - `historyService.js`：历史记录
   - `uploadService.js`：图片上传、消息绑定、文件元数据
   - `aiService.js`：AI 消息组装与调用

4. 基础设施层
   - `utils/db.js`：SQL Server 连接池
   - `utils/loadEnv.js`：环境变量加载

## 4. 实际数据流

### 4.1 角色管理

1. 前端进入首页或角色配置页
2. 调用 `GET /api/roles`
3. 后端从 `roles` 表读取角色列表
4. 前端展示角色卡片

创建、更新、删除分别走：

- `POST /api/roles`
- `PUT /api/roles/:id`
- `DELETE /api/roles/:id`

### 4.2 文本对话

1. 用户在聊天页发送文本
2. 前端先调用 `POST /api/conversations/:roleId/messages` 保存用户消息
3. 后端确保存在当前角色对应的会话记录
4. 后端将消息写入 `messages` 表
5. 前端再通过 `GET /api/conversations/:roleId/stream` 拉取 AI 回复
6. 后端读取最近历史消息，拼接 system prompt 与会话上下文
7. 后端调用 AI 接口
8. 前端逐块显示 AI 回复
9. AI 回复完成后，前端再把最终回复保存回 `messages` 表

### 4.3 图片对话

当前图片对话采用“先上传，再生成图片消息”的方式：

1. 前端选择图片
2. 前端压缩图片
3. 前端调用 `POST /api/upload`，并携带 `role_id`
4. 后端保存图片到本地 `uploads`
5. 后端在同一请求中：
   - 查找或创建会话
   - 创建一条用户图片消息
   - 在 `files` 表中保存文件元数据，并绑定 `message_id`
6. 前端收到后端返回的已持久化消息
7. 前端直接将该消息加入消息列表
8. 前端继续触发 AI 回复流程

## 5. 数据模型

### 5.1 `roles`

角色基础信息：

- `id`
- `name`
- `description`
- `avatar`

### 5.2 `conversations`

会话信息：

- `id`
- `role_id`
- `created_at`

### 5.3 `messages`

消息信息：

- `id`
- `conversation_id`
- `role`，值通常为 `user` 或 `assistant`
- `content`
- `timestamp`

### 5.4 `files`

文件元数据：

- `id`
- `filename`
- `path`
- `url`
- `size`
- `type`
- `message_id`

`files.message_id` 用来把上传文件和具体消息绑定起来。

## 6. API 概览

### 6.1 角色

- `GET /api/roles`
- `GET /api/roles/:id`
- `POST /api/roles`
- `PUT /api/roles/:id`
- `DELETE /api/roles/:id`

### 6.2 对话

- `GET /api/conversations/:roleId/messages`
- `POST /api/conversations/:roleId/messages`
- `GET /api/conversations/:roleId/stream`
- `POST /api/conversations/ai/response`
- `DELETE /api/conversations/:roleId`

### 6.3 上传

- `POST /api/upload`
- `GET /api/upload/:id`
- `DELETE /api/upload/:id`

### 6.4 历史

- `GET /api/history`
- `DELETE /api/history/:roleId`

### 6.5 健康检查

- `GET /api/health`

## 7. 当前实现特点

### 7.1 已修复项

- 前端不再持有模型密钥
- AI 调用会带最近历史消息
- 图片上传已和消息记录、文件元数据绑定
- 角色/会话/历史删除时会同时清理关联 `files` 记录
- 前端文案已抽到本地 `i18n/messages.js`

### 7.2 需要注意的实现细节

- 当前“流式回复”是服务端拿到完整 AI 回复后再分块输出，属于模拟流式，不是上游真流式
- 图片消息目前仍以 Markdown 图片链接的形式写入 `messages.content`
- 历史记录页面是按角色聚合的，不是按独立会话聚合的

## 8. 环境变量

后端环境变量通过以下顺序加载：

1. `backend/.env.local`
2. `backend/.env`

建议只在本地保留 `backend/.env.local`，不要把真实密钥提交进仓库。

后端至少需要：

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ALIYUN_API_KEY`
- `ALIYUN_API_URL`
- `ALIYUN_MODEL`

## 9. 后续建议

优先建议：

1. 把后端模拟流式升级为真正的上游流式转发
2. 为图片消息增加更明确的消息类型字段，而不是只靠 Markdown
3. 增加数据库初始化脚本和建表脚本
4. 增加接口测试和最基本的前端交互测试
5. 将历史记录从“按角色聚合”升级为“按会话聚合”
