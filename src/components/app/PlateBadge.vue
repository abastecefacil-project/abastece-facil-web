<template>
  <span class="plate-badge">{{ placa }}</span>
</template>

<script setup>
// Placa de veículo (REDESIGN §4.6): Plex Mono, em toda aparição de placa. Exibe
// o valor como veio; a placa é chave de busca da ocorrência e não é reescrita.
defineProps({
  placa: { type: String, required: true },
})
</script>

<style scoped>
.plate-badge {
  display: inline-block;
  padding: 2px var(--space-2);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-sm);
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-800);
  font-family: var(--font-mono);
  font-size: var(--text-mono-size);
  line-height: var(--text-mono-line);
  font-weight: var(--text-mono-weight);
  letter-spacing: var(--text-mono-tracking);
  white-space: nowrap;
}
</style>
