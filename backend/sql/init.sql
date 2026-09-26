SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.roles', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.roles (
      id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      description NVARCHAR(MAX) NULL,
      avatar NVARCHAR(1000) NULL
    );
  END;

  IF OBJECT_ID(N'dbo.conversations', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.conversations (
      id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      role_id INT NOT NULL,
      created_at DATETIME2(3) NOT NULL
        CONSTRAINT DF_conversations_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT FK_conversations_role
        FOREIGN KEY (role_id) REFERENCES dbo.roles(id) ON DELETE CASCADE
    );
  END;

  IF OBJECT_ID(N'dbo.messages', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.messages (
      id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      conversation_id INT NOT NULL,
      role NVARCHAR(50) NOT NULL,
      content NVARCHAR(MAX) NOT NULL,
      [timestamp] DATETIME2(3) NOT NULL
        CONSTRAINT DF_messages_timestamp DEFAULT SYSUTCDATETIME(),
      CONSTRAINT FK_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES dbo.conversations(id) ON DELETE CASCADE
    );
  END;

  IF OBJECT_ID(N'dbo.files', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.files (
      id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      filename NVARCHAR(255) NOT NULL,
      [path] NVARCHAR(1000) NOT NULL,
      [url] NVARCHAR(1000) NOT NULL,
      [size] INT NOT NULL,
      [type] NVARCHAR(255) NOT NULL,
      message_id INT NOT NULL,
      CONSTRAINT FK_files_message
        FOREIGN KEY (message_id) REFERENCES dbo.messages(id) ON DELETE CASCADE
    );
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_conversations_role_id_created_at_id'
      AND object_id = OBJECT_ID(N'dbo.conversations')
  )
  BEGIN
    CREATE INDEX IX_conversations_role_id_created_at_id
      ON dbo.conversations (role_id, created_at DESC, id DESC);
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_messages_conversation_id_timestamp_id'
      AND object_id = OBJECT_ID(N'dbo.messages')
  )
  BEGIN
    CREATE INDEX IX_messages_conversation_id_timestamp_id
      ON dbo.messages (conversation_id, [timestamp], id)
      INCLUDE (role, content);
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_files_message_id'
      AND object_id = OBJECT_ID(N'dbo.files')
  )
  BEGIN
    CREATE INDEX IX_files_message_id
      ON dbo.files (message_id);
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  THROW;
END CATCH;
