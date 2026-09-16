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

    // A recuperação de senha devolve o mesmo AuthResponse do login e da
    // ativação, então a persistência da sessão continua num lugar só. O erro
    // sobe cru pelo mesmo motivo do `ativarConta`: a tela precisa distinguir
    // TOKEN_INVALIDO de SENHA_FRACA pelo campo `error`.
    async redefinirSenha({ token, senha }) {
      const data = await authService.redefinirSenha({ token, senha })
      this.aplicarSessao(data)
    },

    // Navega ANTES de limpar, e essa ordem é o ponto todo desta action. Desde o
    // P0.6 o menu do `AppShell` é um computed sobre `perfil`: limpando primeiro,
    // o menu recalculava para vazio enquanto a tela administrativa ainda estava
    // montada, e os itens sumiam por um frame antes de a navegação acontecer.
    // Invertendo, quando o estado zera o `AppShell` já está sendo desmontado.
    //
    // Inverter é seguro porque o guard não lê `token` nem `perfil` ao navegar
    // para `/login`: a rota não tem `meta.perfis`, então ele para no primeiro
    // `if` e chama `next()` direto.
    //
    // O `finally` não é enfeite: se a navegação falhasse e a limpeza ficasse de
    // fora, a pessoa veria "Sair" e continuaria com sessão válida. Falhar
    // limpando (com o piscar de volta, no pior caso) é melhor que falhar sem
    // limpar.
    async logout(router) {
      try {
        await router.push('/login')
      } finally {
        this.token = null
        this.perfil = null
        localStorage.removeItem('token')
        localStorage.removeItem('perfil')
      }
    },

    restoreSession() {
      this.token = localStorage.getItem('token')
      this.perfil = normalizarPerfil(localStorage.getItem('perfil'))
    },
  },
})
