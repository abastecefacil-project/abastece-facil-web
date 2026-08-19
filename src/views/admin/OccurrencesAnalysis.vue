<template>
  <div class="ocorrencias-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <h1 class="page-title">Ocorrências</h1>
      <p class="page-subtitle">Acompanhe as ocorrências registradas no sistema</p>
    </div>

    <!-- Barra de Pesquisa e Filtros -->
    <SearchFilterBar
      v-model:search-query="searchQuery"
      v-model:status-filter="sortFilter"
      search-label="Pesquisar ocorrências..."
      :filter-options="[
        { label: 'Mais Recentes', value: 'recentes' },
        { label: 'Mais Antigas', value: 'antigas' },
      ]"
    />

    <!-- Lista de Ocorrências em Cards -->
    <div class="ocorrencias-grid">
      <v-row>
        <v-col
          v-for="occurrence in occurrences"
          :key="occurrence.id"
          cols="12"
          sm="6"
          md="6"
          lg="4"
        >
          <OccurrenceCard :occurrence="occurrence" @click="openOccurrence(occurrence)" />
        </v-col>
      </v-row>
    </div>

    <!-- Mensagem quando não há resultados -->
    <div v-if="occurrences.length === 0" class="empty-state">
      <v-icon icon="mdi-alert-circle-outline" size="56" color="#BDBDBD"></v-icon>
      <h3 class="empty-title">
        {{ searchQuery ? 'Nenhuma ocorrência encontrada' : 'Nenhuma ocorrência registrada' }}
      </h3>
      <p class="empty-subtitle">
        {{
          searchQuery
            ? 'Tente ajustar os filtros de pesquisa'
            : 'As ocorrências registradas aparecerão aqui'
        }}
      </p>
    </div>

    <!-- Dialog para visualizar ocorrência completa -->
    <v-dialog v-model="dialogOpen" max-width="600px">
      <v-card rounded="lg">
        <v-card-title class="pa-6 pb-4 d-flex justify-space-between align-center">
          <span class="text-h5 font-weight-bold">Detalhes da Ocorrência</span>
          <v-btn icon size="small" variant="text" @click="dialogOpen = false">
            <v-icon icon="mdi-close"></v-icon>
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6" v-if="selectedOccurrence">
          <div class="dialog-content">
              <v-row>
                <v-col cols="6" sm="6">
                  <div class="info-row">
                    <span class="info-label">Placa:</span>
                    <span class="info-value">{{ selectedOccurrence.licensePlate }}</span>
                  </div>
                </v-col>

                <v-col cols="6" sm="6">
                  <div class="info-row">
                    <span class="info-label">Nome:</span>
                    <span class="info-value">{{ selectedOccurrence.name }}</span>
                  </div>
                </v-col>
              </v-row>

            <div class="info-row">
              <span class="info-label">Título:</span>
              <span class="info-value">{{ selectedOccurrence.title }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Descrição:</span>
              <p class="info-description">{{ selectedOccurrence.description }}</p>
            </div>

            <v-row>
              <v-col cols="6" sm="6">
                <div class="info-row">
                  <span class="info-label">Data Informada:</span>
                  <span class="info-value">{{ selectedOccurrence.occurrenceDate }}</span>
                </div>
              </v-col>

              <v-col cols="6" sm="6">
                <div class="info-row">
                  <span class="info-label">Data Criada:</span>
                  <span class="info-value">{{ selectedOccurrence.date }}</span>
                </div>
              </v-col>
            </v-row>

          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-6 pt-4 d-flex justify-end">
          <v-btn
            size="large"
            rounded="lg"
            @click="dialogOpen = false"
            color="#424242"
            class="cancel-btn"
          >
            FECHAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

  <PaginationBar
    v-model="currentPageUi"
    :length="totalPages"
    @update:modelValue="(page) => loadingOccurrences(page - 1)"
  />

  <Footer />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import OccurrenceCard from '../../components/admin/OccurrenceCard.vue'
import SearchFilterBar from '../../components/app/SearchFilterBar.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import Footer from '@/components/app/Footer.vue'
import { getOccurrences } from '@/services/occurrenceService.js'

// Estados reativos
const searchQuery = ref('')
const sortFilter = ref('recentes')
const dialogOpen = ref(false)
const occurrences = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const currentPageUi = ref(1)
const selectedOccurrence = ref(null)

watch(currentPage, (newVal) => {
  currentPageUi.value = newVal + 1
})

watchDebounced(
  [searchQuery, sortFilter],
  () => {
    loadingOccurrences(0)
  },
  { debounce: 400 },
)

async function loadingOccurrences(page = 0) {
  loading.value = true
  try {
    const title = searchQuery.value || undefined

    const response = await getOccurrences(page, title)
    const data = response.data

    occurrences.value = response.data.content.map((occurrence) => ({
      id: occurrence.id,
      title: occurrence.title,
      description: occurrence.description,
      date: occurrence.createdAt,
      occurrenceDate: occurrence.occurrenceDate,
      licensePlate: occurrence.carPlate,
      name: occurrence.userName
    }))
    currentPage.value = data.number
    totalPages.value = data.totalPages
  } catch (error) {
    console.error('Erro ao carregar ocorrências:', error)
  } finally {
    loading.value = false
  }
}

function formatarDataBrasileira(dataISO) {
  const data = new Date(dataISO)

  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = data.getFullYear()

  const horas = String(data.getHours()).padStart(2, '0')
  const minutos = String(data.getMinutes()).padStart(2, '0')

  return `${dia}/${mes}/${ano} ${horas}:${minutos}`
}

function converterDataParaBR(dataISO) {
  if (!dataISO) return ''
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

const openOccurrence = (occurrence) => {
  const occurrenceCopy = { ...occurrence }
  occurrenceCopy.date = formatarDataBrasileira(occurrenceCopy.date)
  occurrenceCopy.occurrenceDate = converterDataParaBR(occurrenceCopy.occurrenceDate)
  selectedOccurrence.value = occurrenceCopy
  dialogOpen.value = true
}

onMounted(() => {
  loadingOccurrences()
})
</script>

<style scoped>
.ocorrencias-container {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
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

.ocorrencias-grid {
  margin-top: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #616161;
  margin: 16px 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: #9e9e9e;
  margin: 0;
}

/* Dialog Styles */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 13px;
  font-weight: 600;
  color: #424242;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  color: #616161;
  line-height: 1.5;
}

.info-description {
  font-size: 15px;
  color: #616161;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.cancel-btn {
  background-color: #424242 !important;
  color: white !important;
  border: 1px solid #424242 !important;
  font-weight: bold;
}

/* Vuetify overrides */
:deep(.v-field) {
  background-color: #ffffff;
}

:deep(.v-field__input) {
  padding-top: 10px;
  padding-bottom: 10px;
}

/* Responsividade */
@media (max-width: 768px) {
  .ocorrencias-container {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>
