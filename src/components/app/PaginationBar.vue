<template>
  <div class="pagination-bar">
    <p v-if="intervalo" class="pagination-bar__intervalo" aria-live="polite">{{ intervalo }}</p>
    <v-pagination
      v-model="pagina"
      :length="length"
      :total-visible="totalVisivel"
      prev-icon="mdi-chevron-left"
      next-icon="mdi-chevron-right"
      size="small"
      density="comfortable"
      class="pagination-bar__paginas"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { textoIntervaloPagina } from '@/utils/paginacao'

const props = defineProps({
  // Página da interface, a partir de 1.
  modelValue: { type: Number, default: 1 },
  length: { type: Number, default: 0 },
  // Total de registros e tamanho da página, para "Mostrando X a Y de Z". Sem
  // os dois, o texto é omitido e só a paginação aparece.
  total: { type: Number, default: null },
  porPagina: { type: Number, default: null },
})

const emit = defineEmits(['update:modelValue'])

// Um único caminho de emissão. Antes, o `@update:model-value` do v-pagination
// e um `watch` sobre a cópia local emitiam a mesma troca duas vezes.
const pagina = computed({
  get: () => props.modelValue,
  set: (valor) => {
    if (valor !== props.modelValue) emit('update:modelValue', valor)
  },
})

// Paginação numerada (antes total-visible="1", só a página atual). Cinco
// botões cabem em 390px junto das setas; sete no desktop.
const { smAndDown } = useDisplay()
const totalVisivel = computed(() => (smAndDown.value ? 5 : 7))

const intervalo = computed(() => textoIntervaloPagina(props.modelValue, props.porPagina, props.total))
</script>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-2) 0 var(--space-6);
}

.pagination-bar__intervalo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  font-variant-numeric: tabular-nums;
}

/* Sem o texto, a paginação continua centralizada, como antes. */
.pagination-bar__paginas {
  margin-inline: auto;
}

.pagination-bar__intervalo + .pagination-bar__paginas {
  margin-inline: 0;
}

.pagination-bar__paginas :deep(.v-pagination__list) {
  gap: var(--space-1);
}

.pagination-bar__paginas :deep(.v-pagination__item),
.pagination-bar__paginas :deep(.v-pagination__prev),
.pagination-bar__paginas :deep(.v-pagination__next) {
  margin: 0;
}

.pagination-bar__paginas :deep(.v-btn) {
  min-width: 32px;
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md) !important;
  box-shadow: none;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  transition:
    border-color var(--transition),
    color var(--transition);
}

.pagination-bar__paginas :deep(.v-btn:hover) {
  border-color: var(--color-blue-200);
  color: var(--color-primary);
}

/* A reticência do total-visible é um botão desativado dentro do item, sem
   classe própria; desenhá-la como texto. A regra do ativo, abaixo, vence esta
   quando a lista tem uma página só e o item ativo também sai desativado. */
.pagination-bar__paginas :deep(.v-pagination__item .v-btn--disabled) {
  border-color: transparent;
  background-color: transparent;
}

/* Vuetify 3 usa --is-active; o seletor antigo (--active) nunca chegava a aplicar. */
.pagination-bar__paginas :deep(.v-pagination__item--is-active .v-btn) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-surface);
  font-weight: 600;
}

.pagination-bar__paginas :deep(.v-pagination__item--is-active .v-btn .v-btn__overlay) {
  opacity: 0;
}

@media (max-width: 599px) {
  .pagination-bar {
    flex-direction: column;
  }

  .pagination-bar__intervalo + .pagination-bar__paginas {
    margin-inline: auto;
  }
}
</style>
