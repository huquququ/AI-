<template>
  <div class="role-config-container">
    <div class="container">
      <div class="page-header">
        <div class="page-copy">
          <span class="soft-badge">{{ isEditing ? t('roleConfig.editTitle') : t('roleConfig.createTitle') }}</span>
          <h1 class="page-title">{{ isEditing ? t('roleConfig.editTitle') : t('roleConfig.createTitle') }}</h1>
        </div>
        <router-link to="/" class="btn btn-secondary">{{ t('roleConfig.back') }}</router-link>
      </div>

      <div class="role-config-layout">
        <div class="role-form">
          <form @submit.prevent="saveRole">
            <div class="form-group">
              <label for="name" class="form-label">{{ t('roleConfig.roleName') }}</label>
              <input
                id="name"
                v-model="roleForm.name"
                type="text"
                class="form-input"
                :placeholder="t('roleConfig.roleNamePlaceholder')"
                required
              >
            </div>

            <div class="form-group">
              <label for="description" class="form-label">{{ t('roleConfig.roleDescription') }}</label>
              <textarea
                id="description"
                v-model="roleForm.description"
                class="form-input"
                :placeholder="t('roleConfig.roleDescriptionPlaceholder')"
                rows="6"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="avatar" class="form-label">{{ t('roleConfig.avatarUrl') }}</label>
              <input
                id="avatar"
                v-model="roleForm.avatar"
                type="text"
                class="form-input"
                :placeholder="t('roleConfig.avatarPlaceholder')"
              >
              <p class="form-help">{{ t('roleConfig.avatarHelp') }}</p>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('roleConfig.uploadAvatar') }}</label>
              <div
                class="file-upload"
                @dragover.prevent
                @dragenter.prevent
                @dragleave.prevent
                @drop.prevent="handleDragDrop"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInput"
                  type="file"
                  class="file-upload-input"
                  accept="image/*"
                  @change="handleFileUpload"
                >

                <div class="file-upload-content">
                  <div class="file-upload-icon">Image</div>
                  <p>{{ t('roleConfig.uploadHint') }}</p>
                  <p class="file-upload-hint">JPG / PNG / GIF / WEBP</p>
                </div>

              </div>
              <div v-if="avatarPreview || roleForm.avatar" class="upload-status">
                <span class="soft-badge">Avatar Ready</span>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  @click.stop="clearAvatar"
                >
                  {{ t('roleConfig.remove') }}
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="cancel">{{ t('roleConfig.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                <span v-if="isSaving" class="loading"></span>
                {{ isSaving ? t('roleConfig.saving') : isEditing ? t('roleConfig.updateRole') : t('roleConfig.createRole') }}
              </button>
            </div>
          </form>
        </div>

        <aside class="preview-panel surface-panel">
          <div class="preview-art">
            <img
              v-if="avatarPreview || roleForm.avatar"
              :src="avatarPreview || roleForm.avatar"
              :alt="roleForm.name || t('roleConfig.roleName')"
              class="preview-image"
            >
            <div v-else class="preview-empty">{{ roleForm.name?.slice(0, 1) || '角' }}</div>
          </div>

          <div class="preview-copy">
            <span class="soft-badge">{{ t('roleConfig.uploadAvatar') }}</span>
            <h2>{{ roleForm.name || t('roleConfig.roleName') }}</h2>
            <p>{{ roleForm.description || t('roleConfig.roleDescriptionPlaceholder') }}</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useRoleStore } from '../stores/roleStore'
import { t } from '../i18n/messages'

const router = useRouter()
const route = useRoute()
const roleStore = useRoleStore()

const isEditing = ref(false)
const isSaving = ref(false)
const fileInput = ref(null)
const avatarPreview = ref('')
const roleForm = ref({
  name: '',
  description: '',
  avatar: ''
})

const MAX_FILE_SIZE = 5 * 1024 * 1024

onMounted(async () => {
  if (roleStore.roles.length === 0) {
    await roleStore.fetchRoles()
  }

  const id = route.query.id
  if (!id) return

  isEditing.value = true
  loadRole(id)
})

const loadRole = (id) => {
  const role = roleStore.getRoleById(id)
  if (!role) return

  roleForm.value = { ...role }
  avatarPreview.value = role.avatar || ''
}

const clearAvatar = () => {
  avatarPreview.value = ''
  roleForm.value.avatar = ''
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const validateImageFile = (file) => {
  if (!file) {
    throw new Error(t('roleConfig.noFile'))
  }
  if (!file.type.startsWith('image/')) {
    throw new Error(t('roleConfig.imageOnly'))
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(t('roleConfig.maxSize'))
  }
}

const uploadAvatarFile = async (file) => {
  validateImageFile(file)
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post('/api/upload', formData)
  const url = response.data?.url
  if (!url) {
    throw new Error(t('roleConfig.missingUrl'))
  }

  roleForm.value.avatar = url
  avatarPreview.value = url
}

const handleFileUpload = async (event) => {
  const file = event.target?.files?.[0]
  if (!file) return

  try {
    await uploadAvatarFile(file)
  } catch (error) {
    const message = error.response?.data?.error || error.message || t('roleConfig.uploadFailed')
    alert(message)
  } finally {
    if (event.target) {
      event.target.value = ''
    }
  }
}

const handleDragDrop = async (event) => {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  try {
    await uploadAvatarFile(file)
  } catch (error) {
    const message = error.response?.data?.error || error.message || t('roleConfig.uploadFailed')
    alert(message)
  }
}

const saveRole = async () => {
  isSaving.value = true
  try {
    if (isEditing.value) {
      await roleStore.updateRole(route.query.id, roleForm.value)
      alert(t('roleConfig.updateSuccess'))
    } else {
      await roleStore.createRole(roleForm.value)
      alert(t('roleConfig.createSuccess'))
    }
    router.push('/')
  } catch (error) {
    alert(error.response?.data?.error || t('roleConfig.saveFailed'))
  } finally {
    isSaving.value = false
  }
}

const cancel = () => {
  router.push('/')
}
</script>

<style scoped>
.role-config-container {
  min-height: calc(100vh - 160px);
}

.page-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-config-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.75fr);
  gap: var(--spacing-lg);
  align-items: start;
}

.form-help {
  margin-top: 10px;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.file-upload-content {
  display: grid;
  gap: 8px;
  text-align: center;
}

.file-upload-icon {
  font-size: 2rem;
}

.file-upload-hint {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: 20px;
  position: sticky;
  top: 106px;
}

.preview-art {
  overflow: hidden;
  border-radius: 30px;
  background:
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.88), transparent 34%),
    linear-gradient(180deg, rgba(243, 235, 241, 0.96), rgba(245, 240, 235, 0.92));
  min-height: 360px;
}

.preview-image,
.preview-empty {
  width: 100%;
  height: 360px;
}

.preview-image {
  object-fit: cover;
}

.preview-empty {
  display: grid;
  place-items: center;
  font-size: 4rem;
  color: var(--text-secondary);
}

.preview-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-copy h2 {
  font-size: 2rem;
}

.preview-copy p {
  color: var(--text-secondary);
  line-height: 1.8;
}

@media (max-width: 980px) {
  .role-config-layout {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    display: none;
  }
}
</style>
