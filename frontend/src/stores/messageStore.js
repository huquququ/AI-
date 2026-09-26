import { defineStore } from 'pinia'
import axios from 'axios'
import { t } from '../i18n/messages'

const normalizeRoleKey = (roleId) => String(roleId)

const scrollChatToBottom = () => {
  setTimeout(() => {
    const chatBody = document.querySelector('.chat-body')
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight
    }
  }, 60)
}

export const useMessageStore = defineStore('message', {
  state: () => ({
    messages: {},
    loading: false,
    error: null
  }),

  getters: {
    getMessagesByRoleId: (state) => (roleId) => {
      return state.messages[normalizeRoleKey(roleId)] || []
    }
  },

  actions: {
    ensureRoleMessages(roleId) {
      const roleKey = normalizeRoleKey(roleId)
      if (!this.messages[roleKey]) {
        this.messages[roleKey] = []
      }
      return roleKey
    },

    appendPersistedMessage(roleId, message) {
      const roleKey = this.ensureRoleMessages(roleId)
      const existingIndex = this.messages[roleKey].findIndex((item) => item.id === message.id)
      const normalizedMessage = { ...message, status: 'sent' }

      if (existingIndex === -1) {
        this.messages[roleKey].push(normalizedMessage)
      } else {
        this.messages[roleKey][existingIndex] = normalizedMessage
      }

      scrollChatToBottom()
    },

    async fetchMessages(roleId) {
      this.loading = true
      this.error = null
      const roleKey = this.ensureRoleMessages(roleId)

      try {
        const response = await axios.get(`/api/conversations/${roleId}/messages`)
        this.messages[roleKey] = response.data
      } catch (error) {
        this.error = error.message
        console.error('Failed to fetch messages:', error)
      } finally {
        this.loading = false
      }
    },

    async sendMessage(roleId, content) {
      const roleKey = this.ensureRoleMessages(roleId)
      this.loading = true
      this.error = null

      const localUserMessage = {
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        status: 'sending'
      }

      this.messages[roleKey].push(localUserMessage)
      scrollChatToBottom()

      try {
        const response = await axios.post(`/api/conversations/${roleId}/messages`, {
          role: 'user',
          content
        })

        const localIndex = this.messages[roleKey].findIndex((msg) => msg.id === localUserMessage.id)
        if (localIndex !== -1) {
          this.messages[roleKey][localIndex] = { ...response.data, status: 'sent' }
        }

        await this.getAIResponse(roleId, content)
        return response.data
      } catch (error) {
        this.error = error.message
        console.error('Failed to send message:', error)

        const localIndex = this.messages[roleKey].findIndex((msg) => msg.id === localUserMessage.id)
        if (localIndex !== -1) {
          this.messages[roleKey][localIndex].status = 'failed'
        }

        throw error
      } finally {
        this.loading = false
      }
    },

    async getAIResponse(roleId, userMessage) {
      const roleKey = this.ensureRoleMessages(roleId)

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        status: 'streaming'
      }
      this.messages[roleKey].push(aiMessage)
      scrollChatToBottom()

      const persistAIMessage = async (content) => {
        if (!content?.trim()) return
        await axios.post(`/api/conversations/${roleId}/messages`, {
          role: 'assistant',
          content
        })
      }

      const streamBySSE = () =>
        new Promise((resolve, reject) => {
          if (typeof EventSource === 'undefined') {
            reject(new Error('当前环境不支持 EventSource'))
            return
          }

          const streamUrl = `/api/conversations/${roleId}/stream?message=${encodeURIComponent(userMessage)}`
          const eventSource = new EventSource(streamUrl)
          let isClosed = false

          const close = () => {
            if (isClosed) return
            isClosed = true
            eventSource.close()
          }

          eventSource.onmessage = async (event) => {
            try {
              const data = JSON.parse(event.data)

              if (data.type === 'chunk') {
                aiMessage.content += data.content || ''
                scrollChatToBottom()
                return
              }

              if (data.type === 'done') {
                close()
                resolve(aiMessage.content)
                return
              }

              if (data.type === 'error') {
                close()
                reject(new Error(data.message || 'AI 流式响应失败'))
              }
            } catch (error) {
              close()
              reject(error)
            }
          }

          eventSource.onerror = () => {
            close()
            reject(new Error('AI 流式连接失败'))
          }
        })

      try {
        const streamedContent = await streamBySSE()
        aiMessage.content = streamedContent || ''
        aiMessage.status = 'completed'
        await persistAIMessage(aiMessage.content)
      } catch (streamError) {
        console.warn('SSE 失败，回退到普通响应:', streamError.message)
        try {
          const roleResponse = await axios.get(`/api/roles/${roleId}`)
          const roleInfo = roleResponse.data
          const fallbackResponse = await axios.post('/api/conversations/ai/response', {
            message: userMessage,
            roleId,
            roleName: roleInfo.name,
            roleDescription: roleInfo.description
          })

          aiMessage.content = fallbackResponse.data?.response || t('message.aiFailed')
          aiMessage.status = 'completed'
          await persistAIMessage(aiMessage.content)
        } catch (error) {
          aiMessage.status = 'failed'
          aiMessage.content = `${t('message.aiFailed')}${error?.message ? ` (${error.message})` : ''}`
          this.error = error.message
          console.error('获取 AI 响应失败:', error)
        }
      } finally {
        scrollChatToBottom()
      }
    },

    async clearMessages(roleId) {
      this.loading = true
      this.error = null
      const roleKey = normalizeRoleKey(roleId)

      try {
        await axios.delete(`/api/conversations/${roleId}`)
        delete this.messages[roleKey]
      } catch (error) {
        this.error = error.message
        console.error('Failed to clear messages:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
