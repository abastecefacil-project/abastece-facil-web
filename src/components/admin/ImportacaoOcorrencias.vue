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
/* Mesmo visual dos painéis da prévia em ImportacaoPostosDialog. */
.painel-titulo {
  font-size: var(--text-body-size);
  font-weight: 600;
  color: var(--color-text);
}

.painel-contagem {
  margin-left: var(--space-2);
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-100);
  color: var(--color-text-muted);
  font-size: var(--text-caption-size);
  font-weight: 600;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}

.linha-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-1);
  border-bottom: 1px solid var(--color-border);
}

.linha-meta {
  font-size: var(--text-body-sm-size);
  color: var(--color-text-muted);
}

.linha-mensagem {
  font-size: var(--text-body-sm-size);
  color: var(--color-text);
}
</style>
