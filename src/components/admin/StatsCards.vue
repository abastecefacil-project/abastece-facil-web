<template>
  <div class="stats-grid">
    <div v-for="card in cards" :key="card.chave" class="stat-card">
      <div class="stat-content">
        <p class="stat-title">{{ card.rotulo }}</p>

        <template v-if="card.semDados && carregando">
          <v-skeleton-loader type="text" class="stat-skeleton stat-skeleton--valor" />
          <v-skeleton-loader type="text" class="stat-skeleton stat-skeleton--contexto" />
        </template>

        <template v-else>
          <p class="stat-value">{{ card.valor }}</p>

          <router-link v-if="card.to" :to="card.to" class="stat-context stat-context--aviso">
            <v-icon icon="mdi-alert-outline" size="14" />
            <span>{{ card.contexto }}</span>
          </router-link>
          <p v-else-if="card.contexto" class="stat-context">
            <v-icon v-if="card.iconeContexto" :icon="card.iconeContexto" size="14" />
            <span>{{ card.contexto }}</span>
          </p>
        </template>
      </div>

      <div class="stat-icon">
        <v-icon :icon="card.icone" size="22" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  contextoPostos,
  contextoUsuarios,
  contextoVeiculos,
  formatarValorKpi,
  variacaoMensal,
} from '@/utils/dashboard'

// Cada bloco é o objeto correspondente do GET /api/dashboard, ou null enquanto
// não há resposta: skeleton se está carregando, "—" se a consulta falhou.
const props = defineProps({
  postos: { type: Object, default: null },
  veiculos: { type: Object, default: null },
  ocorrencias: { type: Object, default: null },
  usuarios: { type: Object, default: null },
  carregando: { type: Boolean, default: false },
})

const ICONE_VARIACAO = {
  alta: 'mdi-arrow-up',
  queda: 'mdi-arrow-down',
  estavel: 'mdi-minus',
}

const cards = computed(() => {
  const { postos, veiculos, ocorrencias, usuarios } = props
  const variacao = ocorrencias && variacaoMensal(ocorrencias.mesAtual, ocorrencias.mesAnterior)

  return [
    {
      chave: 'postos',
      rotulo: 'Postos ativos',
      icone: 'mdi-gas-station',
      semDados: !postos,
      valor: formatarValorKpi(postos?.ativos),
      contexto: postos && contextoPostos(postos),
    },
    {
      chave: 'veiculos',
      rotulo: 'Frota ativa',
      icone: 'mdi-car',
      semDados: !veiculos,
      valor: formatarValorKpi(veiculos?.ativos),
      contexto: veiculos && contextoVeiculos(veiculos),
    },
    {
      chave: 'ocorrencias',
      rotulo: 'Ocorrências no mês',
      icone: 'mdi-alert-circle-outline',
      semDados: !ocorrencias,
      valor: formatarValorKpi(ocorrencias?.mesAtual),
      contexto: variacao?.texto,
      iconeContexto: variacao && ICONE_VARIACAO[variacao.direcao],
    },
    {
      chave: 'usuarios',
      rotulo: 'Usuários ativos',
      icone: 'mdi-account-group',
      semDados: !usuarios,
      valor: formatarValorKpi(usuarios?.ativos),
      contexto: usuarios && contextoUsuarios(usuarios),
      // Só o convite pendente pede ação: é o único contexto em warning, e leva
      // à tela onde o reenvio é feito.
      to: usuarios?.aguardandoAtivacao > 0 ? { name: 'UsersAdmin' } : null,
    },
  ]
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

/* Mesmo padrão do IndicadoresPostos: borda sutil, hover só por borda. */
.stat-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
}

.stat-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.stat-content {
  flex-grow: 1;
  min-width: 0;
}

.stat-content p {
  margin: 0;
}

.stat-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.01em;
}

.stat-value {
  margin-top: 2px !important;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.stat-context {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px !important;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.35;
}

.stat-context span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-context .v-icon {
  flex-shrink: 0;
}

/* warning vem do tema do Vuetify (CLAUDE.md §8). */
.stat-context--aviso {
  margin-top: 4px;
  color: rgb(var(--v-theme-warning));
  font-weight: 600;
  text-decoration: none;
}

.stat-context--aviso:hover span,
.stat-context--aviso:focus-visible span {
  text-decoration: underline;
}

/* Mesmas alturas das linhas de valor e de contexto, para a troca não deslocar o card. */
.stat-skeleton {
  background: transparent;
}

.stat-skeleton--valor {
  height: 30px;
  max-width: 96px;
  margin-top: 2px;
}

.stat-skeleton--contexto {
  height: 22px;
  max-width: 160px;
  margin-top: 4px;
}

.stat-skeleton--valor :deep(.v-skeleton-loader__text) {
  height: 22px;
  margin: 4px 0;
}

.stat-skeleton--contexto :deep(.v-skeleton-loader__text) {
  height: 12px;
  margin: 5px 0;
}

/* Ícone neutro: a cor fica por conta da hierarquia, não de 4 cores diferentes */
.stat-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1279px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
}
</style>
