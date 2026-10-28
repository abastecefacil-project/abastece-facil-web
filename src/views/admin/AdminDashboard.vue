<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-grid">
      <PageHeader class="area-inteira dashboard-cabecalho" titulo="Painel" :subtitulo="subtitulo" />

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
        >
          <template #rotulo="{ linha }">
            <PlateBadge :placa="linha.rotulo" />
          </template>
        </ListaComBarras>
      </DashboardSecao>

      <DashboardSecao class="area-terco" titulo="Cidades com mais postos" subtitulo="Postos ativos">
        <template #acoes>
          <router-link :to="{ name: 'StationAdmin' }" class="dashboard-secao__link">Ver todos</router-link>
        </template>
        <ListaComBarras :itens="cidades" :carregando="carregando" mensagem-vazio="Nenhum posto ativo" />
      </DashboardSecao>

      <DashboardSecao
        class="area-terco area-perfis"
        titulo="Usuários por perfil"
        :subtitulo="subtituloUsuariosPorPerfil(authStore.perfil)"
      >
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
import PageHeader from '@/components/app/PageHeader.vue'
import PlateBadge from '@/components/app/PlateBadge.vue'
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
  subtituloPainel,
  subtituloUsuariosPorPerfil,
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
// Perfil (da store, sem chamar /api/users/me) e hora da última carga.
const subtitulo = computed(() => subtituloPainel(authStore.perfil, carregadoEm.value) ?? '')
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
/* Fundo e rolagem são do AppShell (.main-content / .main-container): um
   min-height de 100vh aqui somaria a barra superior e a página sempre rolaria
   56px a mais. */
.dashboard-wrapper {
  max-width: 1440px;
}

/* O grid já espaça os itens pelo gap; a margem própria do PageHeader dobraria
   a distância até os indicadores. */
.dashboard-grid > .dashboard-cabecalho {
  margin-bottom: 0;
}

/* Um grid só para todas as larguras, de 12 colunas. Padding e gutter da §4.3:
   32 e 24px no desktop, 16px abaixo de md. */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-content: start;
  gap: var(--space-6);
  padding: var(--space-8);
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
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  font-weight: 600;
  color: var(--color-warning);
  text-decoration: none;
}

.aviso-convites .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.aviso-convites:hover span,
.aviso-convites:focus-visible span {
  text-decoration: underline;
}

/* Abaixo de 1280px a coluna lateral e os terços ficariam estreitos demais para
   os títulos: gráfico e lista empilham, e os rankings passam a duas colunas,
   com "Usuários por perfil" na largura inteira. */
@media (max-width: 1279px) {
  .area-principal,
  .area-lateral,
  .area-perfis {
    grid-column: span 12;
  }

  .area-terco:not(.area-perfis) {
    grid-column: span 6;
  }
}

@media (max-width: 959px) {
  .area-terco:not(.area-perfis) {
    grid-column: span 12;
  }

  .dashboard-grid {
    gap: var(--space-4);
    padding: var(--space-4);
  }
}
</style>
