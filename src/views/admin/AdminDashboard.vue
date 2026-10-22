<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-grid">
      <DashboardHeader class="area-inteira" :perfil="authStore.perfil" :carregado-em="carregadoEm" />

      <v-alert v-if="erro" class="area-inteira" type="error" variant="tonal" density="comfortable">
        {{ erro }}
        <template #append>
          <v-btn variant="text" :loading="carregando" @click="carregar">Tentar novamente</v-btn>
        </template>
      </v-alert>

      <StatsCards
        class="area-inteira"
        :postos="dashboard?.postos ?? null"
        :veiculos="dashboard?.veiculos ?? null"
        :ocorrencias="dashboard?.ocorrencias ?? null"
        :usuarios="dashboard?.usuarios ?? null"
        :carregando="carregando"
      />

      <DashboardSecao class="area-principal" titulo="Ocorrências por mês" />

      <OccurrencesSidebar
        class="area-lateral"
        :occurrences="dashboard?.ultimasOcorrencias ?? []"
        :loading="carregando && !dashboard"
      />

      <DashboardSecao class="area-terco" titulo="Veículos com mais ocorrências" />
      <DashboardSecao class="area-terco" titulo="Cidades com mais postos" />
      <DashboardSecao class="area-terco" titulo="Usuários por perfil" />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Footer from '@/components/app/Footer.vue'
import DashboardHeader from '@/components/admin/DashboardHeader.vue'
import DashboardSecao from '@/components/admin/DashboardSecao.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import OccurrencesSidebar from '@/components/admin/OccurrencesSidebar.vue'
import { getDashboard } from '@/services/dashboardService'
import { useAuthStore } from '@/stores/auth'

const MENSAGEM_ERRO_PADRAO = 'Não foi possível carregar o painel.'

const authStore = useAuthStore()

// null até a primeira resposta. Numa falha posterior os números anteriores
// ficam na tela, e o alerta diz que a atualização falhou.
const dashboard = ref(null)
const carregadoEm = ref(null)
const carregando = ref(false)
const erro = ref(null)

// Descarta resposta atrasada quando o "Tentar novamente" dispara outra consulta.
let consultaAtual = 0

async function carregar() {
  const consulta = ++consultaAtual
  carregando.value = true

  try {
    const { data } = await getDashboard()
    if (consulta !== consultaAtual) return
    dashboard.value = data
    carregadoEm.value = new Date()
    erro.value = null
  } catch (err) {
    if (consulta !== consultaAtual) return
    erro.value = err.response?.data?.message || MENSAGEM_ERRO_PADRAO
  } finally {
    if (consulta === consultaAtual) carregando.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
.dashboard-wrapper {
  background-color: var(--color-background);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Um grid só para todas as larguras: 12 colunas, que viram uma abaixo de 960px. */
.dashboard-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-content: start;
  gap: 16px;
  padding: 24px;
}

.area-inteira {
  grid-column: span 12;
}

.area-principal {
  grid-column: span 8;
}

.area-lateral {
  grid-column: span 4;
}

.area-terco {
  grid-column: span 4;
}

@media (max-width: 959px) {
  .area-principal,
  .area-lateral,
  .area-terco {
    grid-column: span 12;
  }
}

@media (max-width: 599px) {
  .dashboard-grid {
    gap: 12px;
    padding: 16px;
  }
}
</style>
