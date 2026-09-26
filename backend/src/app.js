const express = require('express')
const cors = require('cors')
const path = require('path')
const loadEnv = require('./utils/loadEnv')

loadEnv()

const app = express()
const PORT = Number(process.env.PORT) || 3000

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/roles', require('./routes/roleRoutes'))
app.use('/api/conversations', require('./routes/chatRoutes'))
app.use('/api/upload', require('./routes/uploadRoutes'))
app.use('/api/history', require('./routes/historyRoutes'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, port: PORT })
})

app.use((err, _req, res, _next) => {
  console.error('Unhandled backend error:', err)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
