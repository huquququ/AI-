import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoleConfigView from '../views/RoleConfigView.vue'
import ChatView from '../views/ChatView.vue'
import HistoryView from '../views/HistoryView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/role-config',
    name: 'roleConfig',
    component: RoleConfigView
  },
  {
    path: '/chat/:roleId',
    name: 'chat',
    component: ChatView
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
