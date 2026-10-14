<template>
  <div class="postos-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Postos</h1>
        <p class="page-subtitle">Visualize todos os postos de combustível cadastrados</p>
      </div>
    </div>

    <!-- Barra de Pesquisa e Filtros (SEM botão de novo posto) -->
    <SearchFilterBar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      search-label="Buscar por nome ou cidade"
    />

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <template v-else>
      <v-alert
        v-if="cargaIncompleta"
        type="warning"
        variant="tonal"
        density="compact"
        class="carga-aviso"
      >
        Não foi possível carregar todos os postos. Recarregue a página.
      </v-alert>

      <!-- Com zero resultados quem fala é o empty-state, com o mesmo texto -->
      <p v-if="filteredPostos.length" class="postos-contagem">
        {{ descreverQuantidadePostos(filteredPostos.length, Boolean(searchQuery)) }}
      </p>
    </template>

    <!-- Lista de Postos em Cards -->
    <div v-if="!loading" class="postos-grid">
      <v-row>
        <v-col v-for="posto in postosDaPagina" :key="posto.id" cols="12" md="6" lg="6" xl="4">
          <GasStationCard :posto="posto" @view="openModal" />
        </v-col>
      </v-row>
    </div>

    <!-- Mensagem quando não há resultados -->
    <div v-if="!loading && filteredPostos.length === 0" class="empty-state">
      <div class="empty-state-content">
        <v-icon icon="mdi-gas-station-off" size="64" class="empty-icon"></v-icon>
        <h3 class="empty-title">Nenhum posto encontrado</h3>
        <p class="empty-subtitle">Tente ajustar os filtros de pesquisa</p>
      </div>
    </div>

    <!-- Modal de Detalhes -->
    <GasStationModal v-model="showModal" :posto="selectedPosto" />
  </div>

  <PaginationBar v-model="paginaAtual" :length="totalPages" />

  <Footer />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import GasStationCard from '@/components/user/GasStationCard.vue'
import GasStationModal from '@/components/user/GasStationModal.vue'
import SearchFilterBar from '@/components/app/SearchFilterBar.vue'
import Footer from '@/components/app/Footer.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import { listarTodosPostosAtivos } from '@/services/stationService'
import { descreverQuantidadePostos, nomeExibicaoPosto } from '@/utils/posto'

// A base inteira vem numa carga só e a paginação é feita aqui, porque a busca
// e a ordenação são no navegador: sobre uma página do servidor, a busca só
// enxergaria os 10 postos dela.
const POSTOS_POR_PAGINA = 10

// Estados reativos
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const postos = ref([])
const cargaIncompleta = ref(false)
const showModal = ref(false)
const selectedPosto = ref(null)
const paginaAtual = ref(1)

// GET - Busca todos os postos ativos
async function carregaPostos() {
  loading.value = true
  try {
    const { postos: carregados, completo } = await listarTodosPostosAtivos()
    cargaIncompleta.value = !completo

    postos.value = carregados.map((posto) => ({
      id: posto.id,
      name: posto.name,
      fantasyName: posto.fantasyName,
      completeAddress: `${posto.address} - ${posto.district}, ${posto.city} - ${posto.state}`,
      telefone: posto.phone,
      cnpj: posto.cnpj,
      cep: posto.cep,
      district: posto.district,
      city: posto.city,
      state: posto.state,
      address: (posto.address ?? '').split(',')[0],
      number: (posto.address ?? '').split(',')[1]?.trim() || '',
      businessHours: posto.businessHours,
    }))
  } finally {
    loading.value = false
  }
}

// Computed para filtrar postos
const filteredPostos = computed(() => {
  let filtered = postos.value

  // Filtro por busca
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (posto) =>
        posto.name.toLowerCase().includes(query) ||
        posto.fantasyName?.toLowerCase().includes(query) ||
        posto.completeAddress.toLowerCase().includes(query) ||
        posto.telefone?.includes(query) ||
        posto.cnpj.includes(query),
    )
  }

  // Ordenação A-Z
  if (statusFilter.value === 'az') {
    filtered = [...filtered].sort((a, b) =>
      nomeExibicaoPosto(a).localeCompare(nomeExibicaoPosto(b)),
    )
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredPostos.value.length / POSTOS_POR_PAGINA))

const postosDaPagina = computed(() => {
  const inicio = (paginaAtual.value - 1) * POSTOS_POR_PAGINA
  return filteredPostos.value.slice(inicio, inicio + POSTOS_POR_PAGINA)
})

// Busca ou ordenação nova mudam a lista: volta para a primeira página.
watch([searchQuery, statusFilter], () => {
  paginaAtual.value = 1
})

// Abrir modal
const openModal = (posto) => {
  selectedPosto.value = posto
  showModal.value = true
}

onMounted(() => {
  carregaPostos()
})
</script>

<style scoped>
.postos-container {
  padding: 28px 32px;
  background-color: var(--color-background);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.postos-grid {
  margin-top: 8px;
}

.carga-aviso {
  margin-bottom: 12px;
}

.postos-contagem {
  margin: 0 0 4px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 24px;
  min-height: 300px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 24px;
  min-height: 300px;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  color: var(--color-border-strong);
  margin-bottom: 20px;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.empty-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.4;
}

/* Responsividade */
@media (max-width: 1200px) {
  .postos-container {
    max-width: 100%;
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .postos-container {
    padding: 16px;
  }

  .empty-state {
    padding: 48px 16px;
    min-height: 250px;
  }

  .empty-title {
    font-size: 1.05rem;
  }

  .empty-subtitle {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .postos-container {
    padding: 12px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .empty-state {
    padding: 32px 12px;
  }
}
</style>
