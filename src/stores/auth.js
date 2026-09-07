import { defineStore } from 'pinia'
import authService from '@/services/authService'

const PERFIS = ['COLABORADOR', 'GESTOR_FROTA', 'ADMINISTRADOR']

// Para onde cada perfil vai depois de autenticar. Colaborador usa o layout de
// usuário; gestor e administrador, o painel. Perfil desconhecido ou ausente
// cai na área pública, que é o que qualquer visitante já enxerga.
const HOME_POR_PERFIL = {
  COLABORADOR: '/user/dashboardUser',
  GESTOR_FROTA: '/admin/dashboard',
  ADMINISTRADOR: '/admin/dashboard',
}

const HOME_PADRAO = '/user/dashboardUser'

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
    homeDoPerfil: (state) => HOME_POR_PERFIL[state.perfil] ?? HOME_PADRAO,
  },

  actions: {
    // Login e ativação de conta devolvem o mesmo AuthResponse, então a
    // persistência da sessão mora num lugar só.
    aplicarSessao(data) {
      this.token = data.token
      localStorage.setItem('token', data.token)

      this.perfil = normalizarPerfil(data.perfil)
      if (this.perfil) {
        localStorage.setItem('perfil', this.perfil)
      } else {
        localStorage.removeItem('perfil')
      }
    },

    async login(credentials) {
      try {
        const data = await authService.login(credentials)
        this.aplicarSessao(data)
      } catch (error) {
        throw error.response.data
      }
    },

    // O erro sobe cru, sem desembrulhar o corpo: a tela de ativação precisa
    // distinguir TOKEN_INVALIDO de SENHA_FRACA pelo campo `error`, e uma falha
    // de rede não tem `response` para desembrulhar.
    async ativarConta({ token, senha }) {
      const data = await authService.ativarConta({ token, senha })
      this.aplicarSessao(data)
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
