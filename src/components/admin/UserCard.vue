<template>
  <v-card class="user-card" elevation="1">
    <div class="card-content">
      <!-- Header com info e ações -->
      <div class="user-header">
        <!-- Informações principais -->
        <div class="user-info">
          <h3 class="user-name">{{ user.name }}</h3>
          <p class="user-email">{{ user.email }}</p>
          <p v-if="user.perfil !== 'ADMINISTRADOR'" class="user-email mt-1">
            Regional: {{ user.regional?.nome || 'Não informada' }}
          </p>
        </div>

        <!-- Ações do usuário -->
        <div class="user-actions">
          <v-btn
            v-if="podeEditar"
            icon
            size="small"
            variant="text"
            aria-label="Editar usuário"
            @click.stop="$emit('edit', user)"
          >
            <v-icon icon="mdi-pencil" size="20" color="#666666"></v-icon>
          </v-btn>
          <v-btn
            v-if="podeAlterarStatus"
            icon
            size="small"
            variant="text"
            :aria-label="user.isActive ? 'Inativar usuário' : 'Reativar usuário'"
            @click.stop="$emit('alterar-status', user)"
          >
            <v-icon :icon="user.isActive ? 'mdi-account-off-outline' : 'mdi-account-check-outline'" size="20" color="#666666" />
            <v-tooltip activator="parent">{{ user.isActive ? 'Inativar usuário' : 'Reativar usuário' }}</v-tooltip>
          </v-btn>
        </div>
      </div>

      <!-- Estado da conta e reenvio do convite -->
      <div class="user-footer">
        <v-chip
          size="small"
          variant="tonal"
          :color="estado.cor"
          :prepend-icon="estado.icone"
          class="status-chip"
        >
          {{ estado.label }}
        </v-chip>

        <!-- Só faz sentido reenviar para quem ainda não definiu a senha: o
             backend recusa os demais com 409 SENHA_JA_DEFINIDA. -->
        <v-btn
          v-if="estado.chave === 'aguardando'"
          variant="text"
          size="small"
          color="primary"
          prepend-icon="mdi-email-sync-outline"
          class="reenviar-btn"
          @click.stop="$emit('reenviar-ativacao', user)"
        >
          Reenviar ativação
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  podeEditar: { type: Boolean, default: false },
  podeAlterarStatus: { type: Boolean, default: false },
  user: {
    type: Object,
    required: true,
  },
})

defineEmits(['alterar-status', 'reenviar-ativacao', 'edit'])

// Três estados, derivados de isActive e senhaDefinida. Note que conviteEnviado
// NÃO entra aqui: em qualquer GET ele vem null, e null não é falha.
const estado = computed(() => {
  if (props.user.isActive === false) {
    return {
      chave: 'inativa',
      label: 'Inativa',
      cor: 'var(--color-text-muted)',
      icone: 'mdi-account-off-outline',
    }
  }

  if (props.user.senhaDefinida === false) {
    return {
      chave: 'aguardando',
      label: 'Aguardando ativação',
      cor: 'var(--color-warning)',
      icone: 'mdi-clock-outline',
    }
  }

  return {
    chave: 'ativa',
    label: 'Ativa',
    cor: 'success',
    icone: 'mdi-check-circle-outline',
  }
})
</script>

<style scoped>
.user-card {
  height: 100%;
  border-radius: var(--radius-md);
  transition: border-color var(--transition);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  cursor: default;
}

/* Hover destaca por borda, não por deslocamento. */
.user-card:hover {
  border-color: var(--color-border-strong);
}

.card-content {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.user-info {
  flex: 1;
  min-width: 0;
  min-height: 60px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 2px 0;
  line-height: 1.3;
  letter-spacing: 0.3px;
}

.user-email {
  font-size: 13px;
  color: var(--color-text-muted);
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
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 4px;
}

.status-chip {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reenviar-btn {
  font-weight: 600;
  margin-left: auto;
}

/* Responsividade */
@media (max-width: 768px) {
  .card-content {
  height: 100%;
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
