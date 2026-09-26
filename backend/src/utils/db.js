const sql = require('mssql')
const loadEnv = require('./loadEnv')

loadEnv()

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}

let pool = null
let connectingPromise = null

const missingKeys = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME'].filter((key) => !process.env[key])
if (missingKeys.length > 0) {
  console.warn(`[DB] Missing env keys: ${missingKeys.join(', ')}`)
}

const connect = async () => {
  if (pool) return pool
  if (connectingPromise) return connectingPromise

  connectingPromise = new sql.ConnectionPool(config)
    .connect()
    .then((connectedPool) => {
      pool = connectedPool
      console.log('SQL Server connected')
      return pool
    })
    .catch((error) => {
      console.error('SQL Server connection failed:', error.message)
      return null
    })
    .finally(() => {
      connectingPromise = null
    })

  return connectingPromise
}

const getPool = async () => {
  const currentPool = await connect()
  if (!currentPool) {
    throw new Error('Database unavailable. Please check backend/.env.local and SQL Server status.')
  }
  return currentPool
}

module.exports = {
  sql,
  getPool
}
