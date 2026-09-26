# Database Notes

## Current schema

The backend currently depends on four SQL Server tables:

- `roles`
- `conversations`
- `messages`
- `files`

Initialization script:

- [backend/sql/init.sql](/D:/文件7号/AI对话平台/roleplay-ai/backend/sql/init.sql)

## Table mapping

`roles`

- Stores character metadata.
- Fields used by code: `id`, `name`, `description`, `avatar`

`conversations`

- Stores one or more chat sessions under a role.
- Fields used by code: `id`, `role_id`, `created_at`

`messages`

- Stores user and assistant messages.
- Fields used by code: `id`, `conversation_id`, `role`, `content`, `timestamp`

`files`

- Stores uploaded file metadata linked to a message.
- Fields used by code: `id`, `filename`, `path`, `url`, `size`, `type`, `message_id`

## Constraints and indexes

Foreign keys:

- `conversations.role_id -> roles.id`
- `messages.conversation_id -> conversations.id`
- `files.message_id -> messages.id`

Indexes:

- `IX_conversations_role_id_created_at_id`
- `IX_messages_conversation_id_timestamp_id`
- `IX_files_message_id`

The current application still performs explicit delete cleanup in the service layer. The schema also uses `ON DELETE CASCADE` as a safety net to keep related rows consistent.
