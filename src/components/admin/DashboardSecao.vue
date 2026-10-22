<template>
  <section class="dashboard-secao">
    <h2 class="dashboard-secao__titulo">{{ titulo }}</h2>
    <div class="dashboard-secao__corpo">
      <slot />
    </div>
  </section>
</template>

<script setup>
// Moldura das áreas da Home de gestão. Sem conteúdo no slot, a área fica
// reservada no grid até o gráfico ou o ranking correspondente entrar.
defineProps({
  titulo: { type: String, required: true },
})
</script>

<style scoped>
.dashboard-secao {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.dashboard-secao__titulo {
  margin: 0 0 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-secao__corpo {
  flex: 1;
  min-width: 0;
}
</style>
