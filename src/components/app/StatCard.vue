<template>
  <div class="stat-card">
    <div class="stat-card__conteudo">
      <p class="stat-card__rotulo">{{ rotulo }}</p>

      <template v-if="carregando">
        <v-skeleton-loader type="text" class="stat-card__skeleton stat-card__skeleton--valor" />
        <v-skeleton-loader type="text" class="stat-card__skeleton stat-card__skeleton--contexto" />
      </template>

      <template v-else>
        <p class="stat-card__valor">{{ valor }}</p>

        <router-link v-if="to && contexto" :to="to" class="stat-card__contexto stat-card__contexto--aviso">
          <v-icon icon="mdi-alert-outline" size="14" />
          <span>{{ contexto }}</span>
        </router-link>
        <p v-else-if="contexto" class="stat-card__contexto">
          <v-icon v-if="iconeContexto" :icon="iconeContexto" size="14" />
          <span>{{ contexto }}</span>
        </p>
      </template>
    </div>

    <div v-if="icone" class="stat-card__icone">
      <v-icon :icon="icone" size="20" />
    </div>
  </div>
</template>

<script setup>
// Indicador (REDESIGN §4.6): rótulo, número em kpi e uma linha de contexto,
// com tile de ícone neutro opcional. Extraído do StatsCards do Painel.
//
// Exceção registrada à regra de "só componente usado em duas ou mais telas":
// pelo REDESIGN o StatCard só aparece no Painel (a §5.4 tira os KPIs de
// Postos), mas a §4.6 o define como componente e ele substitui código que já
// existia no StatsCards.
defineProps({
  rotulo: { type: String, required: true },
  // Já formatado por quem chama ("968", "—"): o card não sabe o que é o número.
  valor: { type: String, default: '' },
  contexto: { type: String, default: '' },
  iconeContexto: { type: String, default: '' },
  icone: { type: String, default: '' },
  // Destino do contexto quando ele pede ação: vira link em warning, o único
  // tom de destaque do card.
  to: { type: [String, Object], default: null },
  // Skeleton no lugar de valor e contexto. Quem chama decide quando: no Painel,
  // só enquanto não há nenhuma resposta, para nunca mostrar 0 por falta de dado.
  carregando: { type: Boolean, default: false },
})
</script>

<style scoped>
/* Card do design system: borda, raio de 12px, sem sombra. Não é clicável, então
   não tem hover. */
.stat-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.stat-card__conteudo {
  flex-grow: 1;
  min-width: 0;
}

.stat-card__conteudo p {
  margin: 0;
}

.stat-card__rotulo {
  color: var(--color-text-muted);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: var(--text-caption-weight);
}

.stat-card__valor {
  margin-top: var(--space-1) !important;
  color: var(--color-neutral-900);
  font-size: var(--text-kpi-size);
  line-height: var(--text-kpi-line);
  font-weight: var(--text-kpi-weight);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.stat-card__contexto {
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  margin-top: var(--space-1) !important;
  color: var(--color-text-muted);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
}

/* O contexto quebra linha em vez de ser truncado: em 1366px, com quatro cards
   lado a lado, "Nenhum aguardando ativação" não cabe numa linha. Os cards da
   mesma linha do grid ficam com a mesma altura. */
.stat-card__contexto span {
  min-width: 0;
}

/* Centraliza o ícone de 14px na primeira linha de 20px do body-sm. */
.stat-card__contexto .v-icon {
  flex-shrink: 0;
  margin-top: 3px;
}

.stat-card__contexto--aviso {
  color: var(--color-warning);
  font-weight: 600;
  text-decoration: none;
}

.stat-card__contexto--aviso:hover span,
.stat-card__contexto--aviso:focus-visible span {
  text-decoration: underline;
}

/* Mesmas alturas das linhas de valor e de contexto, para a troca não deslocar
   o card. */
.stat-card__skeleton {
  background: transparent;
}

.stat-card__skeleton--valor {
  height: 36px;
  max-width: 96px;
  margin-top: var(--space-1);
}

.stat-card__skeleton--contexto {
  height: 20px;
  max-width: 160px;
  margin-top: var(--space-1);
}

.stat-card__skeleton--valor :deep(.v-skeleton-loader__text) {
  height: 24px;
  margin: 6px 0;
}

.stat-card__skeleton--contexto :deep(.v-skeleton-loader__text) {
  height: 12px;
  margin: 4px 0;
}

/* Tile de ícone de entidade: blue-50 e blue-700, nunca colorido por tipo. */
.stat-card__icone {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-blue-50);
  color: var(--color-blue-700);
}
</style>
