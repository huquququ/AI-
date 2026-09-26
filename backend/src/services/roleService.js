const { sql, getPool } = require('../utils/db')
const { deleteStoredFiles } = require('../utils/fileStorage')

exports.getRoles = async () => {
  const pool = await getPool()
  const result = await pool.request().query('SELECT * FROM roles')
  return result.recordset
}

exports.createRole = async (roleData) => {
  const pool = await getPool()
  const result = await pool
    .request()
    .input('name', sql.NVarChar, roleData.name)
    .input('description', sql.NVarChar, roleData.description)
    .input('avatar', sql.NVarChar, roleData.avatar)
    .query('INSERT INTO roles (name, description, avatar) VALUES (@name, @description, @avatar); SELECT SCOPE_IDENTITY() AS id')

  return {
    id: result.recordset[0].id,
    ...roleData
  }
}

exports.updateRole = async (id, roleData) => {
  const pool = await getPool()
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar, roleData.name)
    .input('description', sql.NVarChar, roleData.description)
    .input('avatar', sql.NVarChar, roleData.avatar)
    .query('UPDATE roles SET name = @name, description = @description, avatar = @avatar WHERE id = @id')

  return { id, ...roleData }
}

exports.deleteRole = async (id) => {
  const pool = await getPool()
  const result = await pool.request().input('id', sql.Int, id).query(`
      DECLARE @deletedFilePaths TABLE ([path] NVARCHAR(1000) NOT NULL);

      DELETE FROM files
      OUTPUT deleted.[path] INTO @deletedFilePaths([path])
      WHERE message_id IN (
        SELECT m.id
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.role_id = @id
      );
      DELETE FROM messages
      WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE role_id = @id
      );

      DELETE FROM conversations
      WHERE role_id = @id;

      DELETE FROM roles
      WHERE id = @id;

      SELECT [path]
      FROM @deletedFilePaths;
    `)

  await deleteStoredFiles(result.recordset.map((record) => record.path))
}

exports.getRoleById = async (id) => {
  const pool = await getPool()
  const result = await pool.request().input('id', sql.Int, id).query('SELECT * FROM roles WHERE id = @id')

  if (result.recordset.length === 0) {
    throw new Error('Role not found')
  }

  return result.recordset[0]
}
