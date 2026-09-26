const { sql, getPool } = require('../utils/db')
const { deleteStoredFiles } = require('../utils/fileStorage')

exports.getHistory = async () => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT
      c.role_id,
      r.name as role_name,
      r.avatar as role_avatar,
      MIN(m.timestamp) as first_interaction_time,
      MAX(m.timestamp) as last_interaction_time,
      COUNT(m.id) as message_count,
      (SELECT TOP 1 m2.content FROM messages m2
       JOIN conversations c2 ON m2.conversation_id = c2.id
       WHERE c2.role_id = c.role_id
       ORDER BY m2.timestamp DESC) as last_message
    FROM conversations c
    JOIN roles r ON c.role_id = r.id
    JOIN messages m ON c.id = m.conversation_id
    GROUP BY c.role_id, r.name, r.avatar
    ORDER BY last_interaction_time DESC
  `)

  return result.recordset
}

exports.deleteHistory = async (roleId) => {
  const pool = await getPool()
  const result = await pool.request().input('roleId', sql.Int, roleId).query(`
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
        SELECT id FROM conversations
        WHERE role_id = @roleId
      );
      DELETE FROM conversations
      WHERE role_id = @roleId;

      SELECT [path]
      FROM @deletedFilePaths;
    `)

  await deleteStoredFiles(result.recordset.map((record) => record.path))
}
