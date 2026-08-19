<template>
  <div class="postos-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Postos</h1>
        <p class="page-subtitle">Gerenciar postos de combustível</p>
      </div>
    </div>
    <!-- Barra de Pesquisa, Filtros e Novo Posto -->
    <SearchFilterBar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      search-label="Pesquisar postos..."
      :filter-options="[
        { label: 'Todos', value: 'todos' },
        { label: 'Ativos', value: 'ativo' },
        { label: 'Inativos', value: 'inativo' },
      ]"
      action-label="NOVO POSTO"
      action-icon="mdi-plus"
      @action="openDialog"
    />

    <!-- Lista de Postos em Cards -->
    <div class="postos-grid">
      <v-row>
        <v-col v-for="posto in postos" :key="posto.id" cols="12" md="6" lg="6" xl="4">
          <PostoCard :posto="posto" @edit="editarPosto" @delete="abrirModalExclusao" />
        </v-col>
      </v-row>
    </div>

    <!-- Mensagem quando não há resultados -->
    <div v-if="postos.length === 0" class="empty-state">
      <div class="empty-state-content">
        <v-icon icon="mdi-gas-station-off" size="64" class="empty-icon"></v-icon>
        <h3 class="empty-title">
          {{ searchQuery ? 'Nenhum posto encontrado' : 'Nenhum posto cadastrado' }}
        </h3>
        <p class="empty-subtitle">
          {{
            searchQuery
              ? 'Tente ajustar os filtros de pesquisa'
              : 'Clique em "NOVO POSTO" para adicionar o primeiro posto'
          }}
        </p>
      </div>
    </div>

    <!-- Dialog para Adicionar/Editar Posto -->
    <PostoDialog
      v-model="dialog"
      :is-editing="isEditing"
      :posto="formPosto"
      @save="salvarPosto"
      @close="closeDialog"
    />
    <ConfirmDialog
      v-model="modalExclusao"
      @confirm="confirmarExclusao"
    />
  </div>

  <PaginationBar
    v-model="currentPageUi"
    :length="totalPages"
    @update:modelValue="(page) => loadingStations(page - 1)"
  />

  <Footer />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import PostoCard from '../../components/admin/PostoCard.vue'
import PostoDialog from '../../components/admin/PostoDialog.vue'
import SearchFilterBar from '../../components/app/SearchFilterBar.vue'
import Footer from '@/components/app/Footer.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import { getStations, deleteStation } from '@/services/stationService'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'

// Estados reativos
const dialog = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const postos = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const currentPageUi = ref(1)
const modalExclusao = ref(false)
const postoParaExcluir = ref(null)

watch(currentPage, (newVal) => {
  currentPageUi.value = newVal + 1
})

watchDebounced(
  [searchQuery, statusFilter],
  () => {
    loadingStations(0)
  },
  { debounce: 400 },
)

//GET- Busca postos
async function loadingStations(page = 0) {
  loading.value = true
  try {
    const search = searchQuery.value || undefined
    let active

    if (statusFilter.value === 'ativo') active = true
    else if (statusFilter.value === 'inativo') active = false
    else active = undefined

    const response = await getStations(page, search, active)
    const data = response.data

    postos.value = response.data.content.map((posto) => ({
      id: posto.id,
      name: posto.name,
      fantasyName: posto.fantasyName,
      completeAddress: `${posto.address} - ${posto.district}, ${posto.city} - ${posto.state}`,
      phone: posto.phone,
      cnpj: posto.cnpj,
      cep: posto.cep,
      district: posto.district,
      city: posto.city,
      state: posto.state,
      address: posto.address.split(',')[0],
      number: posto.address.split(',')[1]?.trim() || '',
      status: posto.isActive,
      openTime: posto.businessHours.split('-')[0],
      closeTime: posto.businessHours.split('-')[1]
    }))
    currentPage.value = data.number
    totalPages.value = data.totalPages

  } catch (err) {
    console.log('Erro ao buscar postos', err)
  } finally {
    loading.value = false
  }
}

const formPosto = ref({
  id: null,
  name: '',
  cnpj: '',
  cep: '',
  city: '',
  state: '',
  address: '',
  number: '',
  phone: '',
  status: '',
  openTime: '',
  closeTime: '',
})

// Funções
const openDialog = () => {
  isEditing.value = false
  resetForm()
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formPosto.value = {
    id: null,
    name: '',
    cnpj: '',
    cep: '',
    city: '',
    state: '',
    address: '',
    number: '',
    phone: '',
    status: '',
    openTime: '',
    closeTime: '',
  }
}

const editarPosto = (posto) => {
  isEditing.value = true
  formPosto.value = { ...posto }
  dialog.value = true
}

const salvarPosto = async () => {
  try {
    await loadingStations()
    closeDialog()
  } catch (err) {
    console.error('Erro ao salvar posto:', err)
  }
}

// Funções da Modal de Exclusão
const abrirModalExclusao = (id) => {
  postoParaExcluir.value = id
  modalExclusao.value = true
}

const fecharModalExclusao = () => {
  modalExclusao.value = false
  postoParaExcluir.value = null
}

const confirmarExclusao = async () => {
  try {
    await deleteStation(postoParaExcluir.value)
    await loadingStations()
    fecharModalExclusao()
  } catch (err) {
    console.error('Erro ao deletar posto:', err)
  }
}

const deletarPosto = async (id) => {
  abrirModalExclusao(id)
}

onMounted(() => {
  loadingStations()
})
</script>

<style scoped>
.postos-container {
  padding: 24px;
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #424242;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1rem;
  color: #757575;
  margin: 0;
  font-weight: 400;
}

.postos-grid {
  margin-top: 8px;
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
  color: #bdbdbd;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #616161;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.empty-subtitle {
  font-size: 0.95rem;
  color: #9e9e9e;
  margin: 0;
  line-height: 1.4;
}

/* Responsividade */
@media (max-width: 1200px) {
  .postos-container {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .postos-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-subtitle {
    font-size: 0.95rem;
  }

  .empty-state {
    padding: 48px 16px;
    min-height: 250px;
  }

  .empty-title {
    font-size: 1.1rem;
  }

  .empty-subtitle {
    font-size: 0.9rem;
  }
}

@media (max-width: 640px) {
  .modal-title {
    font-size: 18px !important;
    padding: 20px 20px 12px !important;
  }

  .modal-text {
    font-size: 15px !important;
    padding: 20px !important;
  }

  .modal-actions {
    padding: 12px 20px 20px !important;
    flex-direction: column-reverse !important;
  }

  .btn-cancelar,
  .btn-confirmar {
    width: 100% !important;
    min-width: unset !important;
  }
}

@media (max-width: 480px) {
  .postos-container {
    padding: 12px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .empty-state {
    padding: 32px 12px;
  }
}
</style>