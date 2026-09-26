const uploadService = require('../services/uploadService')

exports.uploadFile = async (req, res) => {
  try {
    const file = await uploadService.uploadFile(req, res)
    res.json(file)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getFile = async (req, res) => {
  try {
    const file = await uploadService.getFile(req.params.id)
    res.json(file)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.deleteFile = async (req, res) => {
  try {
    await uploadService.deleteFile(req.params.id)
    res.json({ success: true, message: 'File deleted successfully.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
