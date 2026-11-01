<template>
  <div class="stats-grid">
    <StatCard
      v-for="card in cards"
      :key="card.chave"
      :rotulo="card.rotulo"
      :valor="card.valor"
      :contexto="card.contexto || ''"
      :icone-contexto="card.iconeContexto || ''"
      :icone="card.icone"
      :to="card.to"
      :carregando="card.semDados && carregando"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatCard from '@/components/app/StatCard.vue'
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
/* A grade é do Painel; o card em si é o StatCard do design system. */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

@media (max-width: 1279px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-3);
  }
}
</style>
