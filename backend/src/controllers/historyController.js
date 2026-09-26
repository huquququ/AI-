const historyService = require('../services/historyService')

exports.getHistory = async (req, res) => {
  try {
    const history = await historyService.getHistory()
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteHistory = async (req, res) => {
  try {
    await historyService.deleteHistory(req.params.roleId)
    res.json({ success: true, message: 'History deleted successfully.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
