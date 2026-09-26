const axios = require('axios')

const DEFAULT_TIMEOUT_MS = 60000

class AIService {
  buildUserContent(message) {
    const rawMessage = typeof message === 'string' ? message : ''
    const imageUrls = []
    const imageRegex = /!\[.*?\]\((.*?)\)/g

    let match = imageRegex.exec(rawMessage)
    while (match) {
      imageUrls.push(match[1])
      match = imageRegex.exec(rawMessage)
    }

    const textMessage = rawMessage.replace(/!\[.*?\]\(.*?\)/g, '').trim()

    return imageUrls.length > 0
      ? `[User shared image URLs: ${imageUrls.join(', ')}]\n${textMessage || 'Please analyze the image content.'}`
      : rawMessage
  }

  buildMessages(userMessage, roleInfo, conversationHistory = []) {
    const messages = []
    const roleName = roleInfo?.roleName || 'AI assistant'
    const roleDescription = roleInfo?.roleDescription || ''
    const systemPrompt = roleDescription
      ? `You are ${roleName}. Stay fully in character. Character setting: ${roleDescription}`
      : `You are ${roleName}. Reply naturally and stay consistent with the conversation.`

    messages.push({
      role: 'system',
      content: systemPrompt
    })

    const normalizedHistory = conversationHistory
      .map((message) => {
        const role = message?.role === 'assistant' ? 'assistant' : message?.role === 'user' ? 'user' : null
        if (!role) {
          return null
        }

        const contentSource = typeof message?.content === 'string' ? message.content : ''
        const content = role === 'user' ? this.buildUserContent(contentSource) : contentSource.trim()
        if (!content) {
          return null
        }

        return { role, content }
      })
      .filter(Boolean)

    messages.push(...normalizedHistory)

    const currentUserContent = this.buildUserContent(userMessage)
    const latestHistoryMessage = normalizedHistory[normalizedHistory.length - 1]
    const alreadyIncluded =
      latestHistoryMessage &&
      latestHistoryMessage.role === 'user' &&
      latestHistoryMessage.content === currentUserContent

    if (!alreadyIncluded && currentUserContent.trim()) {
      messages.push({
        role: 'user',
        content: currentUserContent
      })
    }

    return messages
  }

  async getAIResponse(userMessage, roleInfo, conversationHistory = []) {
    const apiUrl = process.env.ALIYUN_API_URL
    const apiKey = process.env.ALIYUN_API_KEY
    const model = process.env.ALIYUN_MODEL

    if (!apiUrl || !apiKey || !model) {
      throw new Error('Missing AI configuration: ALIYUN_API_URL / ALIYUN_API_KEY / ALIYUN_MODEL')
    }

    const messages = this.buildMessages(userMessage, roleInfo, conversationHistory)

    try {
      const response = await axios.post(
        apiUrl,
        {
          model,
          messages,
          temperature: 0.7,
          top_p: 0.95
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          timeout: DEFAULT_TIMEOUT_MS
        }
      )

      const content = response.data?.choices?.[0]?.message?.content
      if (typeof content === 'string') {
        return content
      }

      throw new Error('Unexpected AI response format')
    } catch (error) {
      const detail = error.response?.data || error.message
      console.error('AI service error:', detail)
      throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch AI response')
    }
  }

  async streamAIResponse(userMessage, roleInfo, conversationHistory, req, res) {
    let timer = null

    try {
      const fullResponse = await this.getAIResponse(userMessage, roleInfo, conversationHistory)
      const output = fullResponse || 'AI response was empty. Please retry.'
      let cursor = 0

      timer = setInterval(() => {
        if (res.writableEnded) {
          clearInterval(timer)
          return
        }

        if (cursor >= output.length) {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          clearInterval(timer)
          res.end()
          return
        }

        const chunkSize = Math.min(Math.floor(Math.random() * 4) + 1, output.length - cursor)
        const chunk = output.slice(cursor, cursor + chunkSize)
        cursor += chunkSize
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
      }, 45)

      req.on('close', () => {
        if (timer) {
          clearInterval(timer)
        }
        if (!res.writableEnded) {
          res.end()
        }
      })
    } catch (error) {
      if (timer) {
        clearInterval(timer)
      }
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
        res.end()
      }
      throw error
    }
  }
}

module.exports = new AIService()
