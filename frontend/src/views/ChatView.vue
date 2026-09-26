<template>
  <div class="chat-page">
    <aside class="chat-showcase surface-panel">
      <div class="chat-showcase-media">
        <div class="chat-portrait-shell">
          <img
            :src="currentRole?.avatar || defaultAvatar"
            :alt="currentRole?.name || t('chat.defaultTitle')"
            class="chat-portrait"
          >
          <div class="chat-portrait-shadow"></div>
        </div>
      </div>

      <div class="chat-showcase-copy">
        <span class="soft-badge">
          <span class="status-dot" :class="{ online: isConnected }"></span>
          {{ isConnected ? t('chat.online') : t('chat.connecting') }}
        </span>
        <h1>{{ currentRole?.name || t('chat.defaultTitle') }}</h1>
        <p>{{ currentRole?.description || t('home.noDescription') }}</p>
      </div>

      <div class="chat-showcase-actions">
        <button class="btn btn-secondary" @click="goBack">{{ t('chat.back') }}</button>
        <button class="btn btn-secondary" @click="clearChat">{{ t('chat.clear') }}</button>
        <button class="btn btn-ghost" @click="toggleSettings">{{ t('chat.settings') }}</button>
      </div>
    </aside>

    <section class="chat-panel surface-panel">
      <div class="chat-ambient"></div>

      <div class="chat-body">
        <div v-if="messageStore.loading" class="loading-container">
          <div class="loading"></div>
          <p>{{ t('chat.loadingMessages') }}</p>
        </div>

        <div v-else-if="messages.length === 0" class="empty-chat">
          <div class="empty-chat-icon">{{ t('chat.emptyIcon') }}</div>
          <h3>{{ t('chat.emptyTitle') }}</h3>
          <p>{{ t('chat.emptyDescription', { roleName: currentRole?.name || t('chat.defaultTitle') }) }}</p>
        </div>

        <div v-else class="message-list">
          <article
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="message.role === 'user' ? 'is-user' : 'is-ai'"
          >
            <div class="message-avatar">
              {{ message.role === 'user' ? '你' : roleInitial }}
            </div>

            <div class="message-stack">
              <div class="message-name">
                {{ message.role === 'user' ? '你' : currentRole?.name || t('chat.defaultTitle') }}
              </div>

              <div class="message-bubble" :class="message.role === 'user' ? 'user-message' : 'ai-message'">
                <div class="message-content">
                  <template
                    v-for="(part, partIndex) in parseContent(message.content)"
                    :key="`${message.id}-${partIndex}`"
                  >
                    <span v-if="part.type === 'text'" class="message-text">{{ part.content }}</span>
                    <img
                      v-else
                      :src="part.src"
                      :alt="part.alt || 'image'"
                      class="message-image"
                      loading="lazy"
                    >
                  </template>
                </div>
              </div>

              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <span v-if="message.status === 'sending'" class="message-status sending">{{ t('chat.sending') }}</span>
                <span v-else-if="message.status === 'failed'" class="message-status failed">{{ t('chat.failed') }}</span>
                <span v-else-if="message.status === 'streaming'" class="message-status streaming">
                  <span class="loading loading-sm"></span>
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="chat-input-area">
        <form class="chat-input-form" @submit.prevent="sendMessage">
          <div class="chat-input-shell">
            <textarea
              ref="chatInputRef"
              v-model="inputMessage"
              class="chat-input"
              :placeholder="t('chat.inputPlaceholder')"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift="$event.target.value += '\n'"
            ></textarea>

            <div class="chat-input-actions">
              <button type="button" class="btn btn-secondary btn-sm" @click="selectImage">
                {{ t('chat.image') }}
              </button>
              <input
                ref="fileInput"
                type="file"
                class="file-input"
                accept="image/*"
                @change="uploadImage"
              >
              <button type="submit" class="btn btn-primary" :disabled="!inputMessage.trim() || messageStore.loading">
                {{ t('chat.send') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useRoleStore } from '../stores/roleStore'
import { useMessageStore } from '../stores/messageStore'
import { t } from '../i18n/messages'

const router = useRouter()
const route = useRoute()
const roleStore = useRoleStore()
const messageStore = useMessageStore()

const inputMessage = ref('')
const fileInput = ref(null)
const chatInputRef = ref(null)
const isConnected = ref(false)
const removePasteListener = ref(() => {})

const defaultAvatar =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20avatar%20for%20role%20play%20character&image_size=square'

const roleId = computed(() => route.params.roleId)
const currentRole = computed(() => roleStore.getRoleById(roleId.value))
const messages = computed(() => messageStore.getMessagesByRoleId(roleId.value))
const roleInitial = computed(() => currentRole.value?.name?.slice(0, 1) || '角')

const scrollToBottom = () => {
  const chatBody = document.querySelector('.chat-body')
  if (chatBody) {
    chatBody.scrollTop = chatBody.scrollHeight
  }
}

const goBack = () => {
  router.push('/')
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || messageStore.loading) return
  const message = inputMessage.value.trim()
  inputMessage.value = ''
  await messageStore.sendMessage(roleId.value, message)
}

const selectImage = () => {
  fileInput.value?.click()
}

const uploadImage = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  await handleImageUpload(file)
}

const handleImageUpload = async (file) => {
  try {
    const compressedFile = await compressImage(file)
    const formData = new FormData()
    formData.append('file', compressedFile)
    formData.append('role_id', roleId.value)

    const response = await axios.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const createdMessage = response.data?.message
    if (!createdMessage?.id || !createdMessage?.content) {
      throw new Error(t('chat.uploadMessageMissing'))
    }

    messageStore.appendPersistedMessage(roleId.value, createdMessage)
    await messageStore.getAIResponse(roleId.value, createdMessage.content)
  } catch (error) {
    console.error('Failed to upload image:', error)
    alert(t('chat.uploadFailed'))
  } finally {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const compressImage = (file) =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const maxWidth = 800
      const maxHeight = 600
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(compressedFile)
        },
        file.type,
        0.8
      )
    }

    img.src = URL.createObjectURL(file)
  })

const handlePaste = async (event) => {
  const items = event.clipboardData?.items || []
  for (let i = 0; i < items.length; i += 1) {
    if (!items[i].type.startsWith('image/')) continue
    const file = items[i].getAsFile()
    if (!file) continue
    event.preventDefault()
    await handleImageUpload(file)
    break
  }
}

const setupPasteListener = () => {
  const input = chatInputRef.value
  if (!input) {
    return () => {}
  }
  input.addEventListener('paste', handlePaste)
  return () => input.removeEventListener('paste', handlePaste)
}

const clearChat = async () => {
  if (confirm(t('chat.clearConfirm'))) {
    await messageStore.clearMessages(roleId.value)
  }
}

const toggleSettings = () => {
  console.log(t('chat.settingsTodo'))
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const parseContent = (content) => {
  const source = typeof content === 'string' ? content : ''
  const parts = []
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match = imageRegex.exec(source)

  while (match) {
    const [fullMatch, alt, src] = match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: source.slice(lastIndex, match.index)
      })
    }

    const isAllowedSrc = /^(https?:\/\/|\/uploads\/)/i.test(src)
    if (isAllowedSrc) {
      parts.push({
        type: 'image',
        alt: alt || '',
        src
      })
    } else {
      parts.push({
        type: 'text',
        content: fullMatch
      })
    }

    lastIndex = match.index + fullMatch.length
    match = imageRegex.exec(source)
  }

  if (lastIndex < source.length) {
    parts.push({
      type: 'text',
      content: source.slice(lastIndex)
    })
  }

  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: source
    })
  }

  return parts
}

watch(
  messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

onMounted(async () => {
  await roleStore.fetchRoles()
  await messageStore.fetchMessages(roleId.value)
  isConnected.value = true
  removePasteListener.value = setupPasteListener()
  scrollToBottom()
})

onUnmounted(() => {
  removePasteListener.value()
})
</script>

<style scoped>
.chat-page {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: var(--spacing-lg);
  width: min(1320px, calc(100% - 32px));
  margin: 0 auto;
  min-height: calc(100vh - 150px);
}

.chat-showcase,
.chat-panel {
  padding: 22px;
}

.chat-showcase {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  align-self: start;
  position: sticky;
  top: 106px;
}

.chat-showcase-media {
  position: relative;
}

.chat-portrait-shell {
  position: relative;
  overflow: hidden;
  border-radius: 30px;
  background:
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.9), transparent 34%),
    linear-gradient(180deg, rgba(244, 233, 242, 0.98), rgba(245, 240, 234, 0.92));
  min-height: 420px;
  padding: 18px;
}

.chat-portrait {
  width: 100%;
  height: 420px;
  border-radius: 24px;
  object-fit: cover;
}

.chat-portrait-shadow {
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 14px;
  height: 34px;
  border-radius: 50%;
  background: rgba(214, 194, 202, 0.34);
  filter: blur(20px);
}

.chat-showcase-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-showcase-copy h1 {
  font-size: clamp(2rem, 3vw, 2.8rem);
  line-height: 1.1;
}

.chat-showcase-copy p {
  color: var(--text-secondary);
  line-height: 1.8;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(210, 198, 209, 0.88);
}

.status-dot.online {
  background: var(--secondary-color);
  box-shadow: 0 0 0 6px rgba(191, 216, 204, 0.28);
}

.chat-showcase-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 150px);
  position: relative;
  overflow: hidden;
}

.chat-ambient {
  position: absolute;
  top: -48px;
  right: 8%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(220, 211, 240, 0.18);
  filter: blur(14px);
  pointer-events: none;
}

.chat-body {
  flex: 1;
  min-height: 420px;
  max-height: calc(100vh - 380px);
  overflow-y: auto;
  padding: 10px 10px 18px 2px;
  margin-right: -4px;
  position: relative;
  z-index: 1;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.message-list::before {
  content: '';
  display: block;
  width: 100%;
  height: 8px;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: floatUp var(--transition-normal) both;
}

.message-item.is-user {
  justify-content: flex-end;
}

.message-item.is-user .message-avatar {
  order: 2;
  background:
    linear-gradient(135deg, rgba(250, 221, 226, 0.95), rgba(224, 232, 245, 0.85));
}

.message-item.is-user .message-stack {
  align-items: flex-end;
}

.message-item.is-user .message-bubble {
  border-bottom-right-radius: 18px;
}

.message-item.is-ai .message-bubble {
  border-bottom-left-radius: 18px;
}

.message-avatar {
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(191, 216, 204, 0.92), rgba(240, 235, 250, 0.88));
  box-shadow: var(--shadow-xs);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.message-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: min(78%, 720px);
}

.message-name {
  padding: 0 10px;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.message-bubble {
  position: relative;
  padding: 16px 18px;
  border-radius: 28px;
  box-shadow:
    var(--shadow-sm),
    var(--shadow-inset);
}

.user-message {
  background:
    linear-gradient(135deg, rgba(245, 220, 226, 0.98), rgba(239, 233, 251, 0.92));
  color: var(--text-primary);
}

.ai-message {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 248, 243, 0.92));
  color: var(--text-primary);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  line-height: 1.75;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-image {
  max-width: min(100%, 360px);
  max-height: 280px;
  border-radius: 22px;
  box-shadow: var(--shadow-sm);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

.message-status.sending {
  color: var(--text-secondary);
}

.message-status.failed {
  color: #b67b8c;
}

.message-status.streaming {
  display: inline-flex;
  align-items: center;
}

.chat-input-area {
  position: relative;
  z-index: 1;
  padding-top: var(--spacing-md);
}

.chat-input-form,
.chat-input-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-input-shell {
  padding: 14px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 247, 241, 0.92));
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow: var(--shadow-sm);
}

.chat-input {
  min-height: 110px;
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 8px 10px;
  resize: none;
}

.chat-input:focus {
  border: none;
  box-shadow: none;
}

.chat-input-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  align-items: center;
}

.file-input {
  display: none;
}

.empty-chat,
.loading-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-chat-icon {
  margin-bottom: 14px;
  font-size: 2.5rem;
}

.empty-chat {
  padding: 28px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 248, 243, 0.66));
  border: 1px solid rgba(255, 255, 255, 0.72);
}

.empty-chat h3 {
  margin-bottom: 8px;
  font-size: 1.5rem;
}

.empty-chat p,
.loading-container p {
  color: var(--text-secondary);
}

@media (max-width: 1100px) {
  .chat-page {
    grid-template-columns: 1fr;
  }

  .chat-showcase {
    position: static;
  }

  .chat-portrait-shell,
  .chat-portrait {
    min-height: 320px;
    height: 320px;
  }

  .chat-panel {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .chat-page {
    width: min(100% - 20px, 1320px);
  }

  .chat-showcase,
  .chat-panel {
    padding: 16px;
  }

  .chat-showcase-actions,
  .chat-input-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-body {
    max-height: none;
    min-height: 360px;
  }

  .message-stack {
    max-width: calc(100% - 54px);
  }
}
</style>
