<template>
  <!-- Uma coluna por contador: com auto-fit, os 7 do relatório final não
       cabiam numa linha e "Avisos" caía sozinho na segunda. -->
  <div class="contadores" :style="{ '--contadores-colunas': contadores.length }">
    <div
      v-for="contador in contadores"
      :key="contador.rotulo"
      class="contador"
      :class="{ [`contador--${contador.destaque}`]: contador.destaque && contador.valor > 0 }"
    >
      <span class="contador-valor">{{ formatarNumero(contador.valor) }}</span>
      <span class="contador-rotulo">{{ contador.rotulo }}</span>
    </div>
  </div>
</template>

<script setup>
import { formatarNumero } from '@/utils/importacaoPostos'

// Grade de totais da importação, usada na prévia e no relatório final.
// `destaque` ('alerta' | 'erro') só pinta o contador quando o valor é maior que 0.
defineProps({
  contadores: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.contadores {
  display: grid;
  grid-template-columns: repeat(var(--contadores-colunas), minmax(0, 1fr));
  gap: var(--space-2);
}

.contador {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.contador-valor {
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: 600;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

/* Uma linha só. O tracking de 0,5px herdado do v-card-text fazia "Sem
   alteração" passar dos ~83px de uma coluna em 1440px e quebrar. Com tracking
   zero cabe (77px); a reticência é só rede de segurança. */
.contador-rotulo {
  overflow: hidden;
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  letter-spacing: 0;
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contador--alerta {
  border-color: var(--color-warning-icon);
}

.contador--alerta .contador-valor {
  color: var(--color-warning);
}

.contador--erro {
  border-color: var(--color-error-icon);
}

.contador--erro .contador-valor {
  color: var(--color-error);
}

/* Abaixo de 900px o diálogo (máx. 860px) fica estreito demais para 7 colunas
   sem cortar rótulo, e a grade vira lista: rótulo à esquerda, número à
   direita, um contador por linha. Nenhum fica órfão. */
@media (max-width: 899px) {
  .contadores {
    grid-template-columns: 1fr;
    gap: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .contador {
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: baseline;
    padding: var(--space-2) var(--space-3);
    border: none;
    border-radius: 0;
    border-left: 3px solid transparent;
  }

  .contador + .contador {
    border-top: 1px solid var(--color-border);
  }

  .contador-valor {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
  }

  .contador-rotulo {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    color: var(--color-text);
  }

  .contador--alerta {
    border-left-color: var(--color-warning-icon);
  }

  .contador--erro {
    border-left-color: var(--color-error-icon);
  }
}
</style>
