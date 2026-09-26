# Backend Setup

## Requirements

- Node.js 18+
- SQL Server
- A database already created for `DB_NAME`

## Environment

Copy `backend/.env.example` to `backend/.env.local` and fill in:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ALIYUN_API_KEY`
- `ALIYUN_API_URL`
- `ALIYUN_MODEL`

The backend loads env files in this order:

1. `backend/.env.local`
2. `backend/.env`

Keep real secrets only in `backend/.env.local`.

## Database initialization

Run [sql/init.sql](/D:/文件7号/AI对话平台/roleplay-ai/backend/sql/init.sql) against the database configured by `DB_NAME`.

You can execute it with:

- SQL Server Management Studio
- Azure Data Studio
- `sqlcmd`

Example:

```powershell
sqlcmd -S localhost -d roleplay_ai -U sa -P "<password>" -i backend/sql/init.sql
```

The script is idempotent for the current schema:

- `roles`
- `conversations`
- `messages`
- `files`

It also creates the indexes used by the service layer:

- `IX_conversations_role_id_created_at_id`
- `IX_messages_conversation_id_timestamp_id`
- `IX_files_message_id`

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

Health check:

```text
GET /api/health
```
