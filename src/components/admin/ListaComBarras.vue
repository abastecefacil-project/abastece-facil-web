<template>
  <div v-if="!itens && carregando" class="lista-carregando">
    <v-skeleton-loader v-for="n in 3" :key="n" type="text" class="lista-skeleton" />
  </div>

  <p v-else-if="!itens" class="lista-mensagem">{{ SEM_VALOR }}</p>

  <p v-else-if="!itens.length" class="lista-mensagem">{{ mensagemVazio }}</p>

  <ul v-else class="lista">
    <li v-for="(linha, indice) in linhas" :key="indice" class="lista-item">
      <div class="lista-linha">
        <span class="lista-rotulo" :title="linha.rotulo">{{ linha.rotulo }}</span>
        <span v-if="linha.detalhe" class="lista-detalhe">{{ linha.detalhe }}</span>
        <span class="lista-total">{{ linha.totalTexto }}</span>
      </div>
      <div class="lista-trilho" aria-hidden="true">
        <div
          :class="['lista-barra', { 'lista-barra--zero': linha.proporcao === 0 }]"
          :style="linha.proporcao > 0 ? { width: `${linha.proporcao}%` } : null"
        />
      </div>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { formatarNumero } from '@/utils/importacaoPostos'
import { SEM_VALOR, proporcoesRelativas } from '@/utils/dashboard'

// Ranking com barras horizontais. Sem link por linha, de propósito: as telas de
// destino não aceitam filtro, e clicar num item levaria a uma lista genérica.
// O link geral vai no cabeçalho do DashboardSecao.
// itens null = ainda sem resposta: skeleton se está carregando, "—" se falhou.
const props = defineProps({
  itens: { type: Array, default: null },
  carregando: { type: Boolean, default: false },
  mensagemVazio: { type: String, required: true },
})

const linhas = computed(() => {
  const itens = props.itens ?? []
  const proporcoes = proporcoesRelativas(itens.map((item) => item.total))
  return itens.map((item, indice) => ({
    ...item,
    totalTexto: formatarNumero(item.total),
    proporcao: proporcoes[indice],
  }))
})
</script>

<style scoped>
.lista-skeleton {
  background: transparent;
}

.lista-mensagem {
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

.lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lista-linha {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  font-size: 0.875rem;
}

.lista-rotulo {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: var(--color-text);
}

.lista-detalhe {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.lista-total {
  flex-shrink: 0;
  margin-left: auto;
  font-weight: 600;
  color: var(--color-text);
}

.lista-trilho {
  position: relative;
  height: 6px;
  margin-top: 6px;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  overflow: hidden;
}

.lista-barra {
  height: 100%;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
}

/* Zero não some: vira uma linha de base no início do trilho. */
.lista-barra--zero {
  width: 2px;
  background-color: var(--color-border-strong);
}
</style>
