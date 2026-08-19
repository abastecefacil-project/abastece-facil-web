<template>
  <v-card class="posto-card" rounded="lg" @click="$emit('view', posto)" style="cursor: pointer">
    <v-card-text class="pa-4">
      <div class="d-flex align-start">
        <!-- Ícone do Posto -->
        <div class="posto-icon mr-4">
          <div class="posto-icon-bg">
            <v-icon icon="mdi-gas-station" size="22"></v-icon>
          </div>
        </div>

        <!-- Informações do Posto -->
        <div class="flex-grow-1 posto-content">
          <h3 class="posto-name">
            {{ posto.name }}
          </h3>

          <div class="posto-info">
            <v-icon icon="mdi-map-marker-outline" size="15" class="mr-2 posto-info-icon"></v-icon>
            <span>{{ posto.completeAddress }}</span>
          </div>

          <div class="posto-info">
            <v-icon icon="mdi-phone-outline" size="15" class="mr-2 posto-info-icon"></v-icon>
            <span>{{ posto.telefone }}</span>
          </div>
        </div>

        <!-- Ícone de Visualizar -->
        <div class="posto-actions">
          <v-icon icon="mdi-chevron-right" size="20"></v-icon>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  posto: {
    type: Object,
    required: true,
  },
})

defineEmits(['view'])
</script>

<style scoped>
.posto-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
  overflow: visible;
  height: 100%;
}

.posto-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.posto-card:hover .posto-actions .v-icon {
  color: var(--color-primary);
}

/* Ícone do Posto */
.posto-icon {
  flex-shrink: 0;
}

.posto-icon-bg {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Informações do Posto */
.posto-content {
  min-width: 0;
  overflow: hidden;
}

.posto-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.posto-info {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
  overflow: hidden;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.posto-info-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.posto-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.posto-info:last-child {
  margin-bottom: 0;
}

/* Ícone de Ação */
.posto-actions {
  display: flex;
  flex-shrink: 0;
  margin-left: 8px;
  align-items: center;
  color: var(--color-border-strong);
  transition: color var(--transition);
}

/* Responsividade */
@media (max-width: 600px) {
  .posto-icon-bg {
    width: 38px;
    height: 38px;
  }
}
</style>
