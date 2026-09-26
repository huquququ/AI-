const chatService = require('../services/chatService')

exports.getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(req.params.roleId)
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const message = await chatService.sendMessage(req.params.roleId, req.body)
    res.status(201).json(message)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getStream = async (req, res) => {
  try {
    await chatService.getStream(req, res)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAIResponse = async (req, res) => {
  try {
    const { message, roleId, roleName, roleDescription } = req.body
    const aiResponse = await chatService.getAIResponse(message, { roleId, roleName, roleDescription })
    res.json({ response: aiResponse })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.clearConversation = async (req, res) => {
  try {
    await chatService.clearConversation(req.params.roleId)
    res.json({ success: true, message: 'Conversation cleared successfully.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
