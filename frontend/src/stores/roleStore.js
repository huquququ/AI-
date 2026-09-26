import { defineStore } from 'pinia'
import axios from 'axios'

const normalizeId = (id) => Number(id)

export const useRoleStore = defineStore('role', {
  state: () => ({
    roles: [],
    loading: false,
    error: null
  }),

  getters: {
    getRoleById: (state) => (id) => {
      const targetId = normalizeId(id)
      return state.roles.find((role) => normalizeId(role.id) === targetId)
    }
  },

  actions: {
    async fetchRoles() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/roles')
        this.roles = response.data
      } catch (error) {
        this.error = error.message
        console.error('Failed to fetch roles:', error)
      } finally {
        this.loading = false
      }
    },

    async createRole(roleData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/roles', roleData)
        this.roles.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        console.error('Failed to create role:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateRole(id, roleData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(`/api/roles/${id}`, roleData)
        const targetId = normalizeId(id)
        const index = this.roles.findIndex((role) => normalizeId(role.id) === targetId)
        if (index !== -1) {
          this.roles[index] = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.message
        console.error('Failed to update role:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteRole(id) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(`/api/roles/${id}`)
        const targetId = normalizeId(id)
        this.roles = this.roles.filter((role) => normalizeId(role.id) !== targetId)
      } catch (error) {
        this.error = error.message
        console.error('Failed to delete role:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
