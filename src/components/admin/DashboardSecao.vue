<template>
  <section class="dashboard-secao">
    <header :class="['dashboard-secao__cabecalho', { 'dashboard-secao__cabecalho--com-subtitulo': subtitulo }]">
      <h2 class="dashboard-secao__titulo">{{ titulo }}</h2>
      <p v-if="subtitulo" class="dashboard-secao__subtitulo">{{ subtitulo }}</p>
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
/* Card do design system (REDESIGN §4.6): borda, raio de 12px, sem sombra. */
.dashboard-secao {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* Ações (o link "Ver todos") à direita da última linha do cabeçalho. Com
   subtítulo, o título ocupa a largura inteira e o link desce para a linha do
   subtítulo: em 1366px, "Veículos com mais ocorrências" e o link não cabem
   juntos num terço da grade. */
.dashboard-secao__cabecalho {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.dashboard-secao__cabecalho--com-subtitulo .dashboard-secao__titulo {
  grid-column: 1 / -1;
}

.dashboard-secao__titulo {
  margin: 0;
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
}

.dashboard-secao__subtitulo {
  margin: 0;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

/* flex: sem a linha de texto do próprio div, o link alinha ao centro da linha
   do título ou do subtítulo, sem deslocamento. */
.dashboard-secao__acoes {
  display: flex;
  grid-column: 2;
  grid-row: 1;
}

.dashboard-secao__cabecalho--com-subtitulo .dashboard-secao__acoes {
  grid-row: 2;
}

/* Link terciário do cabeçalho ("Ver todas", "Ver todos"), com os valores do
   link terciário do R5 (.acesso-link). Conteúdo de slot carrega o data-v de
   quem o passa, então só :slotted() alcança a classe daqui. O foco visível vem
   da regra global de main.css. */
.dashboard-secao__acoes :slotted(.dashboard-secao__link) {
  display: inline-block;
  border-radius: var(--radius-sm);
  font-size: var(--text-body-size);
  line-height: var(--text-body-sm-line);
  font-weight: 500;
  color: var(--color-blue-600);
  text-decoration: none;
  transition: color var(--transition);
}

.dashboard-secao__acoes :slotted(.dashboard-secao__link:hover) {
  color: var(--color-blue-800);
  text-decoration: underline;
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
