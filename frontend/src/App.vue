<template>
  <div class="app-shell" :class="{ 'is-chat-route': isChatRoute }">
    <div class="app-aura aura-one"></div>
    <div class="app-aura aura-two"></div>

    <nav class="navbar">
      <div class="container navbar-container">
        <router-link to="/" class="navbar-logo">
          <span class="navbar-logo-mark">RP</span>
          <span class="navbar-logo-copy">
            <span class="navbar-logo-title">{{ t('app.title') }}</span>
            <span class="navbar-logo-subtitle">{{ t('app.footer') }}</span>
          </span>
        </router-link>

        <button
          class="mobile-menu-btn"
          type="button"
          :aria-label="t('app.navMenu')"
          @click="toggleMobileMenu"
        >
          {{ t('app.navMenu') }}
        </button>

        <div class="navbar-links" :class="{ open: mobileMenuOpen }">
          <router-link to="/" class="navbar-link" exact-active-class="active">
            {{ t('app.navHome') }}
          </router-link>
          <router-link to="/role-config" class="navbar-link" exact-active-class="active">
            {{ t('app.navRoles') }}
          </router-link>
          <router-link to="/history" class="navbar-link" exact-active-class="active">
            {{ t('app.navHistory') }}
          </router-link>
        </div>
      </div>
    </nav>

    <main class="main-content" :class="{ 'main-content-chat': isChatRoute }">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer v-if="!isChatRoute" class="footer">
      <div class="container footer-container">
        <p>{{ new Date().getFullYear() }} · {{ t('app.footer') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { t } from './i18n/messages'

const route = useRoute()
const mobileMenuOpen = ref(false)

const isChatRoute = computed(() => route.name === 'chat')

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-aura {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(18px);
  opacity: 0.7;
  z-index: 0;
}

.aura-one {
  top: 16%;
  right: 8%;
  width: 220px;
  height: 220px;
  background: rgba(223, 209, 240, 0.4);
}

.aura-two {
  bottom: 12%;
  left: 5%;
  width: 280px;
  height: 280px;
  background: rgba(191, 216, 204, 0.32);
}

.main-content {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 8px 0 var(--spacing-2xl);
}

.main-content-chat {
  padding-bottom: var(--spacing-lg);
}

.footer {
  position: relative;
  z-index: 1;
  padding: 0 0 var(--spacing-xl);
}

.footer-container {
  padding: 20px 24px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.54);
  box-shadow: var(--shadow-xs);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(14px);
}

@media (max-width: 900px) {
  .main-content {
    padding-top: 0;
  }
}
</style>
