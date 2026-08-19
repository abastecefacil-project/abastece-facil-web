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

    <!-- Lista de Postos em Cards -->
    <div v-else class="postos-grid">
      <v-row>
        <v-col v-for="posto in filteredPostos" :key="posto.id" cols="12" md="6" lg="6" xl="4">
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

  <PaginationBar
    v-model="currentPageUi"
    :length="totalPages"
    @update:modelValue="(page) => carregaPostos(page - 1)"
  />

  <Footer />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import GasStationCard from '@/components/user/GasStationCard.vue'
import GasStationModal from '@/components/user/GasStationModal.vue'
import SearchFilterBar from '@/components/app/SearchFilterBar.vue'
import Footer from '@/components/app/Footer.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import { getStations } from '@/services/stationService'

// Estados reativos
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const postos = ref([])
const showModal = ref(false)
const selectedPosto = ref(null)
const currentPage = ref(0)
const totalPages = ref(0)
const currentPageUi = ref(1)

watch(currentPage, (newVal) => {
  currentPageUi.value = newVal + 1
})

// GET - Busca postos
async function carregaPostos(page = 0) {
  loading.value = true
  try {
    const search = searchQuery.value || undefined;
    let active = true;

    const response = await getStations(page, search, active)
    const data = response.data

    postos.value = response.data.content.map((posto) => ({
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
      address: posto.address.split(',')[0],
      number: posto.address.split(',')[1]?.trim() || '',
    }))
    currentPage.value = data.number
    totalPages.value = data.totalPages
  } catch (err) {
    console.log('Erro ao buscar postos', err)
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
        posto.completeAddress.toLowerCase().includes(query) ||
        posto.telefone.includes(query) ||
        posto.cnpj.includes(query),
    )
  }

  // Ordenação A-Z
  if (statusFilter.value === 'az') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  return filtered
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
