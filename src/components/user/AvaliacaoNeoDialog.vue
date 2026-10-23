<template>
  <v-dialog :model-value="true" max-width="480" :persistent="salvando" aria-labelledby="titulo-neo" @update:model-value="fechar">
    <v-card class="neo-dialog" rounded="lg">
      <div class="neo-header">
        <div class="neo-icon"><v-icon icon="mdi-credit-card-outline" size="25" /></div>
        <div class="neo-heading">
          <h2 id="titulo-neo">Cartão Neo</h2>
          <p>{{ nomeExibicaoPosto(posto) }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Fechar" :disabled="salvando" @click="fechar" />
      </div>
      <v-divider />
      <v-card-text class="neo-content">
        <v-progress-linear v-if="carregando" indeterminate color="primary" aria-label="Carregando respostas" />
        <v-alert v-if="erro" type="error" variant="tonal" class="mb-3">{{ erro }}</v-alert>
        <v-btn v-if="falhaCarga" variant="text" @click="carregar">Tentar novamente</v-btn>
        <template v-if="!carregando && !falhaCarga">
          <section aria-label="Relatos sobre o cartão Neo" aria-live="polite">
            <h3 class="neo-section-title">O que os usuários relataram</h3>
            <div class="neo-totals">
              <div class="neo-total neo-total--sim">
                <v-icon icon="mdi-thumb-up-outline" size="20" />
                <strong>{{ resumo.passaram }}</strong>
                <span>Passou</span>
              </div>
              <div class="neo-total neo-total--nao">
                <v-icon icon="mdi-thumb-down-outline" size="20" />
                <strong>{{ resumo.naoPassaram }}</strong>
                <span>Não passou</span>
              </div>
            </div>
            <p v-if="resumo.passaram === 0 && resumo.naoPassaram === 0" class="neo-caption">Ainda não há relatos neste posto.</p>
            <p v-if="resumo.ultimoRelatoEm" class="neo-caption">
              Último relato em {{ new Date(resumo.ultimoRelatoEm).toLocaleDateString('pt-BR') }}
            </p>
          </section>
          <section class="neo-vote" aria-labelledby="pergunta-neo">
            <h3 id="pergunta-neo" class="neo-section-title">E com você, o Neo passou?</h3>
            <div class="neo-choices" role="group" aria-labelledby="pergunta-neo">
              <v-btn
                :prepend-icon="resposta === true ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                color="success"
                :variant="resposta === true ? 'tonal' : 'outlined'"
                :class="['neo-choice', { 'neo-choice--selected': resposta === true }]"
                :aria-pressed="resposta === true"
                :disabled="salvando"
                @click="resposta = true; sucesso = false"
              >Passou</v-btn>
              <v-btn
                :prepend-icon="resposta === false ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'"
                color="error"
                :variant="resposta === false ? 'tonal' : 'outlined'"
                :class="['neo-choice', { 'neo-choice--selected': resposta === false }]"
                :aria-pressed="resposta === false"
                :disabled="salvando"
                @click="resposta = false; sucesso = false"
              >Não passou</v-btn>
            </div>
            <v-btn
              v-if="resumo.minhaResposta !== null"
              variant="text"
              size="small"
              class="neo-remove"
              :disabled="salvando"
              @click="remover"
            >Remover minha resposta</v-btn>
          </section>
          <v-alert v-if="sucesso" type="success" variant="tonal" class="mt-3" role="status">
            {{ resumo.minhaResposta === null ? 'Resposta removida.' : 'Resposta salva!' }}
          </v-alert>
          <p class="neo-caption">Os relatos não garantem aceitação futura.</p>
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions class="dialog-actions">
        <v-btn class="btn-dialog btn-dialog--cancelar" variant="outlined" :disabled="salvando" @click="fechar">Fechar</v-btn>
        <v-btn
          class="btn-dialog btn-dialog--confirmar"
          variant="flat"
          :disabled="carregando || falhaCarga || resposta === null || sucesso"
          :loading="salvando"
          @click="salvar"
        >Salvar resposta</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getAvaliacaoNeo, salvarAvaliacaoNeo, removerAvaliacaoNeo } from '@/services/stationService'
import { nomeExibicaoPosto } from '@/utils/posto'

const props = defineProps({ posto: { type: Object, required: true } })
const emit = defineEmits(['fechar'])
const resposta = ref(null)
const resumo = ref({ minhaResposta: null, passaram: 0, naoPassaram: 0 })
const carregando = ref(true)
const salvando = ref(false)
const falhaCarga = ref(false)
const erro = ref('')
const sucesso = ref(false)

function fechar() {
  if (!salvando.value) emit('fechar')
}

async function carregar() {
  carregando.value = true
  falhaCarga.value = false
  erro.value = ''
  try {
    const { data } = await getAvaliacaoNeo(props.posto.id)
    resposta.value = data.minhaResposta
    resumo.value = data
  } catch {
    falhaCarga.value = true
    erro.value = 'Não foi possível carregar as respostas. Tente novamente.'
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  salvando.value = true
  erro.value = ''
  sucesso.value = false
  try {
    const { data } = await salvarAvaliacaoNeo(props.posto.id, resposta.value)
    resumo.value = data
    sucesso.value = true
  } catch {
    erro.value = 'Não foi possível salvar sua resposta. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)

async function remover() {
  salvando.value = true
  erro.value = ''
  sucesso.value = false
  try {
    const { data } = await removerAvaliacaoNeo(props.posto.id)
    resumo.value = data
    resposta.value = null
    sucesso.value = true
  } catch {
    erro.value = 'Não foi possível remover sua resposta. Tente novamente.'
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.neo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
}

.neo-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.neo-heading { flex: 1; min-width: 0; }
.neo-heading h2 { font-size: 1.125rem; font-weight: 700; color: var(--color-text); }
.neo-heading p { margin-top: 3px; font-size: 0.8125rem; color: var(--color-text-muted); overflow-wrap: anywhere; }
.neo-dialog .neo-content { padding: 24px; overflow-y: auto; }
.neo-section-title { margin-bottom: 12px; font-size: 0.875rem; font-weight: 600; color: var(--color-text); }

.neo-totals, .neo-choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.neo-total {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 2px 10px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.neo-total strong { font-size: 1.75rem; line-height: 1.2; font-variant-numeric: tabular-nums; }
.neo-total span { grid-column: 2; font-size: 0.8125rem; color: var(--color-text-muted); }
.neo-total--sim { color: rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.05); }
.neo-total--nao { color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), 0.04); }
.neo-caption { margin-top: 12px; font-size: 0.75rem; line-height: 1.5; color: var(--color-text-muted); }
.neo-vote { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-border); }
.neo-choice.v-btn { height: 52px; min-width: 0; padding: 0 10px; text-transform: none; letter-spacing: 0; }
.neo-choice--selected { outline: 2px solid currentColor; outline-offset: -2px; }
.neo-choice:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.neo-remove.v-btn { margin-top: 10px; color: var(--color-text-muted); text-transform: none; letter-spacing: 0; }

@media (max-width: 400px) {
  .neo-header { padding: 16px; gap: 8px; }
  .neo-dialog .neo-content { padding: 20px 16px; }
  .neo-total { padding: 12px; }
  .neo-totals, .neo-choices { gap: 8px; }
  .neo-choice.v-btn { font-size: 0.8125rem; }
  .neo-dialog .btn-dialog { padding: 0 8px; font-size: 0.8125rem; }
}
</style>
