# 角色扮演 AI 对话平台模块设计

## 1. 设计目标

模块设计的目标是让前后端职责清晰、数据流稳定，并保持后续功能扩展时的可维护性。

当前项目围绕四个核心模块展开：

- 角色配置模块
- 对话模块
- 上传模块
- 历史记录模块

## 2. 角色配置模块

### 2.1 功能职责

- 获取角色列表
- 创建角色
- 更新角色
- 删除角色
- 上传并设置角色头像

### 2.2 前端实现

主要文件：

- `src/views/HomeView.vue`
- `src/views/RoleConfigView.vue`
- `src/stores/roleStore.js`

前端行为：

1. 首页加载角色列表
2. 角色配置页根据 `query.id` 判断是创建还是编辑
3. 头像上传通过 `/api/upload` 完成
4. 成功后把返回的 `url` 写回表单

### 2.3 后端实现

主要文件：

- `src/routes/roleRoutes.js`
- `src/controllers/roleController.js`
- `src/services/roleService.js`

后端职责：

- 对 `roles` 表执行 CRUD
- 删除角色时，级联清理该角色关联的会话、消息和文件元数据

## 3. 对话模块

### 3.1 功能职责

- 获取某个角色的全部消息
- 发送用户消息
- 获取 AI 回复
- 清空当前角色下的会话消息

### 3.2 前端实现

主要文件：

- `src/views/ChatView.vue`
- `src/stores/messageStore.js`

前端职责：

1. 获取当前角色消息列表
2. 本地插入一条发送中的用户消息
3. 调用保存消息接口
4. 建立 SSE 连接接收 AI 回复
5. AI 完成后再保存 assistant 消息

### 3.3 后端实现

主要文件：

- `src/routes/chatRoutes.js`
- `src/controllers/chatController.js`
- `src/services/chatService.js`
- `src/services/aiService.js`

后端职责：

- 根据 `roleId` 查找最近一条会话，没有则新建
- 保存消息到 `messages`
- 读取最近历史上下文
- 生成角色 system prompt
- 调用 AI 接口
- 以 SSE 形式返回分块内容

### 3.4 当前限制

- 会话上下文目前是按“最近若干条消息”裁剪
- 模拟流式仍然不是上游真流式
- assistant 消息是由前端在流式完成后再回存

## 4. 上传模块

### 4.1 功能职责

- 上传角色头像
- 上传聊天图片
- 保存文件元数据
- 将聊天图片和具体消息绑定

### 4.2 路由和文件

主要文件：

- `src/routes/uploadRoutes.js`
- `src/controllers/uploadController.js`
- `src/services/uploadService.js`

### 4.3 两种上传模式

#### 4.3.1 头像上传

特点：

- 不带 `message_id`
- 也不带 `role_id`
- 后端只保存文件到本地并返回可访问 URL
- 不强制写入 `files` 表

适用场景：

- 创建角色
- 编辑角色头像

#### 4.3.2 聊天图片上传

特点：

- 前端携带 `role_id`
- 后端在单次请求里完成：
  - 上传文件
  - 创建用户图片消息
  - 保存 `files` 元数据
  - 把 `files.message_id` 绑定到新消息

这样做的好处：

- 不会出现文件已经上传但消息记录缺失
- 删除会话或角色时能追踪并清理关联文件记录

## 5. 历史记录模块

### 5.1 功能职责

- 查询全部角色历史摘要
- 删除某个角色对应的历史消息

### 5.2 后端聚合逻辑

主要文件：

- `src/routes/historyRoutes.js`
- `src/controllers/historyController.js`
- `src/services/historyService.js`

当前聚合字段包括：

- `role_id`
- `role_name`
- `role_avatar`
- `first_interaction_time`
- `last_interaction_time`
- `message_count`
- `last_message`

### 5.3 当前行为

- 历史是“按角色聚合”，不是“按会话聚合”
- 删除某条历史，会清理该角色下所有会话消息和文件记录

## 6. 文案模块

### 6.1 目标

由于项目里出现过多次文本编码污染，当前前端文案采用“本地字典 + `t()`”方式统一管理。

### 6.2 位置

- `src/i18n/messages.js`

### 6.3 当前策略

- 所有核心界面文案集中管理
- 中文文案使用 Unicode 转义，避免编码链路再次破坏源码
- 组件内部只调用 `t('path.to.key')`

## 7. 模块依赖关系

模块之间的主要依赖如下：

1. 角色配置模块为对话模块提供角色信息
2. 对话模块依赖上传模块处理图片消息
3. 历史记录模块依赖对话模块的数据表
4. AI 服务模块依赖角色信息和历史消息
5. 上传模块依赖会话与消息模块生成消息绑定关系

可简化理解为：

`角色 -> 对话 -> AI`

`对话 -> 上传 -> 文件元数据`

`对话 -> 历史`

## 8. 当前代码和设计的一致性

这份模块设计文档以当前代码实现为准，不再沿用旧版本中的以下过时描述：

- 不再描述为 MySQL/MongoDB
- 不再描述为 NestJS
- 不再把图片理解写成“天然多模态结构化消息”
- 不再把流式回复写成“已实现真流式”

## 9. 后续演进建议

### 9.1 高优先级

- 把聊天和历史从“按角色”扩展为“按会话”
- 增加消息类型字段，例如 `text` / `image`
- 把文件删除扩展到物理文件层，而不只是删除数据库记录

### 9.2 中优先级

- 支持更多语言包
- 把聊天页面组件进一步拆分
- 增加统一 API 错误码

### 9.3 低优先级

- 把本地 `t()` 升级成完整 i18n 方案
- 为文档增加接口示例与时序图
