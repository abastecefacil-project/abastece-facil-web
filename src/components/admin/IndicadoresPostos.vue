<template>
  <div class="indicadores">
    <div v-for="indicador in indicadores" :key="indicador.chave" class="indicador-card">
      <div class="indicador-conteudo">
        <p class="indicador-rotulo">{{ indicador.rotulo }}</p>
        <v-skeleton-loader
          v-if="indicador.valor === null && carregando"
          type="text"
          class="indicador-skeleton"
        />
        <p v-else class="indicador-valor">{{ indicador.texto }}</p>
      </div>
      <div :class="['indicador-icone', `indicador-icone--${indicador.chave}`]">
        <v-icon :icon="indicador.icone" size="22" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatarNumero } from '@/utils/importacaoPostos'

// null = ainda sem número: skeleton enquanto carrega, "—" se a consulta falhou.
const props = defineProps({
  total: { type: Number, default: null },
  ativos: { type: Number, default: null },
  inativos: { type: Number, default: null },
  carregando: { type: Boolean, default: false },
})

const SEM_VALOR = '—'

const indicadores = computed(() =>
  [
    { chave: 'total', rotulo: 'Total', valor: props.total, icone: 'mdi-gas-station' },
    { chave: 'ativos', rotulo: 'Ativos', valor: props.ativos, icone: 'mdi-check-circle-outline' },
    { chave: 'inativos', rotulo: 'Inativos', valor: props.inativos, icone: 'mdi-close-circle-outline' },
  ].map((indicador) => ({
    ...indicador,
    texto: indicador.valor === null ? SEM_VALOR : formatarNumero(indicador.valor),
  })),
)
</script>

<style scoped>
.indicadores {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

/* Mesmo padrão do StatsCards do dashboard: borda sutil, hover só por borda. */
.indicador-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
}

.indicador-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.indicador-conteudo {
  flex-grow: 1;
  min-width: 0;
}

.indicador-rotulo {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.01em;
}

.indicador-valor {
  margin: 2px 0 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.25;
  letter-spacing: -0.02em;
}

/* Mesma altura da linha do número, para a troca não deslocar o card. */
.indicador-skeleton {
  height: 30px;
  max-width: 96px;
  margin-top: 2px;
  background: transparent;
}

.indicador-skeleton :deep(.v-skeleton-loader__text) {
  height: 22px;
  margin: 4px 0;
}

/* A cor semântica fica só no ícone, discreta. success e error vêm do tema do
   Vuetify, que não tem token CSS próprio para elas (CLAUDE.md §8). */
.indicador-icone {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicador-icone--total {
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
}

.indicador-icone--ativos {
  background-color: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.indicador-icone--inativos {
  background-color: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

@media (max-width: 600px) {
  .indicadores {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
