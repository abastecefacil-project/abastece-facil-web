<template>
  <v-card class="vehicle-card" elevation="1">
    <div class="card-content">
      <!-- Header com ícone, info e ações -->
      <div class="vehicle-header">
        <!-- Ícone -->
        <div class="vehicle-icon-wrapper">
          <v-icon icon="mdi-car" size="28" class="vehicle-icon"></v-icon>
        </div>

        <!-- Informações principais -->
        <div class="vehicle-info">
          <h3 class="vehicle-placa">{{ veiculo.plate }}</h3>
          <p class="vehicle-modelo">{{ veiculo.model }}</p>
        </div>

        <!-- Ações (edit e delete) -->
        <div class="vehicle-actions">
          <v-chip
            :color="veiculo.status ? '#008109' : '#C62828'"  
            text-color="#FFFFFF"
            size="small"
            class="status-chip"
            label
          >
            {{ veiculo.status ? 'Ativo' : 'Inativo' }}
          </v-chip>

          <v-btn icon size="small" variant="text" @click.stop="$emit('edit', veiculo)">
            <v-icon icon="mdi-pencil" size="20" color="#666666"></v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" @click.stop="$emit('delete', veiculo.id)">
            <v-icon icon="mdi-delete" size="20" color="#666666"></v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="vehicle-footer">
        
      </div>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  veiculo: {
    type: Object,
    required: true,
  },
})

defineEmits(['edit', 'delete'])
</script>

<style scoped>
.vehicle-card {
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  cursor: default;
}

.vehicle-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vehicle-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vehicle-icon-wrapper {
  background: #5c6bc0;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vehicle-icon {
  color: #ffffff;
}

.vehicle-info {
  flex: 1;
  min-width: 0;
}

.vehicle-placa {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
  margin: 0 0 2px 0;
  line-height: 1.3;
  letter-spacing: 0.3px;
}

.vehicle-modelo {
  font-size: 13px;
  color: #757575;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vehicle-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end; 
  flex-shrink: 0;
  margin-left: auto;
}

.vehicle-icons-row {
  display: flex;
  gap: 12px;
  padding-left: 4px;
}

.vehicle-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.status-chip {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  height: 24px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  margin-right: 6px; /* espaço leve só entre o chip e o ícone de edição */
}


/* Responsividade */
@media (max-width: 768px) {
  .card-content {
    padding: 14px;
  }

  .vehicle-placa {
    font-size: 15px;
  }

  .vehicle-modelo {
    font-size: 12px;
  }
}
</style>
