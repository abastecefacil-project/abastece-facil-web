import { defineStore } from 'pinia'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem("token") || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(credentials) {
      try {
        const data = await authService.login(credentials)

        this.token = data.token
        localStorage.setItem('token', data.token)

      } catch (error) {
        throw error.response.data
      }
    },

    logout(router) {
      this.token = null
      localStorage.removeItem('token')
      router.push("/login")
    },

    restoreSession() {
      this.token = localStorage.getItem('token')
    },
  },
})
