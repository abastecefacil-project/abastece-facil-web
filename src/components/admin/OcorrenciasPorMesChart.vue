<template>
  <div class="grafico">
    <v-skeleton-loader v-if="!itens && carregando" type="image" class="grafico__skeleton" />

    <p v-else-if="!itens" class="grafico__mensagem">{{ SEM_VALOR }}</p>

    <p v-else-if="vazio" class="grafico__mensagem">Nenhuma ocorrência nos últimos 6 meses</p>

    <ul v-else class="grafico__barras">
      <li v-for="barra in barras" :key="barra.mes" class="grafico__coluna">
        <div class="grafico__trilho">
          <span
            class="grafico__valor"
            :class="{ 'grafico__valor--atual': barra.atual }"
            :style="{ bottom: `calc(${barra.altura}% + 4px)` }"
            aria-hidden="true"
          >
            {{ barra.valor }}
          </span>
          <div
            role="img"
            :aria-label="barra.rotulo"
            :class="[
              'grafico__barra',
              { 'grafico__barra--atual': barra.atual, 'grafico__barra--zero': barra.altura === 0 },
            ]"
            :style="barra.altura > 0 ? { height: `${barra.altura}%` } : null"
          />
        </div>
        <span class="grafico__mes" :class="{ 'grafico__mes--atual': barra.atual }" aria-hidden="true">
          {{ barra.mesCurto }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatarNumero } from '@/utils/importacaoPostos'
import {
  SEM_VALOR,
  alturasBarras,
  formatarMesCurto,
  rotuloBarraMes,
  totalOcorrenciasPeriodo,
} from '@/utils/dashboard'

// `ocorrenciasPorMes` do GET /api/dashboard: sempre 6 itens, em ordem
// cronológica, terminando no mês atual. null enquanto não há resposta.
const props = defineProps({
  itens: { type: Array, default: null },
  carregando: { type: Boolean, default: false },
})

const vazio = computed(() => totalOcorrenciasPeriodo(props.itens) === 0)

// O mês atual é o último item, por contrato. Não se compara com o relógio do
// navegador: o fuso da JVM e o do navegador podem divergir na virada do mês.
const barras = computed(() => {
  const itens = props.itens ?? []
  const alturas = alturasBarras(itens.map((item) => item.total))
  return itens.map((item, indice) => ({
    mes: item.mes,
    valor: formatarNumero(item.total),
    altura: alturas[indice],
    mesCurto: formatarMesCurto(item.mes),
    rotulo: rotuloBarraMes(item),
    atual: indice === itens.length - 1,
  }))
})
</script>

<style scoped>
/* Altura fixa: é ela que define a altura da linha do grid na Home, e a lista
   de últimas ocorrências ao lado se ajusta a ela. */
.grafico {
  height: 240px;
  display: flex;
  flex-direction: column;
}

.grafico__skeleton {
  flex: 1;
  background: transparent;
}

.grafico__skeleton :deep(.v-skeleton-loader__image) {
  height: 100%;
  border-radius: var(--radius-md);
}

.grafico__mensagem {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
}

.grafico__barras {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.grafico__coluna {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* O topo livre é o espaço do número da barra mais alta. */
.grafico__trilho {
  position: relative;
  flex: 1;
  width: 100%;
  margin-top: 22px;
  border-bottom: 1px solid var(--color-border);
}

.grafico__barra {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 48px;
  margin: 0 auto;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background-color: rgba(var(--v-theme-primary), 0.3);
}

.grafico__barra--atual {
  background-color: var(--color-primary);
}

/* Zero não some: vira uma linha de base. */
.grafico__barra--zero {
  height: 2px;
  border-radius: 0;
  background-color: var(--color-border-strong);
}

.grafico__valor {
  position: absolute;
  left: 0;
  right: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-text-muted);
  text-align: center;
}

.grafico__valor--atual {
  color: var(--color-primary);
}

.grafico__mes {
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.grafico__mes--atual {
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 599px) {
  .grafico__barras {
    gap: 4px;
  }

  .grafico__mes {
    font-size: 0.6875rem;
  }
}
</style>
