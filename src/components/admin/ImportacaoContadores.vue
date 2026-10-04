<template>
  <div class="contadores">
    <div
      v-for="contador in contadores"
      :key="contador.rotulo"
      class="contador"
      :class="{ [`contador--${contador.destaque}`]: contador.destaque && contador.valor > 0 }"
    >
      <span class="contador-valor">{{ formatarNumero(contador.valor) }}</span>
      <span class="contador-rotulo">{{ contador.rotulo }}</span>
    </div>
  </div>
</template>

<script setup>
import { formatarNumero } from '@/utils/importacaoPostos'

// Grade de totais da importação, usada na prévia e no relatório final.
// `destaque` ('alerta' | 'erro') só pinta o contador quando o valor é maior que 0.
defineProps({
  contadores: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.contadores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
}

.contador {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.contador-valor {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.contador-rotulo {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.contador--alerta {
  border-color: var(--color-warning);
}

.contador--alerta .contador-valor {
  color: var(--color-warning);
}

.contador--erro {
  border-color: rgb(var(--v-theme-error));
}

.contador--erro .contador-valor {
  color: rgb(var(--v-theme-error));
}
</style>
