<template>
  <div class="empty-state" role="status">
    <v-icon :icon="icone" size="40" class="empty-state__icone" />
    <p class="empty-state__titulo">{{ titulo }}</p>
    <p v-if="texto" class="empty-state__texto">{{ texto }}</p>
    <div v-if="$slots.acao" class="empty-state__acao">
      <slot name="acao" />
    </div>
  </div>
</template>

<script setup>
// Estado vazio de lista (REDESIGN §4.6). Substitui o `.empty-state` copiado em
// seis views, com cores divergentes (cinza do Material inline em duas).
defineProps({
  icone: { type: String, required: true },
  titulo: { type: String, required: true },
  texto: { type: String, default: '' },
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.empty-state__icone {
  color: var(--color-neutral-400);
  margin-bottom: var(--space-3);
}

.empty-state p {
  margin: 0;
}

.empty-state__titulo {
  color: var(--color-text);
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
}

.empty-state__texto {
  max-width: 420px;
  margin-top: var(--space-1) !important;
  color: var(--color-text-muted);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
}

.empty-state__acao {
  margin-top: var(--space-4);
}
</style>
