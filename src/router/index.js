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

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.path.startsWith('/admin')) {
    if (!auth.isAuthenticated) {
      return next('/login')
    }
  }

  next()
})

export default router
