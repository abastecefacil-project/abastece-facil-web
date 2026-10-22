<template>
  <section class="dashboard-secao">
    <header class="dashboard-secao__cabecalho">
      <div class="dashboard-secao__titulos">
        <h2 class="dashboard-secao__titulo">{{ titulo }}</h2>
        <p v-if="subtitulo" class="dashboard-secao__subtitulo">{{ subtitulo }}</p>
      </div>
      <div v-if="$slots.acoes" class="dashboard-secao__acoes">
        <slot name="acoes" />
      </div>
    </header>
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
  subtitulo: { type: String, default: '' },
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

.dashboard-secao__cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.dashboard-secao__titulos {
  min-width: 0;
}

.dashboard-secao__titulo {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-secao__subtitulo {
  margin: 2px 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.dashboard-secao__acoes {
  flex-shrink: 0;
}

/* Coluna flexível com min-height 0: é o que deixa uma lista dentro do corpo
   crescer até a altura do card e rolar, em vez de esticar o card. */
.dashboard-secao__corpo {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
</style>
