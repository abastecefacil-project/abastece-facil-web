<template>
  <v-card class="posto-card" elevation="2" rounded="lg">
    <v-card-text class="pa-4">
      <div class="d-flex align-start">
        <!-- Ícone do Posto -->
        <div class="posto-icon mr-4">
          <div class="posto-icon-bg">
            <v-icon icon="mdi-gas-station" color="#ffffff" size="24"></v-icon>
          </div>
        </div>

        <!-- Informações do Posto -->
        <div class="flex-grow-1 posto-content">
          <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">
            {{ posto.name }}
          </h3>

          <div class="posto-info mb-1">
            <v-icon icon="mdi-map-marker-outline" size="16" class="mr-2 text-grey"></v-icon>
            <span class="text-body-2 text-grey-darken-1">{{ posto.completeAddress }}</span>
          </div>

          <div v-if="posto.phone" class="posto-info">
            <v-icon icon="mdi-phone-outline" size="16" class="mr-2 text-grey"></v-icon>
            <span class="text-body-2 text-grey-darken-1">{{ posto.phone }}</span>
          </div>
          <div v-else class="posto-info">
            <v-icon icon="mdi-phone-outline" size="16" class="mr-2 text-grey"></v-icon>
            <span class="text-body-2 text-grey-darken-1">Não informado</span>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="posto-actions">
          <v-chip
            :color="posto.status ? '#008109' : '#C62828'"  
            text-color="#FFFFFF"
            size="small"
            class="status-chip"
            label
          >
            {{ posto.status ? 'Ativo' : 'Inativo' }}
          </v-chip>
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="x-small"
            color="grey-darken-1"
            @click="$emit('edit', posto)"
            class="action-btn"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="x-small"
            color="grey-darken-1"
            @click="$emit('delete', posto.id)"
            class="action-btn"
          ></v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  posto: {
    type: Object,
    required: true,
  },
})


defineEmits(['edit', 'delete'])
</script>

<style scoped>
.posto-card {
  background: white;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
  overflow: visible;
}

.posto-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Ícone do Posto */
.posto-icon {
  flex-shrink: 0;
}

.posto-icon-bg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ef5350;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Informações do Posto */
.posto-content {
  min-width: 0;
  overflow: hidden;
}

.posto-info {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  overflow: hidden;
}

.posto-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.posto-info:last-child {
  margin-bottom: 0;
}

/* Botões de Ação */
.posto-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  margin-left: 8px;
  align-items: flex-end;
}

.status-chip {
  font-weight: 300;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  height: 24px;
  padding: 0 12px;
}

.action-btn {
  width: 28px !important;
  height: 28px !important;
  min-width: unset !important;
}

/* Responsividade */
@media (max-width: 600px) {
  .posto-actions {
    flex-direction: row;
    gap: 4px;
  }

  .posto-icon-bg {
    width: 40px;
    height: 40px;
  }
}
</style>