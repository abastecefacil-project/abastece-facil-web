<template>
  <v-dialog :model-value="true" max-width="480" :persistent="salvando" aria-labelledby="titulo-neo" @update:model-value="fechar">
    <v-card class="neo-dialog">
      <!-- Cabeçalho (REDESIGN §4.6): tile do Neo, título, posto e fechar. -->
      <v-card-title class="neo-header">
        <span class="neo-icon"><v-icon icon="mdi-credit-card-outline" size="20" /></span>
        <div class="neo-heading">
          <h2 id="titulo-neo">Cartão Neo</h2>
          <p>{{ nomeProprio(nomeExibicaoPosto(posto)) }}</p>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          density="comfortable"
          aria-label="Fechar"
          class="neo-fechar"
          :disabled="salvando"
          @click="fechar"
        >
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </v-card-title>
      <v-card-text class="neo-content">
        <v-progress-linear v-if="carregando" indeterminate color="primary" aria-label="Carregando respostas" />
        <v-alert v-if="erro" type="error" variant="tonal" density="compact" class="mb-3">{{ erro }}</v-alert>
        <v-btn v-if="falhaCarga" variant="outlined" class="neo-secundario" @click="carregar">Tentar novamente</v-btn>
        <template v-if="!carregando && !falhaCarga">
          <section aria-label="Relatos sobre o cartão Neo" aria-live="polite">
            <h3 class="neo-section-title">O que os usuários relataram</h3>
            <div class="neo-totals">
              <div class="neo-total">
                <v-icon icon="mdi-thumb-up-outline" size="20" class="neo-total-icone neo-total-icone--sim" />
                <strong>{{ resumo.passaram }}</strong>
                <span>Passou</span>
              </div>
              <div class="neo-total">
                <v-icon icon="mdi-thumb-down-outline" size="20" class="neo-total-icone neo-total-icone--nao" />
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
            <!-- Escolha do usuário, não status: botões neutros, e a seleção em
                 azul. Sem a prop `color`, que viraria classe !important. -->
            <div class="neo-choices" role="group" aria-labelledby="pergunta-neo">
              <v-btn
                :prepend-icon="resposta === true ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                variant="outlined"
                :class="['neo-choice', { 'neo-choice--selected': resposta === true }]"
                :aria-pressed="resposta === true"
                :disabled="salvando"
                @click="resposta = true; sucesso = false"
              >Passou</v-btn>
              <v-btn
                :prepend-icon="resposta === false ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'"
                variant="outlined"
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
          <v-alert v-if="sucesso" type="success" variant="tonal" density="compact" class="mt-4" role="status">
            {{ resumo.minhaResposta === null ? 'Resposta removida.' : 'Resposta salva!' }}
          </v-alert>
          <p class="neo-caption">Os relatos não garantem aceitação futura.</p>
        </template>
      </v-card-text>
      <v-card-actions class="dialog-actions neo-actions">
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
import { nomeProprio } from '@/utils/formatacao'

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
/* Raio de 16px e sombra de overlay vêm da regra global de diálogo em main.css.
   Forma, cor e responsividade dos botões do rodapé vêm de .btn-dialog* e
   .dialog-actions. */

.neo-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4) var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  white-space: normal;
}

/* Tile de ícone (§4.5): blue-50, ícone blue-700, 40px, raio 8px. */
.neo-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-blue-50);
  color: var(--color-blue-700);
}

.neo-heading { flex: 1; min-width: 0; }

.neo-heading h2 {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
}

.neo-heading p {
  margin: 0;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  font-weight: 400;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.neo-fechar { color: var(--color-text-muted); }

.neo-dialog .neo-content {
  padding: var(--space-6) !important;
  overflow-y: auto;
}

.neo-section-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
}

.neo-totals, .neo-choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

/* Totais: card neutro. A cor semântica fica só no ícone. */
.neo-total {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 2px var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.neo-total strong {
  font-size: var(--text-kpi-size);
  line-height: var(--text-kpi-line);
  font-weight: var(--text-kpi-weight);
  font-variant-numeric: tabular-nums;
  color: var(--color-neutral-900);
}

.neo-total span {
  grid-column: 2;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.neo-total-icone { grid-row: span 2; }
.neo-total-icone--sim { color: var(--color-success-icon); }
.neo-total-icone--nao { color: var(--color-error-icon); }

.neo-caption {
  margin: var(--space-3) 0 0;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.neo-vote {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

/* Escolha: secundário neutro; selecionado em azul (blue-50, borda e texto
   blue-700). A classe dobrada vence o outlined do Vuetify. */
.v-btn.neo-choice {
  height: 48px;
  min-width: 0;
  padding: 0 var(--space-3);
  border-color: var(--color-neutral-300);
  background-color: var(--color-surface);
  color: var(--color-text);
}

.v-btn.neo-choice:hover {
  border-color: var(--color-neutral-400);
}

.v-btn.neo-choice.neo-choice--selected {
  border: 2px solid var(--color-blue-700);
  background-color: var(--color-blue-50);
  color: var(--color-blue-700);
  font-weight: 600;
}

/* Terciário (§4.6): texto blue-600. */
.v-btn.neo-remove {
  margin-top: var(--space-3);
  padding: 0 var(--space-2);
  color: var(--color-blue-600);
}

.v-btn.neo-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
}

.v-card-actions.neo-actions {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4) !important;
}

@media (max-width: 400px) {
  .neo-header { padding: var(--space-4) var(--space-3) var(--space-3) var(--space-4); gap: var(--space-2); }
  .neo-dialog .neo-content { padding: var(--space-5) var(--space-4) !important; }
  .neo-total { padding: var(--space-3); }
  .neo-totals, .neo-choices { gap: var(--space-2); }
  .v-btn.neo-choice { font-size: var(--text-body-sm-size); }
  .neo-dialog .btn-dialog { padding: 0 var(--space-2); font-size: var(--text-body-sm-size); }
}
</style>
