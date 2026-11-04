<template>
  <v-input
    :model-value="model"
    :rules="rules"
    :hint="hint"
    :disabled="indisponivel"
    persistent-hint
    hide-details="auto"
  >
    <template #default="{ id, messagesId, isValid }">
      <div class="seletor" @focusout="aoSair">
        <label :for="id.value">{{ label }}</label>
        <div class="seletor-campo" :class="{ 'seletor-campo--erro': isValid.value === false }">
          <input
            :id="id.value"
            ref="campo"
            :value="aberto ? busca : tituloSelecionado"
            :placeholder="loading ? 'Carregando opções...' : placeholder"
            :disabled="indisponivel"
            :required="required"
            :aria-describedby="messagesId.value"
            :aria-invalid="isValid.value === false ? 'true' : undefined"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="aberto"
            :aria-controls="`${id.value}-opcoes`"
            :aria-activedescendant="aberto && indiceAtivo >= 0 ? `${id.value}-opcao-${indiceAtivo}` : undefined"
            autocomplete="off"
            @focus="abrir"
            @click="abrir"
            @input="aoDigitar"
            @keydown.down.prevent="mover(1)"
            @keydown.up.prevent="mover(-1)"
            @keydown.enter.prevent="confirmar"
            @keydown.esc.prevent.stop="fechar"
          />
          <button
            type="button"
            tabindex="-1"
            :disabled="indisponivel"
            :aria-label="aberto ? 'Fechar opções' : 'Abrir opções'"
            @mousedown.prevent
            @click="alternar"
          >
            <span aria-hidden="true">{{ aberto ? '▴' : '▾' }}</span>
          </button>
        </div>
        <ul v-if="aberto" :id="`${id.value}-opcoes`" ref="lista" role="listbox" :aria-label="label" class="seletor-opcoes">
          <li
            v-for="(item, indice) in filtrados"
            :id="`${id.value}-opcao-${indice}`"
            :key="item[itemValue]"
            role="option"
            :aria-selected="item[itemValue] === model"
            :class="{ 'opcao-ativa': indice === indiceAtivo }"
            @mousedown.prevent
            @click="selecionar(item)"
          >
            {{ item[itemTitle] }}
          </li>
          <li v-if="!filtrados.length" role="presentation" class="seletor-vazio">{{ noDataText }}</li>
        </ul>
      </div>
    </template>
  </v-input>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const model = defineModel({ default: null })
const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, default: () => [] },
  itemTitle: { type: String, default: 'title' },
  itemValue: { type: String, default: 'value' },
  placeholder: { type: String, default: 'Selecione ou digite para buscar' },
  noDataText: { type: String, default: 'Nenhuma opção encontrada' },
  rules: { type: Array, default: () => [] },
  hint: { type: String, default: '' },
  disabled: Boolean,
  readonly: Boolean,
  loading: Boolean,
  required: Boolean,
})

const indisponivel = computed(() => props.disabled || props.readonly || props.loading)
const aberto = ref(false)
const busca = ref('')
const indiceAtivo = ref(-1)
const campo = ref(null)
const lista = ref(null)
const tituloSelecionado = computed(() => props.items.find(item => item[props.itemValue] === model.value)?.[props.itemTitle] ?? '')
const normalizar = valor => String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
const filtrados = computed(() => props.items.filter(item => normalizar(item[props.itemTitle]).includes(normalizar(busca.value))))

function abrir() {
  if (indisponivel.value || aberto.value) return
  busca.value = ''
  aberto.value = true
  indiceAtivo.value = -1
}

function fechar() {
  aberto.value = false
  busca.value = ''
  indiceAtivo.value = -1
}

function alternar() {
  if (indisponivel.value) return
  if (aberto.value) fechar()
  else {
    campo.value?.focus()
    abrir()
  }
}

function aoDigitar(evento) {
  if (indisponivel.value) return
  busca.value = evento.target.value
  model.value = null
  aberto.value = true
  indiceAtivo.value = filtrados.value.length ? 0 : -1
}

function selecionar(item) {
  if (indisponivel.value) return
  model.value = item[props.itemValue]
  fechar()
}

function mover(direcao) {
  abrir()
  if (indisponivel.value || !filtrados.value.length) return
  indiceAtivo.value = indiceAtivo.value < 0
    ? (direcao > 0 ? 0 : filtrados.value.length - 1)
    : Math.max(0, Math.min(filtrados.value.length - 1, indiceAtivo.value + direcao))
  nextTick(() => lista.value?.children[indiceAtivo.value]?.scrollIntoView({ block: 'nearest' }))
}

function confirmar() {
  const item = filtrados.value[indiceAtivo.value]
  if (aberto.value && item) selecionar(item)
}

function aoSair(evento) {
  if (!evento.currentTarget.contains(evento.relatedTarget)) fechar()
}

watch(indisponivel, bloqueado => { if (bloqueado) fechar() })
watch(filtrados, itens => { if (indiceAtivo.value >= itens.length) indiceAtivo.value = -1 })
</script>

<style scoped>
.seletor { width: 100%; }
.seletor label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-neutral-600);
  font-size: var(--text-body-sm-size);
}
.seletor-campo {
  display: flex;
  min-height: 48px;
  border: 1px solid var(--color-neutral-500);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}
.seletor-campo:focus-within { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.seletor-campo--erro { border-color: var(--color-error); }
.seletor-campo input {
  width: 100%;
  min-width: 0;
  padding: var(--space-3);
  outline: none;
  font: inherit;
}
.seletor-campo button { padding: 0 var(--space-3); }
.seletor-campo input:disabled, .seletor-campo button:disabled { opacity: 0.6; }
.seletor-opcoes {
  max-height: 192px;
  overflow-y: auto;
  margin-top: var(--space-1);
  padding: var(--space-1) 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  list-style: none;
}
.seletor-opcoes li { padding: var(--space-3); overflow-wrap: anywhere; }
.seletor-opcoes [role='option'] { cursor: pointer; }
.seletor-opcoes [role='option']:hover, .seletor-opcoes .opcao-ativa { background: var(--color-blue-50); }
.seletor-opcoes [aria-selected='true'] { font-weight: 600; }
.seletor-vazio { color: var(--color-text-muted); }
</style>
