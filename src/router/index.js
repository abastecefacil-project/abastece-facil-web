import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Importando os layouts
import AdminLayout from '@/layouts/AdminLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      children: [
        {
          path: 'login',
          name: 'Login',
          component: () => import('../views/public/Login.vue'),
        },
        {
          // Destino do link de convite enviado por e-mail. Pública e sem
          // meta.perfis: quem chega aqui ainda não tem sessão nenhuma. O token
          // vem em query string, como o backend monta em UserConstants.
          path: 'definir-senha',
          name: 'AtivacaoConta',
          component: () => import('../views/public/AtivacaoConta.vue'),
        },
        {
          // Onde quem esqueceu a senha pede o link. O path não é contrato com o
          // backend — a rota nasce de um clique, não de um e-mail —, e nomeia a
          // ação que o usuário reconhece, como `/redefinir-senha` faz.
          path: 'esqueci-senha',
          name: 'SolicitarRecuperacao',
          component: () => import('../views/public/SolicitarRecuperacao.vue'),
        },
        {
          // Destino do link de recuperação enviado por e-mail. Pública e sem
          // meta.perfis, como a de ativação. O path é contrato com o backend:
          // UserConstants.ROTA_REDEFINIR_SENHA = "/redefinir-senha?token=".
          // Mudar de um lado exige mudar do outro.
          path: 'redefinir-senha',
          name: 'RedefinirSenha',
          component: () => import('../views/public/RedefinirSenha.vue'),
        },
        {
          path: '', // Rota raiz, redireciona para /login
          redirect: '/user/dashboardUser',
        },
      ],
    },
    {
      path: '/admin',
      component: AdminLayout,
      // `to.meta` no guard e o merge dos metas das rotas-pai do vue-router
      // fazem esta linha valer para os seis filhos de uma vez. Um filho que
      // precise de outra regra sobrescreve o campo; hoje nenhum precisa, como
      // explica o comentário do guard.
      meta: { perfis: ['ADMINISTRADOR', 'GESTOR_FROTA'] },
      children: [
        { path: '', redirect: { name: 'AdminDashboard' } },
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('../views/admin/AdminDashboard.vue'),
        },
        {
          path: 'station',
          name: 'StationAdmin',
          component: () => import('../views/admin/StationManagement.vue'),
        },
        {
          path: 'map',
          name: 'MapAdmin',
          component: () => import('../views/admin/StationMap.vue'),
        },
        {
          path: 'vehicle',
          name: 'VehicleAdmin',
          component: () => import('../views/admin/VehicleManagement.vue'),
        },
        {
          path: 'occurrences',
          name: 'OccurrencesAdmin',
          component: () => import('../views/admin/OccurrencesAnalysis.vue'),
        },
        {
          path: 'user',
          name: 'UsersAdmin',
          component: () => import('../views/admin/UserManagement.vue'),
        },
      ],
    },
    {
      path: '/user',
      component: DefaultLayout,
      children: [
        {
          path: 'postos',
          name: 'UserGasStations',
          // Por enquanto, um componente de exemplo
          component: () => import('../views/user/GasStations.vue'),
        },
        {
          path: 'dashboardUser',
          name: 'UserDashboard',
          component: () => import('../views/user/UserDashboard.vue'),
        },
        {
          path: 'mapUser',
          name: 'MapUser',
          component: () => import('../views/admin/StationMap.vue'),
        },
        {
          path: 'occurrencesUser',
          name: 'OccurrencesUser',
          component: () => import('../views/user/Occurrences.vue'),
        },
                {
          path: 'HelpCenter',
          name: 'HelpCenter',
          component: () => import('../views/user/HelpCenter.vue'),
        },
      ],
    },
  ],
})

// Conveniência de navegação, não autorização: quem decide o que cada perfil pode
// fazer é o backend, que valida perfil e regional no serviço desde o S2a e
// responde 403. O guard só evita que a pessoa chegue a uma tela onde toda ação
// falharia. Por isso ele lê a lista de perfis declarada na rota e nada mais —
// nenhuma regra de negócio por entidade mora aqui.
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Nenhuma rota de `/admin/*` é exceção: as seis (`dashboard`, `station`,
  // `map`, `vehicle`, `occurrences`, `user`) são telas de gestão da frota, e
  // não existe tela de perfil próprio no projeto. `MapUser` reaproveita a view
  // de `MapAdmin`, mas por uma rota própria em `/user/mapUser`, que continua
  // aberta a qualquer sessão.
  const perfisPermitidos = to.meta.perfis

  if (!perfisPermitidos) {
    return next()
  }

  if (!auth.isAuthenticated) {
    return next('/login')
  }

  // Autenticado sem permissão não volta para o login: a sessão é válida, só não
  // alcança esta área. `homeDoPerfil` cobre também o perfil ausente, que cai na
  // home padrão, e todo destino que ele devolve está fora de `/admin`, o que
  // impede o redirecionamento de reentrar neste ramo.
  if (!perfisPermitidos.includes(auth.perfil)) {
    return next(auth.homeDoPerfil)
  }

  next()
})

export default router
