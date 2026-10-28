<template>
  <header class="page-header">
    <div class="page-header__textos">
      <h1 class="page-header__titulo">{{ titulo }}</h1>
      <p v-if="subtitulo" class="page-header__subtitulo">{{ subtitulo }}</p>
    </div>
    <div v-if="$slots.acoes" class="page-header__acoes">
      <slot name="acoes" />
    </div>
  </header>
</template>

<script setup>
// Cabeçalho de página (REDESIGN §4.6): o único h1 da tela. A barra superior do
// shell mostra só o breadcrumb, então o título da página mora aqui e em nenhum
// outro lugar. Ações (botão primário, secundário) entram pelo slot `acoes`,
// alinhadas à direita na mesma linha; abaixo de 960px empilham sob o título.
defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.page-header__textos {
  min-width: 0;
}

.page-header__titulo {
  margin: 0;
  color: var(--color-neutral-900);
  font-size: var(--text-page-title-size);
  line-height: var(--text-page-title-line);
  font-weight: var(--text-page-title-weight);
  letter-spacing: -0.01em;
}

.page-header__subtitulo {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
}

.page-header__acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

@media (max-width: 959px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
