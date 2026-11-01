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
          <PlateBadge :placa="ocorrencia.carPlate" />
          <span>{{ formatarDataOcorrencia(ocorrencia.occurrenceDate) }}</span>
        </p>
      </li>
    </ul>
  </DashboardSecao>
</template>

<script setup>
import DashboardSecao from '@/components/admin/DashboardSecao.vue'
import PlateBadge from '@/components/app/PlateBadge.vue'
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
  padding: var(--space-6) 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
  text-align: center;
}

.ultimas-lista {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ultimas-item {
  padding: var(--space-2) 0;
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
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: 500;
  color: var(--color-text);
}

.ultimas-detalhes {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-1) 0 0;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

/* Lado a lado com o gráfico (a partir de 1280px), a altura da linha é dele:
   com height 0 a lista não contribui para a altura do card, cresce até a que o
   grid der e rola dentro. Empilhada, fica na altura natural.

   A rolagem é discreta: barra fina em neutral-300 e, só quando há conteúdo
   escondido, uma sombra suave na borda correspondente. É o par de fundos
   "local" (cobre a sombra quando a lista chega ao fim) e "scroll" (a sombra
   fixa na borda), sem JavaScript. */
@media (min-width: 1280px) {
  .ultimas-lista {
    flex-grow: 1;
    height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-neutral-300) transparent;
    background:
      linear-gradient(var(--color-surface) 30%, transparent) top / 100% 32px no-repeat local,
      linear-gradient(transparent, var(--color-surface) 70%) bottom / 100% 32px no-repeat local,
      radial-gradient(farthest-side at 50% 0, var(--color-neutral-200), transparent) top / 100% 10px no-repeat scroll,
      radial-gradient(farthest-side at 50% 100%, var(--color-neutral-200), transparent) bottom / 100% 10px no-repeat
        scroll;
  }
}
</style>
