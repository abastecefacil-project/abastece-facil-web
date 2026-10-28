<template>
  <div class="ocorrencias-container">
    <PageHeader titulo="Ocorrências" subtitulo="Acompanhe as ocorrências registradas no sistema" />

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

        <v-card-actions class="dialog-actions">
          <v-btn
            class="btn-dialog btn-dialog--cancelar"
            variant="outlined"
            @click="dialogOpen = false"
          >
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

  <PaginationBar
    v-model="currentPageUi"
    :length="totalPages"
    :total="totalElements"
    :por-pagina="pageSize"
    @update:modelValue="(page) => loadingOccurrences(page - 1)"
  />

</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import OccurrenceCard from '../../components/admin/OccurrenceCard.vue'
import SearchFilterBar from '../../components/app/SearchFilterBar.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import { formatarDataCurta, formatarDataHora } from '@/utils/formatacao'
import { getOccurrences } from '@/services/occurrenceService.js'

// Estados reativos
const searchQuery = ref('')
const sortFilter = ref('recentes')
const dialogOpen = ref(false)
const occurrences = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(null)
const pageSize = ref(null)
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
    totalElements.value = data.totalElements
    pageSize.value = data.size
  } catch (error) {
    console.error('Erro ao carregar ocorrências:', error)
  } finally {
    loading.value = false
  }
}

const openOccurrence = (occurrence) => {
  const occurrenceCopy = { ...occurrence }
  occurrenceCopy.date = formatarDataHora(occurrenceCopy.date)
  occurrenceCopy.occurrenceDate = formatarDataCurta(occurrenceCopy.occurrenceDate)
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

}
</style>
