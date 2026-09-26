<template>
  <div class="home-container">
    <div class="container home-stack">
      <section class="hero-section surface-panel">
        <div class="hero-copy">
          <h1 class="hero-title">{{ t('home.heroTitle') }}</h1>
          <p class="hero-subtitle">{{ t('home.heroSubtitle') }}</p>

          <div class="hero-feature-list">
            <div class="hero-feature-card">
              <span class="hero-feature-dot dot-rose"></span>
              <span>{{ t('home.heroFeatureOne') }}</span>
            </div>
            <div class="hero-feature-card">
              <span class="hero-feature-dot dot-mint"></span>
              <span>{{ t('home.heroFeatureTwo') }}</span>
            </div>
            <div class="hero-feature-card">
              <span class="hero-feature-dot dot-cream"></span>
              <span>{{ t('home.heroFeatureThree') }}</span>
            </div>
          </div>

          <div class="hero-actions">
            <router-link to="/role-config" class="btn btn-primary">
              <span>+</span>
              {{ t('home.createRole') }}
            </router-link>
            <router-link to="/history" class="btn btn-secondary">
              {{ t('app.navHistory') }}
            </router-link>
          </div>
        </div>

        <div class="hero-preview">
          <div v-if="previewRoles.length" class="hero-preview-deck">
            <article
              v-for="(role, index) in previewRoles"
              :key="`${role.id}-${index}`"
              class="hero-preview-card"
              :class="previewCardClass(index)"
            >
              <div class="hero-preview-art">
                <img
                  :src="role.avatar || defaultAvatar"
                  :alt="role.name"
                  class="hero-preview-image"
                >
              </div>

              <div class="hero-preview-info">
                <h2>{{ role.name }}</h2>
                <p>{{ getHeroPreviewDescription(role.description) || t('home.emptyDescription') }}</p>
              </div>
            </article>
          </div>

          <div v-else class="hero-preview-shell">
            <div class="hero-preview-empty">{{ t('home.emptyIcon') }}</div>
            <div class="hero-preview-info">
              <span class="soft-badge">{{ t('home.createRole') }}</span>
              <h2>{{ t('home.emptyTitle') }}</h2>
              <p>{{ t('home.emptyDescription') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="role-section">
        <div class="role-section-header">
          <div class="role-section-copy">
            <h2 class="section-title">{{ t('home.chooseRole') }}</h2>
          </div>

          <router-link to="/role-config" class="btn btn-primary">
            <span>+</span>
            {{ t('home.createRole') }}
          </router-link>
        </div>

        <div v-if="roleStore.loading" class="loading-container">
          <div class="loading"></div>
          <p>{{ t('home.loadingRoles') }}</p>
        </div>

        <div v-else-if="roleStore.roles.length === 0" class="empty-state">
          <div class="empty-icon">{{ t('home.emptyIcon') }}</div>
          <h3>{{ t('home.emptyTitle') }}</h3>
          <p>{{ t('home.emptyDescription') }}</p>
          <router-link to="/role-config" class="btn btn-primary">
            {{ t('home.createRole') }}
          </router-link>
        </div>

        <div v-else class="role-grid">
          <article
            v-for="role in roleStore.roles"
            :key="role.id"
            class="role-card role-card-custom"
            @click="startChat(role.id)"
          >
            <button
              class="role-card-delete"
              :aria-label="t('home.delete')"
              @click.stop="deleteRole(role.id, role.name)"
            >
              <span class="role-card-delete-icon">🗑</span>
              <span class="role-card-delete-text">{{ t('home.delete') }}</span>
            </button>

            <div class="role-card-media">
              <img
                :src="role.avatar || defaultAvatar"
                :alt="role.name"
                class="role-avatar role-avatar-large"
              >
              <div class="role-card-glow"></div>
            </div>

            <div class="role-card-content">
              <div class="role-card-heading">
                <h3>{{ role.name }}</h3>
              </div>
              <p class="role-description role-description-preview">
                {{ getDescriptionPreview(role.description) || t('home.noDescription') }}
              </p>
            </div>

            <div class="role-card-actions">
              <button class="btn btn-primary" @click.stop="startChat(role.id)">
                {{ t('home.startChat') }}
              </button>
              <button class="btn btn-secondary" @click.stop="showRoleDetails(role)">
                {{ t('home.viewDetails') }}
              </button>
              <button class="btn btn-secondary" @click.stop="editRole(role.id)">
                {{ t('home.edit') }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <div
        v-if="detailRole"
        class="detail-overlay"
        @click.self="closeRoleDetails"
      >
        <div class="detail-modal surface-panel">
          <div class="detail-modal-header">
            <div class="detail-modal-copy">
              <span class="soft-badge">{{ t('home.detailsTitle') }}</span>
              <h3>{{ detailRole.name }}</h3>
            </div>
            <button class="btn btn-secondary btn-sm" @click="closeRoleDetails">
              {{ t('home.closeDetails') }}
            </button>
          </div>

          <div class="detail-modal-body">
            <img
              :src="detailRole.avatar || defaultAvatar"
              :alt="detailRole.name"
              class="detail-modal-image"
            >
            <p>{{ detailRole.description || t('home.noDescription') }}</p>
          </div>

          <div class="detail-modal-actions">
            <button class="btn btn-primary" @click="startChat(detailRole.id)">
              {{ t('home.startChat') }}
            </button>
            <button class="btn btn-secondary" @click="editRole(detailRole.id)">
              {{ t('home.edit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoleStore } from '../stores/roleStore'
import { t } from '../i18n/messages'

const router = useRouter()
const roleStore = useRoleStore()
const detailRole = ref(null)
const previewIndex = ref(0)

const defaultAvatar =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20avatar%20for%20role%20play%20character&image_size=square'

const previewRoles = computed(() => {
  const roles = roleStore.roles
  if (roles.length === 0) return []

  const limit = Math.min(3, roles.length)
  return Array.from({ length: limit }, (_, offset) => {
    const index = (previewIndex.value + offset) % roles.length
    return roles[index]
  })
})

onMounted(() => {
  roleStore.fetchRoles()
  startPreviewRotation()
})

onUnmounted(() => {
  stopPreviewRotation()
})

let previewTimer = null

const startPreviewRotation = () => {
  stopPreviewRotation()
  previewTimer = window.setInterval(() => {
    const total = roleStore.roles.length
    if (total <= 1) return
    previewIndex.value = (previewIndex.value + 1) % total
  }, 3600)
}

const stopPreviewRotation = () => {
  if (previewTimer !== null) {
    window.clearInterval(previewTimer)
    previewTimer = null
  }
}

const startChat = (roleId) => {
  closeRoleDetails()
  router.push(`/chat/${roleId}`)
}

const editRole = (roleId) => {
  closeRoleDetails()
  router.push(`/role-config?id=${roleId}`)
}

const getDescriptionPreview = (description) => {
  if (!description) return ''
  const normalized = description.replace(/\s+/g, ' ').trim()
  return normalized.length > 54 ? `${normalized.slice(0, 54)}...` : normalized
}

const getHeroPreviewDescription = (description) => {
  if (!description) return ''
  const normalized = description.replace(/\s+/g, ' ').trim()
  return normalized.length > 36 ? `${normalized.slice(0, 36)}...` : normalized
}

const previewCardClass = (index) => {
  if (index === 0) return 'is-front'
  if (index === 1) return 'is-middle'
  return 'is-back'
}

const showRoleDetails = (role) => {
  detailRole.value = role
}

const closeRoleDetails = () => {
  detailRole.value = null
}

const deleteRole = async (roleId, roleName) => {
  if (confirm(t('home.deleteConfirm', { roleName }))) {
    try {
      await roleStore.deleteRole(roleId)
      if (detailRole.value?.id === roleId) {
        closeRoleDetails()
      }
      alert(t('home.deleteSuccess'))
    } catch (error) {
      alert(t('home.deleteFailed'))
      console.error('Failed to delete role:', error)
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: calc(100vh - 160px);
}

.home-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: var(--spacing-xl);
  padding: clamp(28px, 5vw, 54px);
  position: relative;
  overflow: hidden;
}

.hero-section::before,
.hero-section::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.hero-section::before {
  width: 220px;
  height: 220px;
  top: -80px;
  right: -40px;
  background: rgba(241, 216, 168, 0.24);
}

.hero-section::after {
  width: 180px;
  height: 180px;
  bottom: -60px;
  left: 42%;
  background: rgba(191, 216, 204, 0.22);
}

.hero-copy,
.hero-preview {
  position: relative;
  z-index: 1;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--spacing-md);
  padding-right: clamp(0px, 2vw, 20px);
}

.hero-title {
  max-width: 11ch;
  font-size: var(--font-size-3xl);
  line-height: 1.08;
}

.hero-subtitle {
  max-width: 38rem;
  color: var(--text-secondary);
  font-size: clamp(1rem, 2vw, 1.2rem);
}

.hero-feature-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hero-feature-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 68px;
  padding: 14px 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-xs);
  color: var(--text-secondary);
  line-height: 1.55;
}

.hero-feature-dot {
  flex: 0 0 12px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.38);
}

.dot-rose {
  background: rgba(230, 180, 189, 0.9);
}

.dot-mint {
  background: rgba(191, 216, 204, 0.95);
}

.dot-cream {
  background: rgba(241, 216, 168, 0.92);
}

.hero-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.hero-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-preview-deck {
  position: relative;
  width: min(100%, 430px);
  height: 560px;
}

.hero-preview-card,
.hero-preview-shell {
  width: 100%;
  padding: 16px;
  border-radius: 34px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 245, 240, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow: var(--shadow-md);
}

.hero-preview-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  transition:
    transform var(--transition-slow),
    opacity var(--transition-slow),
    box-shadow var(--transition-slow);
}

.hero-preview-card.is-front {
  z-index: 3;
  transform: translateY(0) scale(1);
}

.hero-preview-card.is-middle {
  z-index: 2;
  transform: translateY(26px) scale(0.955);
  opacity: 0.82;
}

.hero-preview-card.is-back {
  z-index: 1;
  transform: translateY(50px) scale(0.91);
  opacity: 0.62;
}

.hero-preview-art {
  position: relative;
  overflow: hidden;
  min-height: 300px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.85), transparent 44%),
    linear-gradient(180deg, rgba(248, 238, 245, 0.98), rgba(246, 241, 236, 0.9));
}

.hero-preview-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.hero-preview-empty {
  display: grid;
  place-items: center;
  min-height: 300px;
  font-size: 4rem;
}

.hero-preview-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 8px 6px;
}

.hero-preview-info h2 {
  font-size: clamp(1.5rem, 2vw, 2.1rem);
}

.hero-preview-info p {
  color: var(--text-secondary);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.role-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.role-section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.role-section-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.role-card-custom {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 100%;
  animation: floatUp var(--transition-slow) both;
}

.role-card-delete {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.86);
  box-shadow: var(--shadow-xs);
  color: #8a7480;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background var(--transition-fast);
}

.role-card-delete:hover {
  transform: translateY(-1px);
  background: rgba(255, 247, 247, 0.96);
  box-shadow: var(--shadow-sm);
}

.role-card-delete-icon {
  font-size: 0.95rem;
  line-height: 1;
}

.role-card-delete-text {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  transition: max-width var(--transition-normal);
}

.role-card-delete:hover .role-card-delete-text {
  max-width: 48px;
}

.role-card-media {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  background:
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.86), transparent 36%),
    linear-gradient(180deg, rgba(244, 234, 241, 0.96), rgba(244, 239, 234, 0.92));
  min-height: 280px;
  padding: 18px;
}

.role-card-glow {
  position: absolute;
  inset: auto 10% 12px;
  height: 44px;
  border-radius: 50%;
  background: rgba(221, 201, 209, 0.28);
  filter: blur(20px);
}

.role-avatar-large {
  width: 100%;
  height: 280px;
  border-radius: 24px;
}

.role-card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.role-card-heading h3 {
  font-size: 1.3rem;
}

.role-description {
  color: var(--text-secondary);
  line-height: 1.7;
}

.role-description-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.7em * 2);
}

.role-card-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: nowrap;
  margin-top: auto;
}

.role-card-actions .btn {
  flex: 1 1 0;
  min-width: 0;
}

.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(245, 238, 235, 0.6);
  backdrop-filter: blur(12px);
  overflow-y: auto;
}

.detail-modal {
  width: min(720px, 100%);
  max-height: min(88vh, 920px);
  padding: 22px;
  border-radius: 32px;
  display: flex;
  flex-direction: column;
}

.detail-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--spacing-md);
}

.detail-modal-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-modal-copy h3 {
  font-size: 1.8rem;
}

.detail-modal-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
  overflow-y: auto;
  padding-right: 6px;
}

.detail-modal-image {
  width: 100%;
  height: 280px;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.detail-modal-body p {
  color: var(--text-secondary);
  line-height: 1.9;
  white-space: pre-wrap;
}

.detail-modal-actions {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
}

.loading-container p {
  margin-top: 12px;
  color: var(--text-secondary);
}

.empty-state h3 {
  margin-bottom: 8px;
  font-size: 1.5rem;
}

.empty-state p {
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
}

@media (max-width: 980px) {
  .hero-section {
    grid-template-columns: 1fr;
  }

  .hero-title {
    max-width: none;
  }

  .hero-feature-list {
    grid-template-columns: 1fr;
  }

  .hero-preview-deck {
    height: 520px;
  }
}

@media (max-width: 768px) {
  .detail-overlay {
    place-items: start center;
    padding: 16px 12px;
  }

  .detail-modal {
    max-height: none;
    min-height: auto;
  }

  .home-stack {
    gap: var(--spacing-xl);
  }

  .hero-section {
    padding: 22px;
  }

  .role-card-actions {
    flex-direction: column;
  }

  .hero-feature-list {
    grid-template-columns: 1fr;
  }

  .role-section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-preview-deck {
    height: 500px;
  }

  .detail-modal-body,
  .hero-preview-art,
  .hero-preview-image,
  .hero-preview-empty {
    min-height: 280px;
    height: 280px;
  }

  .detail-modal-body {
    grid-template-columns: 1fr;
  }

  .detail-modal-actions {
    flex-direction: column;
  }
}
</style>
