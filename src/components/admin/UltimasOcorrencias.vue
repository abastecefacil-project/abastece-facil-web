<template>
  <DashboardSecao titulo="Últimas ocorrências">
    <template #acoes>
      <router-link :to="{ name: 'OccurrencesAdmin' }" class="dashboard-secao__link">Ver todas</router-link>
    </template>

    <div v-if="!ocorrencias && carregando" class="ultimas-carregando">
      <v-skeleton-loader v-for="n in 3" :key="n" type="list-item-two-line" class="ultimas-skeleton" />
    </div>

    <p v-else-if="!ocorrencias" class="ultimas-mensagem">{{ SEM_VALOR }}</p>

    <p v-else-if="!ocorrencias.length" class="ultimas-mensagem">Nenhuma ocorrência registrada</p>

    <ul v-else class="ultimas-lista">
      <li v-for="ocorrencia in ocorrencias" :key="ocorrencia.id" class="ultimas-item">
        <p class="ultimas-titulo" :title="ocorrencia.title">{{ ocorrencia.title }}</p>
        <p class="ultimas-detalhes">
          <span class="ultimas-placa">{{ ocorrencia.carPlate }}</span>
          <span>{{ formatarDataOcorrencia(ocorrencia.occurrenceDate) }}</span>
        </p>
      </li>
    </ul>
  </DashboardSecao>
</template>

<script setup>
import DashboardSecao from '@/components/admin/DashboardSecao.vue'
import { SEM_VALOR, formatarDataOcorrencia } from '@/utils/dashboard'

// `ultimasOcorrencias` do GET /api/dashboard, ou null enquanto não há resposta:
// skeleton se está carregando, "—" se a consulta falhou.
defineProps({
  ocorrencias: { type: Array, default: null },
  carregando: { type: Boolean, default: false },
})
</script>

<style scoped>
.ultimas-skeleton {
  background: transparent;
}

.ultimas-mensagem {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 24px 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
}

.ultimas-lista {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ultimas-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.ultimas-item:first-child {
  padding-top: 0;
}

.ultimas-item:last-child {
  border-bottom: none;
}

.ultimas-titulo {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.ultimas-detalhes {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.ultimas-placa {
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
  letter-spacing: 0.04em;
}

/* Lado a lado com o gráfico, a altura da linha é dele: com height 0 a lista não
   contribui para a altura do card, cresce até a que o grid der e rola dentro.
   Empilhada (abaixo de 960px), fica na altura natural. */
@media (min-width: 960px) {
  .ultimas-lista {
    flex-grow: 1;
    height: 0;
    overflow-y: auto;
  }
}
</style>
