import { defineStore } from 'pinia'
import authService from '@/services/authService'

const PERFIS = ['COLABORADOR', 'GESTOR_FROTA', 'ADMINISTRADOR']

// Sessões criadas antes do P0.5a não têm perfil no localStorage, e um valor
// desconhecido não pode vazar para o resto do frontend: nos dois casos, null.
function normalizarPerfil(valor) {
  return PERFIS.includes(valor) ? valor : null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem("token") || null,
    perfil: normalizarPerfil(localStorage.getItem('perfil')),
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

        this.perfil = normalizarPerfil(data.perfil)
        if (this.perfil) {
          localStorage.setItem('perfil', this.perfil)
        } else {
          localStorage.removeItem('perfil')
        }

      } catch (error) {
        throw error.response.data
      }
    },

    logout(router) {
      this.token = null
      this.perfil = null
      localStorage.removeItem('token')
      localStorage.removeItem('perfil')
      router.push("/login")
    },

    restoreSession() {
      this.token = localStorage.getItem('token')
      this.perfil = normalizarPerfil(localStorage.getItem('perfil'))
    },
  },
})
