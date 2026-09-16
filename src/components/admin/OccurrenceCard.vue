<template>
  <v-card class="occurrence-card" elevation="1" @click="$emit('click')">
    <div class="card-content">
      <!-- Header com ícone de alerta e ações -->
      <div class="occurrence-header">
        <!-- Ícone de alerta -->
        <div class="alert-icon-wrapper">
          <v-icon icon="mdi-alert" size="28" class="alert-icon"></v-icon>
        </div>

        <!-- Informações principais -->
        <div class="occurrence-info">
          <h3 class="occurrence-titulo">{{ occurrence.title }}</h3>
          <p class="occurrence-descricao">{{ occurrence.description }}</p>
        </div>
      </div>

      <!-- Informações de data e placa -->
      <div class="occurrence-details">
        <div class="detail-item">
          <span class="detail-label">Data:</span>
          <span class="detail-value">{{ formattedDate }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Placa:</span>
          <span class="detail-value">{{ occurrence.licensePlate }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
const props = defineProps({
  occurrence: {
    type: Object,
    required: true,
  },
})

const formattedDate = formatarDataBrasileira(props.occurrence.date);

function formatarDataBrasileira(dataISO) {
  const data = new Date(dataISO);

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();

  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

defineEmits(['edit', 'delete', 'click'])
</script>

<style scoped>
.occurrence-card {
  border-radius: 8px;
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  cursor: pointer;
}

.occurrence-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-2px);
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.occurrence-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-icon-wrapper {
  background: #ffc107;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-icon {
  color: #ffffff;
}

.occurrence-info {
  flex: 1;
  min-width: 0;
}

.occurrence-titulo {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.occurrence-descricao {
  font-size: 13px;
  color: #757575;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.occurrence-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 4px;
}

.detail-item {
  display: flex;
  gap: 6px;
  font-size: 13px;
  line-height: 1.4;
}

.detail-label {
  color: #9e9e9e;
  font-weight: 500;
}

.detail-value {
  color: #616161;
}

/* Responsividade */
@media (max-width: 768px) {
  .card-content {
    padding: 14px;
  }

  .occurrence-titulo {
    font-size: 15px;
  }

  .occurrence-descricao {
    font-size: 12px;
  }

  .detail-item {
    font-size: 12px;
  }
}
</style>
