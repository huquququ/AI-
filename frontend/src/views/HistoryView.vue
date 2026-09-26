<template>
  <div class="history-page">
    <div class="container history-stack">
      <section class="history-hero surface-panel">
        <div class="history-hero-copy">
          <h1 class="page-title">{{ t('history.title') }}</h1>
          <p>{{ t('history.emptyDescription') }}</p>
        </div>

        <router-link to="/" class="btn btn-secondary">
          {{ t('history.backHome') }}
        </router-link>
      </section>

      <div v-if="isLoading" class="loading-container">
        <div class="loading"></div>
        <p>{{ t('history.loading') }}</p>
      </div>

      <div v-else-if="history.length === 0" class="empty-state">
        <div class="empty-icon">{{ t('history.emptyIcon') }}</div>
        <h3>{{ t('history.emptyTitle') }}</h3>
        <p>{{ t('history.emptyDescription') }}</p>
        <router-link to="/" class="btn btn-primary">
          {{ t('history.startChat') }}
        </router-link>
      </div>

      <div v-else class="history-list">
        <article
          v-for="item in history"
          :key="item.role_id"
          class="history-item history-card"
        >
          <div class="history-item-header">
            <img
              :src="item.role_avatar || defaultAvatar"
              :alt="item.role_name"
              class="history-item-avatar"
            >
            <div class="history-item-info">
              <h3>{{ item.role_name }}</h3>
              <div class="interaction-info">
                <span class="info-label">{{ t('history.firstChat') }}</span>
                <span class="info-value">{{ formatTime(item.first_interaction_time) }}</span>
              </div>
              <div class="interaction-info">
                <span class="info-label">{{ t('history.latestChat') }}</span>
                <span class="info-value">{{ formatTime(item.last_interaction_time) }}</span>
              </div>
              <div class="interaction-info">
                <span class="info-label">{{ t('history.messages') }}</span>
                <span class="info-value">{{ item.message_count }}</span>
              </div>
            </div>
          </div>

          <div class="history-item-content">
            <p class="history-item-message">{{ item.last_message }}</p>
          </div>

          <div class="history-item-actions">
            <router-link
              :to="`/chat/${item.role_id}`"
              class="btn btn-primary"
            >
              {{ t('history.continue') }}
            </router-link>
            <button
              class="btn btn-secondary"
              @click="deleteHistory(item.role_id)"
            >
              {{ t('history.delete') }}
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { t } from '../i18n/messages'

const history = ref([])
const isLoading = ref(false)

const defaultAvatar =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20avatar%20for%20role%20play%20character&image_size=square'

onMounted(() => {
  fetchHistory()
})

const fetchHistory = async () => {
  isLoading.value = true
  try {
    const response = await axios.get('/api/history')
    history.value = response.data
  } catch (error) {
    console.error(t('history.fetchFailed'), error)
  } finally {
    isLoading.value = false
  }
}

const deleteHistory = async (roleId) => {
  if (confirm(t('history.deleteConfirm'))) {
    try {
      await axios.delete(`/api/history/${roleId}`)
      history.value = history.value.filter((item) => item.role_id !== roleId)
    } catch (error) {
      console.error(t('history.deleteFailed'), error)
    }
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) {
    return t('history.justNow')
  }
  if (minutes < 60) {
    return t('history.minutesAgo', { count: minutes })
  }
  if (hours < 24) {
    return t('history.hoursAgo', { count: hours })
  }
  if (days < 7) {
    return t('history.daysAgo', { count: days })
  }

  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.history-page {
  min-height: calc(100vh - 160px);
}

.history-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.history-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: clamp(24px, 4vw, 36px);
}

.history-hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-hero-copy p {
  max-width: 40rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.history-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 100%;
}

.history-item-info {
  display: grid;
  gap: 6px;
}

.history-item-info h3 {
  font-size: 1.25rem;
}

.interaction-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: var(--font-size-sm);
}

.info-label {
  color: var(--text-tertiary);
}

.info-value,
.history-item-message {
  color: var(--text-secondary);
}

.history-item-message {
  line-height: 1.75;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-item-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-top: auto;
}

.loading-container p,
.empty-state p {
  margin-top: 12px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .history-hero,
  .history-item-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
