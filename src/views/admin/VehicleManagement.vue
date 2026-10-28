<template>
  <div class="veiculos-container">
    <PageHeader titulo="Veículos" subtitulo="Gerenciar veículos cadastrados" />

    <!-- Barra de Pesquisa, Filtros e Novo Veículo -->
    <SearchFilterBar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      search-label="Insira a placa ou modelo"
      :filter-options="[
        { label: 'Todos', value: 'todos' },
        { label: 'Ativos', value: 'ativo' },
        { label: 'Inativos', value: 'inativo' },
      ]"
      action-label="NOVO VEÍCULO"
      action-icon="mdi-plus"
      @action="openDialog"
    />

    <!-- Lista de Veículos em Cards -->
    <div class="veiculos-grid">
      <v-row>
        <v-col v-for="veiculo in vehicles" :key="veiculo.id" cols="12" md="6" lg="6" xl="4">
          <VehicleCard :veiculo="veiculo" @edit="editarVeiculo" @delete="abrirModalExclusao" />
        </v-col>
      </v-row>
    </div>

    <!-- Mensagem quando não há resultados -->
    <div v-if="vehicles.length === 0" class="empty-state">
      <div class="empty-state-content">
        <v-icon icon="mdi-car-off" size="64" class="empty-icon"></v-icon>
        <h3 class="empty-title">
          {{ searchQuery ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado' }}
        </h3>
        <p class="empty-subtitle">
          {{
            searchQuery
              ? 'Tente ajustar os filtros de pesquisa'
              : 'Clique em "Novo Veículo" para adicionar o primeiro veículo'
          }}
        </p>
      </div>
    </div>

    <!-- Dialog para Adicionar/Editar Veículo -->
    <VehicleDialog
      v-model="dialog"
      :is-editing="isEditing"
      :veiculo="formVeiculo"
      @save="salvarVeiculo"
      @close="closeDialog"
    />
    <ConfirmDialog
      v-model="modalExclusao"
      :objeto="objetoExclusao"
      @confirm="confirmarExclusao"
    />
  </div>

  <PaginationBar
    v-model="currentPageUi"
    :length="totalPages"
    :total="totalElements"
    :por-pagina="pageSize"
    @update:modelValue="(page) => loadingCars(page - 1)"
  />

</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import VehicleCard from '../../components/admin/VehicleCard.vue'
import VehicleDialog from '../../components/admin/VehicleDialog.vue'
import SearchFilterBar from '../../components/app/SearchFilterBar.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import { getCars, deleteCar } from '@/services/vehicleService'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'

// Estados reativos
const dialog = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const vehicles = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(null)
const pageSize = ref(null)
const currentPageUi = ref(1)
const modalExclusao = ref(false)
const veiculoParaExcluir = ref(null)

watch(currentPage, (newVal) => {
  currentPageUi.value = newVal + 1
})

watchDebounced(
  [searchQuery, statusFilter],
  () => {
    loadingCars(0)
  },
  { debounce: 400 },
)

async function loadingCars(page = 0) {
  loading.value = true
  try {
    const search = searchQuery.value || undefined
    let active

    if (statusFilter.value === 'ativo') active = true
    else if (statusFilter.value === 'inativo') active = false
    else active = undefined

    const response = await getCars(page, search, active)
    const data = response.data

    vehicles.value = response.data.content.map((veiculo) => ({
      id: veiculo.id,
      plate: veiculo.licensePlate,
      model: veiculo.model,
      status: veiculo.active,
    }))
    currentPage.value = data.number
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    pageSize.value = data.size
  } catch (err) {
    console.log('Erro ao buscar veículos', err)
  } finally {
    loading.value = false
  }
}

const formVeiculo = ref({
  id: null,
  plate: '',
  model: '',
  status: '',
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
  formVeiculo.value = {
    id: null,
    plate: '',
    model: '',
    status: 'ativo',
  }
}

const editarVeiculo = (veiculo) => {
  isEditing.value = true
  formVeiculo.value = { ...veiculo }
  dialog.value = true
}

const salvarVeiculo = async () => {
  try {
    await loadingCars()
    closeDialog()
  } catch (err) {
    console.error('Erro ao salvar veículo:', err)
  }
}

const abrirModalExclusao = (id) => {
  veiculoParaExcluir.value = id
  modalExclusao.value = true
}

// "Excluir o veículo ABC1D23?": a confirmação nomeia o que vai ser apagado.
const objetoExclusao = computed(() => {
  const veiculo = vehicles.value.find((item) => item.id === veiculoParaExcluir.value)
  return veiculo ? `o veículo ${veiculo.plate}` : ''
})

const fecharModalExclusao = () => {
  modalExclusao.value = false
  veiculoParaExcluir.value = null
}

const confirmarExclusao = async () => {
  try {
    await deleteCar(veiculoParaExcluir.value)
    await loadingCars()
    fecharModalExclusao()
  } catch (err) {
    console.error('Erro ao deletar Veiculo:', err)
  }
}

onMounted(() => {
  loadingCars()
})
</script>

<style scoped>
.veiculos-container {
  padding: 24px;
  background-color: #fafafa;
  min-height: 100vh;
}

.veiculos-grid {
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
  .veiculos-container {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .veiculos-container {
    padding: 16px;
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

@media (max-width: 480px) {
  .veiculos-container {
    padding: 12px;
  }

  .empty-state {
    padding: 32px 12px;
  }
}
</style>
