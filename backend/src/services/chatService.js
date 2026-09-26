const { sql, getPool } = require('../utils/db')
const { deleteStoredFiles } = require('../utils/fileStorage')
const aiService = require('./aiService')

const HISTORY_LIMIT = 20

const getLatestConversationId = async (pool, roleId) => {
  const conversationResult = await pool
    .request()
    .input('roleId', sql.Int, roleId)
    .query(`
      SELECT id
      FROM conversations
      WHERE role_id = @roleId
      ORDER BY created_at DESC
      OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
    `)

  if (conversationResult.recordset.length > 0) {
    return conversationResult.recordset[0].id
  }

  const createConversationResult = await pool
    .request()
    .input('roleId', sql.Int, roleId)
    .query('INSERT INTO conversations (role_id) VALUES (@roleId); SELECT SCOPE_IDENTITY() AS id')

  return createConversationResult.recordset[0].id
}

const getRoleInfo = async (pool, roleId) => {
  const roleResult = await pool
    .request()
    .input('roleId', sql.Int, roleId)
    .query('SELECT id, name, description FROM roles WHERE id = @roleId')

  if (roleResult.recordset.length === 0) {
    return {
      roleId,
      roleName: 'AI',
      roleDescription: ''
    }
  }

  const role = roleResult.recordset[0]
  return {
    roleId: role.id,
    roleName: role.name,
    roleDescription: role.description || ''
  }
}

const getConversationHistory = async (pool, roleId, limit = HISTORY_LIMIT) => {
  const result = await pool
    .request()
    .input('roleId', sql.Int, roleId)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) m.id, m.role, m.content, m.timestamp
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.role_id = @roleId
      ORDER BY m.timestamp DESC, m.id DESC
    `)

  return result.recordset.reverse()
}

exports.getMessages = async (roleId) => {
  const pool = await getPool()
  const result = await pool
    .request()
    .input('roleId', sql.Int, roleId)
    .query(`
      SELECT m.*
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.role_id = @roleId
      ORDER BY m.timestamp
    `)

  return result.recordset
}

exports.sendMessage = async (roleId, messageData) => {
  const pool = await getPool()
  const conversationId = await getLatestConversationId(pool, roleId)

  const messageResult = await pool
    .request()
    .input('conversationId', sql.Int, conversationId)
    .input('role', sql.NVarChar, messageData.role)
    .input('content', sql.NVarChar, messageData.content)
    .query(
      'INSERT INTO messages (conversation_id, role, content) VALUES (@conversationId, @role, @content); SELECT SCOPE_IDENTITY() AS id'
    )

  return {
    id: messageResult.recordset[0].id,
    conversation_id: conversationId,
    role: messageData.role,
    content: messageData.content,
    timestamp: new Date().toISOString()
  }
}

exports.getStream = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const roleId = Number(req.params.roleId)
  const message = typeof req.query.message === 'string' ? req.query.message.trim() : ''

  if (!message) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Message is required' })}\n\n`)
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
    return
  }

  try {
    const pool = await getPool()
    const roleInfo = await getRoleInfo(pool, roleId)
    const conversationHistory = await getConversationHistory(pool, roleId)
    await aiService.streamAIResponse(message, roleInfo, conversationHistory, req, res)
  } catch (error) {
    console.error('Error in SSE stream:', error)
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
      res.end()
    }
  }
}

exports.clearConversation = async (roleId) => {
  const pool = await getPool()
  const result = await pool
    .request()
    .input('roleId', sql.Int, roleId)
    .query(`
      DECLARE @deletedFilePaths TABLE ([path] NVARCHAR(1000) NOT NULL);

      DELETE FROM files
      OUTPUT deleted.[path] INTO @deletedFilePaths([path])
      WHERE message_id IN (
        SELECT m.id
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.role_id = @roleId
      );
      DELETE FROM messages
      WHERE conversation_id IN (
        SELECT id
        FROM conversations
        WHERE role_id = @roleId
      );
      DELETE FROM conversations
      WHERE role_id = @roleId;

      SELECT [path]
      FROM @deletedFilePaths;
    `)

  await deleteStoredFiles(result.recordset.map((record) => record.path))
}

exports.getAIResponse = async (userMessage, roleInfo) => {
  try {
    const pool = await getPool()
    const conversationHistory = roleInfo?.roleId ? await getConversationHistory(pool, roleInfo.roleId) : []
    return await aiService.getAIResponse(userMessage, roleInfo, conversationHistory)
  } catch (error) {
    console.error('Error getting AI response:', error)
    throw error
  }
}
