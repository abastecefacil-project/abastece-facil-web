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

      <DashboardSecao
        class="area-principal"
        titulo="Ocorrências por mês"
        :subtitulo="subtituloOcorrenciasPorMes(dashboard?.ocorrenciasPorMes)"
      >
        <OcorrenciasPorMesChart :itens="dashboard?.ocorrenciasPorMes ?? null" :carregando="carregando" />
      </DashboardSecao>

      <UltimasOcorrencias
        class="area-lateral"
        :ocorrencias="dashboard?.ultimasOcorrencias ?? null"
        :carregando="carregando"
      />

      <!-- "Ver todos" no cabeçalho, e não por linha: as telas de destino não
           aceitam filtro por query string. -->
      <DashboardSecao
        class="area-terco"
        titulo="Veículos com mais ocorrências"
        :subtitulo="`Últimos ${DIAS_RANKING_VEICULOS} dias`"
      >
        <template #acoes>
          <router-link :to="{ name: 'OccurrencesAdmin' }" class="dashboard-secao__link">Ver todos</router-link>
        </template>
        <ListaComBarras
          :itens="veiculos"
          :carregando="carregando"
          :mensagem-vazio="`Nenhuma ocorrência nos últimos ${DIAS_RANKING_VEICULOS} dias`"
        />
      </DashboardSecao>

      <DashboardSecao class="area-terco" titulo="Cidades com mais postos" subtitulo="Postos ativos">
        <template #acoes>
          <router-link :to="{ name: 'StationAdmin' }" class="dashboard-secao__link">Ver todos</router-link>
        </template>
        <ListaComBarras :itens="cidades" :carregando="carregando" mensagem-vazio="Nenhum posto ativo" />
      </DashboardSecao>

      <DashboardSecao class="area-terco" titulo="Usuários por perfil">
        <ListaComBarras :itens="perfis" :carregando="carregando" mensagem-vazio="Nenhum usuário ativo" />
        <router-link v-if="avisoConvites" :to="{ name: 'UsersAdmin' }" class="aviso-convites">
          <v-icon icon="mdi-alert-outline" size="16" />
          <span>{{ avisoConvites }}</span>
        </router-link>
      </DashboardSecao>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DashboardHeader from '@/components/admin/DashboardHeader.vue'
import DashboardSecao from '@/components/admin/DashboardSecao.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import OcorrenciasPorMesChart from '@/components/admin/OcorrenciasPorMesChart.vue'
import UltimasOcorrencias from '@/components/admin/UltimasOcorrencias.vue'
import ListaComBarras from '@/components/admin/ListaComBarras.vue'
import { getDashboard } from '@/services/dashboardService'
import {
  DIAS_RANKING_VEICULOS,
  itensCidadesComPostos,
  itensUsuariosPorPerfil,
  itensVeiculosComOcorrencias,
  subtituloOcorrenciasPorMes,
  textoConvitesAntigos,
} from '@/utils/dashboard'
import { useAuthStore } from '@/stores/auth'

const MENSAGEM_ERRO_PADRAO = 'Não foi possível carregar o painel.'

const authStore = useAuthStore()

// null até a primeira resposta. Numa falha posterior os números anteriores
// ficam na tela, e o alerta diz que a atualização falhou.
const dashboard = ref(null)
const carregadoEm = ref(null)
const carregando = ref(false)
const erro = ref(null)

const veiculos = computed(() => itensVeiculosComOcorrencias(dashboard.value?.veiculosComMaisOcorrencias))
const cidades = computed(() => itensCidadesComPostos(dashboard.value?.cidadesComMaisPostos))
const perfis = computed(() => itensUsuariosPorPerfil(dashboard.value?.usuariosPorPerfil))
const avisoConvites = computed(() => textoConvitesAntigos(dashboard.value?.usuariosAguardandoAtivacaoAntigos))

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

/* Mesmo padrão do "aguardando ativação" do StatsCards: warning só para o que
   pede ação, e leva à tela onde o reenvio é feito. */
.aviso-convites {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(var(--v-theme-warning));
  text-decoration: none;
}

.aviso-convites .v-icon {
  flex-shrink: 0;
}

.aviso-convites:hover span,
.aviso-convites:focus-visible span {
  text-decoration: underline;
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
