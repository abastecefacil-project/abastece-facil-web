<template>
  <!-- Um painel só: precisa estar dentro de um v-expansion-panels do chamador. -->
  <v-expansion-panel>
    <v-expansion-panel-title>
      <span class="painel-titulo">{{ titulo }}</span>
      <span class="painel-contagem">{{ formatarNumero(ocorrencias.length) }}</span>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-virtual-scroll :items="ocorrencias" max-height="320">
        <template #default="{ item }">
          <div class="linha-item">
            <span class="linha-meta">
              {{ rotuloLinha(item.linha) }} · CNPJ {{ item.cnpj || '—' }}
            </span>
            <span class="linha-mensagem">{{ item.mensagem }}</span>
          </div>
        </template>
      </v-virtual-scroll>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
import { formatarNumero, rotuloLinha } from '@/utils/importacaoPostos'

// Erros ou avisos ({ linha, cnpj, mensagem }) da importação, usados na prévia
// e no relatório final.
defineProps({
  titulo: {
    type: String,
    required: true,
  },
  ocorrencias: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.painel-titulo {
  font-weight: 600;
  color: var(--color-text);
}

.painel-contagem {
  margin-left: 8px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 20px;
}

.linha-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border);
}

.linha-meta {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.linha-mensagem {
  font-size: 0.8125rem;
  color: var(--color-text);
}
</style>
