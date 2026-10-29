<template>
  <span :class="['status-chip', `status-chip--${variante.chave}`]">
    <span class="status-chip__ponto" aria-hidden="true" />
    {{ variante.rotulo }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

// Status de cadastro (REDESIGN §4.6, G6): um componente só para postos,
// veículos e usuários, que hoje têm três aparências para o mesmo conceito.
// Quem decide o status é a tela: para usuário, "aguardando" sai de `isActive` +
// `senhaDefinida` (utils/usuarioExibicao.js, statusUsuario).
const VARIANTES = {
  ativo: { chave: 'ativo', rotulo: 'Ativo' },
  inativo: { chave: 'inativo', rotulo: 'Inativo' },
  aguardando: { chave: 'aguardando', rotulo: 'Aguardando ativação' },
}

const props = defineProps({
  status: {
    type: String,
    required: true,
    // Literal, e não `valor in VARIANTES`: o defineProps é içado para fora do
    // setup e não enxerga constantes locais.
    validator: (valor) => ['ativo', 'inativo', 'aguardando'].includes(valor),
  },
})

const variante = computed(() => VARIANTES[props.status] ?? VARIANTES.inativo)
</script>

<style scoped>
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 500;
  white-space: nowrap;
}

.status-chip__ponto {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  flex-shrink: 0;
}

.status-chip--ativo {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.status-chip--ativo .status-chip__ponto {
  background-color: var(--color-success-icon);
}

.status-chip--inativo {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-600);
}

.status-chip--inativo .status-chip__ponto {
  background-color: var(--color-neutral-400);
}

.status-chip--aguardando {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.status-chip--aguardando .status-chip__ponto {
  background-color: var(--color-warning-icon);
}
</style>
