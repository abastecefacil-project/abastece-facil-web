<template>
  <!-- Cards em grid responsivo -->
  <v-row class="stats-row mb-3" no-gutters >
    <v-col
      v-for="stat in stats"
      :key="stat.title"
      cols="6"
      sm="6"
      md="3"
      class="stats-col"
    >
      <v-card class="stat-card" rounded="lg">
        <v-card-text class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div class="stat-content flex-grow-1">
              <p class="stat-title">
                {{ stat.title }}
              </p>
              <p class="stat-value">
                {{ stat.value }}
              </p>
            </div>
            <div class="stat-icon">
              <v-icon :icon="stat.icon" size="22" />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'


const props = defineProps({
  gasStations: {
    type: Number,
    default: 0,
  },
  vehicles: {
    type: Number,
    default: 0, 
  },
  users: {
    type: Number,
    default: 0, 
  },
  occurrences: {
    type: Number,
    default: 0,
  },
})
  
  const stats = computed(() => [
    { title: 'Total de Postos', value: `${props.gasStations}`, icon: 'mdi-gas-station' },
    { title: 'Total de Veículos', value: `${props.vehicles}`, icon: 'mdi-car' },
    { title: 'Total de Usuários', value: `${props.users}`, icon: 'mdi-account-group' },
    { title: 'Total Ocorrências', value: `${props.occurrences}`, icon: 'mdi-alert-circle' },
  ])
</script>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
  height: 100%;
}

.stat-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.stat-content {
  min-width: 0;
}

.stat-content p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

.stat-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.01em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin-top: 2px !important;
}

/* Ícone neutro: a cor fica por conta da hierarquia, não de 4 cores diferentes */
.stat-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-row {
  margin: -6px;
}

.stats-col {
  padding: 6px !important;
}

@media (max-width: 600px) {
  .stats-col {
    padding: 4px !important;
  }

  .stat-card {
    min-height: 85px;
  }

  .stat-card .v-card-text {
    padding: 12px !important;
  }

  .stat-title {
    font-size: 0.7rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
