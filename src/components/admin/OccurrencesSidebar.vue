<template>
  <v-card class="occurrences-card" elevation="2" rounded="lg">
    <v-card-title class="pa-3 pb-2">
      <h3 class="text-h6 font-weight-bold text-grey-darken-2 text-center">Últimas ocorrências</h3>
    </v-card-title>

    <v-card-text class="pa-0">
      <div v-if="loading" class="pa-4 text-center text-grey">
        Carregando...
      </div>

      <div v-else-if="!occurrences.length" class="pa-2 text-center text-grey">
        Nenhuma ocorrência recente
      </div>

       <div v-else>
        <div
          v-for="(occurrence, index) in occurrences"
          :key="occurrence.id"
          class="occurrence-item"
        >
          <div class="d-flex align-center pa-4">
            <div class="occurrence-icon mr-3">
              <v-icon icon="mdi-alert" color="warning" size="16" />
            </div>
            <div class="flex-grow-1">
              <p class="text-body-2 font-weight-medium text-grey-darken-2 mb-1 limit-two-lines">
                {{ occurrence.title }}
              </p>
              <p class="text-caption text-grey">
                {{ formatDate(occurrence.createdAt) }}
              </p>
            </div>
          </div>
          <!-- Divider entre os itens -->
          <v-divider v-if="index < occurrences.length - 1" />
        </div>
       </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
  occurrences: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}


</script>

<style scoped>
.occurrences-card {
  background: white;
  border: 1px solid #e0e0e0;
}

.limit-two-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* número de linhas visíveis */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.occurrence-item:hover {
  background-color: #f5f5f5;
}

.occurrence-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #fff3e0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .occurrence-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
