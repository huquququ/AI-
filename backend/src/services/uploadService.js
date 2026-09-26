const { sql, getPool } = require('../utils/db')
const { deleteStoredFiles } = require('../utils/fileStorage')

const parseMessageId = (value) => {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) ? numericValue : null
}

const parseRoleId = (value) => {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) ? numericValue : null
}

const buildFileUrl = (req, filename) => {
  const encodedFilename = encodeURIComponent(filename)
  return `${req.protocol}://${req.get('host')}/uploads/${encodedFilename}`
}

const buildImageMessageContent = (fileUrl, originalName) => {
  const baseName = typeof originalName === 'string' ? originalName.trim() : ''
  const altText = baseName || 'image'
  return `![${altText}](${fileUrl})`
}

const getLatestConversationId = async (executor, roleId) => {
  const conversationResult = await executor
    .request()
    .input('roleId', sql.Int, roleId)
    .query(`
      SELECT TOP 1 id
      FROM conversations
      WHERE role_id = @roleId
      ORDER BY created_at DESC, id DESC
    `)

  if (conversationResult.recordset.length > 0) {
    return conversationResult.recordset[0].id
  }

  const createConversationResult = await executor
    .request()
    .input('roleId', sql.Int, roleId)
    .query('INSERT INTO conversations (role_id) VALUES (@roleId); SELECT SCOPE_IDENTITY() AS id')

  return createConversationResult.recordset[0].id
}

const insertFileRecord = async (executor, fileData) => {
  const result = await executor
    .request()
    .input('filename', sql.NVarChar, fileData.filename)
    .input('path', sql.NVarChar, fileData.path)
    .input('url', sql.NVarChar, fileData.url)
    .input('size', sql.Int, fileData.size)
    .input('type', sql.NVarChar, fileData.type)
    .input('message_id', sql.Int, fileData.messageId)
    .query(
      'INSERT INTO files (filename, path, url, size, type, message_id) VALUES (@filename, @path, @url, @size, @type, @message_id); SELECT SCOPE_IDENTITY() AS id'
    )

  return result.recordset[0].id
}

exports.uploadFile = async (req) => {
  if (!req.file) {
    throw new Error('No file selected')
  }

  const fileUrl = buildFileUrl(req, req.file.filename)
  const messageId = parseMessageId(req.body?.message_id)
  const roleId = parseRoleId(req.body?.role_id)

  if (roleId !== null) {
    const pool = await getPool()
    const transaction = new sql.Transaction(pool)

    await transaction.begin()

    try {
      const conversationId = await getLatestConversationId(transaction, roleId)
      const messageContent = buildImageMessageContent(fileUrl, req.file.originalname)
      const messageResult = await transaction
        .request()
        .input('conversationId', sql.Int, conversationId)
        .input('role', sql.NVarChar, 'user')
        .input('content', sql.NVarChar, messageContent)
        .query(
          'INSERT INTO messages (conversation_id, role, content) VALUES (@conversationId, @role, @content); SELECT SCOPE_IDENTITY() AS id'
        )

      const createdMessageId = Number(messageResult.recordset[0].id)
      const fileId = await insertFileRecord(transaction, {
        filename: req.file.originalname,
        path: req.file.path,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype,
        messageId: createdMessageId
      })

      await transaction.commit()

      return {
        id: fileId,
        filename: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype,
        message: {
          id: createdMessageId,
          conversation_id: conversationId,
          role: 'user',
          content: messageContent,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      await transaction.rollback()
      await deleteStoredFiles([req.file.path])
      throw error
    }
  }

  // Avatar uploads during role creation do not have a message_id.
  // In that case we skip DB insert and only return a usable URL.
  if (messageId === null) {
    return {
      id: Date.now(),
      filename: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      type: req.file.mimetype
    }
  }

  try {
    const pool = await getPool()
    const fileId = await insertFileRecord(pool, {
      filename: req.file.originalname,
      path: req.file.path,
      url: fileUrl,
      size: req.file.size,
      type: req.file.mimetype,
      messageId
    })

    return {
      id: fileId,
      filename: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      type: req.file.mimetype
    }
  } catch (error) {
    console.error('Failed to persist file metadata:', error)
    return {
      id: Date.now(),
      filename: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      type: req.file.mimetype
    }
  }
}

exports.getFile = async (id) => {
  const pool = await getPool()
  const result = await pool.request().input('id', sql.Int, id).query('SELECT * FROM files WHERE id = @id')

  if (result.recordset.length === 0) {
    throw new Error('File not found')
  }

  return result.recordset[0]
}

exports.deleteFile = async (id) => {
  const pool = await getPool()
  const result = await pool.request().input('id', sql.Int, id).query(`
    DELETE FROM files
    OUTPUT deleted.[path]
    WHERE id = @id
  `)

  if (result.recordset.length === 0) {
    throw new Error('File not found')
  }

  await deleteStoredFiles(result.recordset.map((record) => record.path))
}
