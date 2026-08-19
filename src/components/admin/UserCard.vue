<template>
  <v-card class="user-card" elevation="1">
    <div class="card-content">
      <!-- Header com ícone, info e ações -->
      <div class="user-header">
        <!-- Ícone -->
        <div class="user-icon-wrapper">
          <v-icon icon="mdi-account" size="28" class="user-icon"></v-icon>
        </div>

        <!-- Informações principais -->
        <div class="user-info">
          <h3 class="user-name">{{ user.name }}</h3>
          <p class="user-email">{{ user.email }}</p>
        </div>

        <!-- Ações (edit e delete) -->
        <div class="user-actions">
          <v-btn icon size="small" variant="text" @click.stop="$emit('delete', user.id)">
            <v-icon icon="mdi-delete" size="20" color="#666666"></v-icon>
          </v-btn>
        </div>
      </div>
      
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    required: true,
  },
})

defineEmits(['delete'])
</script>

<style scoped>
.user-card {
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  cursor: default;
}

.user-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-icon-wrapper {
  background: #5e35b1;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-icon {
  color: #ffffff;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
  margin: 0 0 2px 0;
  line-height: 1.3;
  letter-spacing: 0.3px;
}

.user-email {
  font-size: 13px;
  color: #757575;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-actions {
  display: flex;
  gap: 0;
  flex-shrink: 0;
  margin-left: auto;
}

.user-footer {
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
  padding: 0 12px;
}

/* Responsividade */
@media (max-width: 768px) {
  .card-content {
    padding: 14px;
  }

  .user-name {
    font-size: 15px;
  }

  .user-email {
    font-size: 12px;
  }
}
</style>