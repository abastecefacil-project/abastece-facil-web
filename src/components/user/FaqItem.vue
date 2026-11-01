<template>
  <!-- Cada pergunta tem o próprio v-expansion-panels, e por isso várias podem
       ficar abertas ao mesmo tempo. -->
  <v-expansion-panels flat>
    <v-expansion-panel elevation="0" class="faq-painel">
      <v-expansion-panel-title class="faq-painel__titulo">
        <span class="faq-painel__pergunta">
          <v-icon icon="mdi-help-circle-outline" size="20" class="faq-painel__icone" />
          <span>{{ question }}</span>
        </span>
      </v-expansion-panel-title>

      <v-expansion-panel-text class="faq-painel__texto">
        <p class="faq-painel__resposta">{{ answer }}</p>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
defineProps({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
/* Painel plano com borda (REDESIGN §5.11): sem elevation e sem o divisor que
   o Vuetify desenha no ::after entre painéis. A classe dobrada vence o raio
   e o fundo do componente. */
.v-expansion-panel.faq-painel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition);
}

.v-expansion-panel.faq-painel::after {
  display: none;
}

.v-expansion-panel.faq-painel:hover,
.v-expansion-panel.faq-painel.v-expansion-panel--active {
  border-color: var(--color-blue-200);
}

.faq-painel__titulo {
  min-height: 56px;
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
}

/* O overlay de hover do Vuetify escurece com a cor do texto; a borda já marca
   o hover. */
.faq-painel__titulo :deep(.v-expansion-panel-title__overlay) {
  display: none;
}

/* Sem o overlay, o foco também ficaria sem sinal, e o título é um <button>
   comum, fora da regra global de foco de main.css. */
.v-expansion-panel-title.faq-painel__titulo:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 2px;
}

.faq-painel__pergunta {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: 500;
  color: var(--color-text);
}

.faq-painel__icone {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-blue-700);
}

.faq-painel__titulo :deep(.v-expansion-panel-title__icon) {
  color: var(--color-neutral-500);
}

.faq-painel__texto :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 var(--space-5) var(--space-5) calc(var(--space-5) + 20px + var(--space-3));
}

.faq-painel__resposta {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

@media (max-width: 599px) {
  .faq-painel__titulo {
    padding: var(--space-3) var(--space-4);
  }

  .faq-painel__texto :deep(.v-expansion-panel-text__wrapper) {
    padding: 0 var(--space-4) var(--space-4);
  }
}
</style>
