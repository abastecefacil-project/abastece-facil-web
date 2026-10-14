<template>
  <v-dialog
    :model-value="modelValue"
    max-width="860px"
    persistent
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="pa-6 pb-2">
        <span class="text-h5 font-weight-bold">Importar planilha de postos</span>
      </v-card-title>

      <v-card-text class="px-6 py-4">
        <v-alert
          v-if="erroApi"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
          :text="erroApi"
        />

        <v-alert
          v-if="aviso"
          :type="aviso.tipo"
          variant="tonal"
          density="compact"
          class="mb-4"
          :text="aviso.texto"
        />

        <!-- Retomada: antes de oferecer a seleção, confere se já há importação rodando. -->
        <div v-if="etapa === 'carregando'" class="carregando">
          <v-progress-circular indeterminate color="primary" size="28" width="3" />
          <span class="texto-apoio">Verificando se há importação em andamento…</span>
        </div>

        <!-- Etapa 1: seleção do arquivo -->
        <template v-else-if="etapa === 'selecao'">
          <p class="texto-apoio mb-4">
            Envie a planilha .xlsx de postos credenciados, com até 10 MB. Nada é gravado nesta
            etapa: primeiro você confere a prévia do que vai mudar.
          </p>

          <v-file-input
            v-model="selecao"
            label="Planilha (.xlsx)"
            :accept="TIPOS_ACEITOS"
            variant="outlined"
            density="comfortable"
            prepend-icon=""
            prepend-inner-icon="mdi-file-excel-outline"
            show-size
            :disabled="analisando"
            :error-messages="erroArquivo ? [erroArquivo] : []"
          />

          <!-- Só o que o navegador sabe de fato: o envio, medido, e a espera pela
               resposta. O backend não informa etapas da análise, então nada é
               simulado aqui. -->
          <div v-if="analisando && faseAnalise" class="analise-status">
            <span class="analise-texto">{{ textoFaseAnalise }}</span>
            <v-progress-linear
              :model-value="percentualEnvio ?? 0"
              :indeterminate="faseAnalise === 'analise' || percentualEnvio === null"
              color="primary"
              height="6"
              rounded
            />
            <span v-if="analiseDemorada" class="texto-apoio">
              Planilhas grandes podem levar alguns segundos.
            </span>
          </div>
        </template>

        <!-- Etapa 2: prévia -->
        <template v-else-if="etapa === 'previa' && previa">
          <p class="texto-apoio mb-4">
            {{ arquivo?.name }} · {{ totaisLeitura }}
          </p>

          <ImportacaoContadores :contadores="contadoresPrevia" class="mb-4" />

          <v-alert
            v-if="desativacaoPrevia"
            :type="desativacaoPrevia.alta ? 'error' : 'warning'"
            variant="tonal"
            density="compact"
            class="mb-4"
            :text="textoAlertaDesativacao"
          />

          <v-expansion-panels v-if="haDetalhesPrevia" multiple variant="accordion" class="mb-4">
            <v-expansion-panel v-for="grupo in gruposItens" :key="grupo.chave">
              <v-expansion-panel-title>
                <span class="painel-titulo">{{ grupo.titulo }}</span>
                <span class="painel-contagem">{{ formatarNumero(grupo.itens.length) }}</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <!-- Virtualizado: a primeira carga real tem ~1.176 itens em inserir. -->
                <v-virtual-scroll :items="grupo.itens" max-height="320">
                  <template #default="{ item }">
                    <div class="linha-item">
                      <span class="linha-titulo">{{ nomeDoItem(item) }}</span>
                      <span class="linha-meta">
                        {{ item.cidade || '—' }} · CNPJ {{ item.cnpj || '—' }}
                      </span>
                      <span
                        v-if="grupo.mostrarCampos && item.camposAlterados?.length"
                        class="linha-campos"
                      >
                        Alterado: {{ item.camposAlterados.join(', ') }}
                      </span>
                    </div>
                  </template>
                </v-virtual-scroll>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <ImportacaoOcorrencias
              v-for="grupo in gruposOcorrenciasPrevia"
              :key="grupo.chave"
              :titulo="grupo.titulo"
              :ocorrencias="grupo.itens"
            />
          </v-expansion-panels>

          <p class="tempo-estimado">
            <v-icon icon="mdi-timer-outline" size="18" class="mr-1" />
            {{ tempoEstimado }}
          </p>
          <p class="texto-apoio">
            A importação continua no servidor mesmo se você fechar esta janela.
          </p>
        </template>

        <!-- Etapa 3: progresso -->
        <template v-else-if="etapa === 'progresso' && importacao">
          <div class="progresso-cabecalho">
            <span class="progresso-texto">{{ textoProcessados }}</span>
            <span v-if="totalImportacao > 0" class="progresso-percentual">{{ percentual }}%</span>
          </div>

          <v-progress-linear
            :model-value="percentual"
            :indeterminate="totalImportacao === 0 && !acompanhamentoParado"
            color="primary"
            height="10"
            rounded
            class="mb-3"
          />

          <p v-if="!acompanhamentoParado" class="texto-apoio">{{ textoRestante }}</p>

          <p v-if="cancelamentoSolicitado && !acompanhamentoParado" class="aviso-cancelamento">
            <v-icon icon="mdi-stop-circle-outline" size="16" class="mr-1" />
            Cancelamento solicitado. A importação para após o posto em andamento.
          </p>

          <v-alert
            v-if="erroCancelamento && !acompanhamentoParado"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
            :text="erroCancelamento"
          />

          <p v-if="semResposta && !acompanhamentoParado" class="aviso-discreto">
            <v-icon icon="mdi-wifi-strength-alert-outline" size="16" class="mr-1" />
            Sem resposta do servidor, tentando novamente…
          </p>

          <v-alert
            v-if="erroAcompanhamento"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
            :text="erroAcompanhamento"
          />

          <p v-if="!acompanhamentoParado" class="texto-apoio mt-4">
            A importação continua no servidor. Você pode fechar esta janela e acompanhar depois.
          </p>
        </template>

        <!-- Etapa 4: relatório -->
        <template v-else-if="etapa === 'resultado' && importacao">
          <v-alert
            v-if="avisoCancelamentoNaoAtendido"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
            :text="avisoCancelamentoNaoAtendido"
          />

          <v-alert
            :type="desfecho.tipo"
            variant="tonal"
            density="compact"
            class="mb-4"
            :text="desfecho.texto"
          />
          <h3 v-if="desfecho.parcial" class="secao-titulo">O que já foi feito</h3>

          <ImportacaoContadores :contadores="contadoresResultado" class="mb-4" />

          <v-expansion-panels v-if="gruposOcorrenciasResultado.length" multiple variant="accordion">
            <ImportacaoOcorrencias
              v-for="grupo in gruposOcorrenciasResultado"
              :key="grupo.chave"
              :titulo="grupo.titulo"
              :ocorrencias="grupo.itens"
            />
          </v-expansion-panels>
        </template>
      </v-card-text>

      <v-card-actions class="dialog-actions acoes-importacao">
        <template v-if="etapa === 'progresso' && !acompanhamentoParado">
          <!-- Fechar só encerra o polling: nada é cancelado no servidor, e reabrir
               o dialog retoma o acompanhamento pelo GET /import/atual. Cancelar de
               fato é o outro botão. -->
          <v-btn class="btn-dialog btn-dialog--cancelar" variant="outlined" @click="fechar">
            Fechar e acompanhar depois
          </v-btn>

          <v-btn
            class="btn-dialog btn-dialog--perigo"
            variant="flat"
            :disabled="cancelamentoSolicitado"
            @click="abrirConfirmacaoCancelamento"
          >
            {{ cancelamentoSolicitado ? 'Cancelando…' : 'Cancelar importação' }}
          </v-btn>
        </template>

        <template v-else>
          <!-- Travado durante o startImport: fechar ali descartaria o 202 e deixaria
               uma importação rodando sem a tela saber. -->
          <v-btn
            class="btn-dialog btn-dialog--cancelar"
            variant="outlined"
            :disabled="iniciando"
            @click="fechar"
          >
            {{ rotuloFechar }}
          </v-btn>

          <v-btn
            v-if="etapa === 'selecao'"
            class="btn-dialog btn-dialog--confirmar"
            variant="flat"
            :loading="analisando"
            :disabled="analisando"
            @click="analisar"
          >
            Analisar planilha
          </v-btn>

          <template v-if="etapa === 'previa'">
            <v-btn
              class="btn-dialog btn-dialog--cancelar"
              variant="outlined"
              :disabled="iniciando"
              @click="novaImportacao"
            >
              Trocar arquivo
            </v-btn>
            <!-- Sem janela de confirmação: a prévia já mostra contadores, alerta de
                 desativação e tempo, e a importação pode ser cancelada depois. -->
            <v-btn
              class="btn-dialog btn-dialog--confirmar"
              variant="flat"
              :loading="iniciando"
              :disabled="iniciando || !previa"
              @click="confirmarImportacao"
            >
              Confirmar importação
            </v-btn>
          </template>

          <v-btn
            v-if="podeTentarNovamente"
            class="btn-dialog btn-dialog--confirmar"
            variant="flat"
            @click="tentarNovamente"
          >
            Tentar novamente
          </v-btn>

          <v-btn
            v-if="podeNovaImportacao"
            class="btn-dialog btn-dialog--confirmar"
            variant="flat"
            @click="novaImportacao"
          >
            Nova importação
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- "Voltar", e não o "Cancelar" padrão: os dois botões diriam cancelar com
       sentidos opostos. -->
  <ConfirmDialog
    v-model="confirmacaoCancelamentoAberta"
    title="Cancelar importação"
    message="Os postos já processados permanecem gravados e nenhum posto será desativado. Deseja cancelar a importação?"
    confirm-text="Cancelar importação"
    cancel-text="Voltar"
    confirm-tone="danger"
    :loading="cancelando"
    @confirm="confirmarCancelamento"
  />
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import ImportacaoContadores from './ImportacaoContadores.vue'
import ImportacaoOcorrencias from './ImportacaoOcorrencias.vue'
import {
  cancelImport,
  getCurrentImport,
  getImportStatus,
  previewImport,
  startImport,
} from '@/services/stationService'
import { escolherNomeExibicao } from '@/utils/posto'
import {
  contarGeocodificacoes,
  descreverDesativacao,
  descreverTempoEstimado,
  descreverTempoRestante,
  formatarNumero,
} from '@/utils/importacaoPostos'

const props = defineProps({
  modelValue: Boolean,
})

// importacao-em-andamento: o dialog passou a acompanhar uma importação — iniciada
// aqui, existente (409) ou retomada ao abrir. A tela usa para indicar no botão.
// importacao-finalizada: houve gravação (concluída, falhou, cancelada ou
// interrompida) e a lista de postos da tela está desatualizada.
const emit = defineEmits(['update:modelValue', 'importacao-em-andamento', 'importacao-finalizada'])

const TIPOS_ACEITOS = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Mesmo teto do client_max_body_size do nginx. A checagem no front não é só
// conveniência: bem acima do limite o servidor pode resetar a conexão em vez de
// responder um 413 legível.
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024

// A partir daqui a espera pela prévia ganha a frase sobre planilhas grandes.
const ANALISE_DEMORADA_MS = 5000

const INTERVALO_POLLING_MS = 3000
const MAXIMO_FALHAS_SEGUIDAS = 5
// Falhas que costumam passar sozinhas: proxy sem upstream, API reiniciando.
const STATUS_TRANSITORIOS = [502, 503, 504]

const MENSAGEM_ERRO_PADRAO = 'Não foi possível concluir a operação. Tente novamente.'
const MENSAGEM_SEM_RESPOSTA =
  'Não foi possível enviar a planilha. Verifique a conexão e se o arquivo tem até 10 MB.'
const MENSAGEM_ACESSO_NEGADO =
  'Acesso negado. Sua sessão pode ter expirado: entre novamente e tente de novo.'
const MENSAGEM_FALHA_PADRAO = 'A importação falhou no servidor.'
const MENSAGEM_CANCELADA_PADRAO = 'A importação foi cancelada.'
// CONCLUIDA apesar do pedido, conforme o que o POST de cancelamento respondeu.
const MENSAGENS_CANCELAMENTO_NAO_ATENDIDO = {
  // 202: a desativação final não é interrompível, então o pedido foi aceito e
  // mesmo assim a importação concluiu.
  aceito: 'O cancelamento chegou quando a importação já estava na etapa final; ela foi concluída.',
  // 409: a importação já tinha terminado quando o pedido chegou.
  tardio: 'A importação terminou antes que o cancelamento fosse processado.',
}
const MENSAGEM_INTERROMPIDA =
  'A importação foi interrompida: o servidor foi reiniciado. O que já foi gravado permanece. Envie a planilha novamente para concluir.'
const MENSAGEM_SEM_RESPOSTA_REPETIDA =
  'O servidor não respondeu em 5 tentativas seguidas. A importação pode continuar rodando lá; tente novamente em instantes.'
const MENSAGEM_OUTRA_TERMINOU =
  'A importação que estava em andamento acabou de terminar. Confira a lista de postos e, se precisar, envie a planilha de novo.'

// Usado só quando o backend não traz `message`: a dele vem em pt-BR, é segura
// para exibir e é mais específica (diz qual coluna falta, por exemplo).
const MENSAGENS_POR_ERRO = {
  PLANILHA_INVALIDA:
    'A planilha não está no formato esperado. Confira se é o arquivo .xlsx original, com o cabeçalho e as colunas completos.',
  ARQUIVO_OBRIGATORIO: 'Selecione a planilha .xlsx antes de analisar.',
  ARQUIVO_MUITO_GRANDE: 'O arquivo passa do limite de 10 MB da importação.',
  PLANILHA_SEM_POSTOS_NO_ESCOPO: 'A planilha não tem nenhum posto dentro do escopo da importação.',
  PERFIL_NAO_PERMITIDO: 'Apenas administradores podem importar a planilha de postos.',
  IMPORTACAO_EM_ANDAMENTO: 'Já existe uma importação em andamento.',
  IMPORTACAO_NAO_ENCONTRADA: MENSAGEM_INTERROMPIDA,
}

// === Estado ===
// etapa: carregando → selecao → previa → progresso → resultado
const etapa = ref('carregando')
const selecao = ref(null)
const arquivo = ref(null)
const erroArquivo = ref('')
const erroApi = ref('')
const aviso = ref(null)
const analisando = ref(false)
// Durante a análise: 'envio' enquanto o upload sobe, 'analise' depois que ele
// chega a 100% e a resposta ainda não veio. percentualEnvio é null quando o
// navegador não informa o tamanho total.
const faseAnalise = ref(null)
const percentualEnvio = ref(0)
const analiseDemorada = ref(false)
const previa = ref(null)

const iniciando = ref(false)

const importacao = ref(null)
// { processados, instante = Date.now() } por resposta do polling, só desta
// sessão de acompanhamento: o tempo restante sai do relógio do navegador.
const amostras = ref([])
const semResposta = ref(false)
// null enquanto acompanha; 'interrompida' (404), 'falhas' (rede), 'sessao'
// (403) ou 'erro' quando o polling parou.
const acompanhamentoParado = ref(null)
const erroAcompanhamento = ref('')

// O status do backend não diz que houve pedido de cancelamento: esse estado é
// só do front, e se perde de propósito ao fechar ou recarregar — o desfecho
// chega pelo polling de qualquer forma. { id, resultado: 'aceito' | 'tardio' }:
// o id evita que outra importação, retomada depois, herde o pedido.
const pedidoCancelamento = ref(null)
const confirmacaoCancelamentoAberta = ref(false)
const cancelando = ref(false)
const erroCancelamento = ref('')

let falhasSeguidas = 0
let gravacoesNotificadas = false
let timerPolling = null
let timerAnaliseDemorada = null

// Identifica a operação corrente. Qualquer resposta — prévia, início ou
// polling — que chegue com um número antigo pertence a um estado que o usuário
// já abandonou (fechou, trocou de arquivo) e é descartada.
let requisicaoAtual = 0

// === Prévia ===
function nomeDoItem(item) {
  return escolherNomeExibicao(item.nomeFantasia, item.nome)
}

function validarArquivo(valor) {
  if (!valor) return 'Selecione a planilha .xlsx.'
  if (!valor.name.toLowerCase().endsWith('.xlsx')) return 'O arquivo precisa ser uma planilha .xlsx.'
  if (valor.size > TAMANHO_MAXIMO_BYTES) return 'O arquivo tem mais de 10 MB, o limite da importação.'
  return ''
}

// Conforme a versão, o v-file-input entrega File ou File[] mesmo sem `multiple`.
watch(selecao, (valor) => {
  const escolhido = Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null)
  arquivo.value = escolhido
  erroApi.value = ''
  erroArquivo.value = escolhido ? validarArquivo(escolhido) : ''
})

const totaisLeitura = computed(() => {
  const lidas = previa.value?.totalLinhasLidas ?? 0
  const escopo = previa.value?.totalNoEscopo ?? 0
  const rotulo = lidas === 1 ? 'linha lida' : 'linhas lidas'
  return `${formatarNumero(lidas)} ${rotulo}, ${formatarNumero(escopo)} no escopo`
})

const contadoresPrevia = computed(() => {
  const p = previa.value ?? {}
  return [
    { rotulo: 'Inserir', valor: p.inserir?.length ?? 0 },
    { rotulo: 'Atualizar', valor: p.atualizar?.length ?? 0 },
    { rotulo: 'Reativar', valor: p.reativar?.length ?? 0 },
    { rotulo: 'Desativar', valor: p.desativar?.length ?? 0, destaque: 'alerta' },
    { rotulo: 'Sem alteração', valor: p.semAlteracao ?? 0 },
    { rotulo: 'Erros', valor: p.erros?.length ?? 0, destaque: 'erro' },
  ]
})

const desativacaoPrevia = computed(() =>
  descreverDesativacao(previa.value?.desativar?.length ?? 0, previa.value?.totalAtivosNoBanco ?? 0),
)

const SUFIXO_DESATIVACAO_ALTA = 'A proporção é alta: confira se a planilha está completa antes de confirmar.'

const textoAlertaDesativacao = computed(() => {
  const d = desativacaoPrevia.value
  if (!d) return ''
  return d.alta ? `${d.texto} ${SUFIXO_DESATIVACAO_ALTA}` : d.texto
})

const tempoEstimado = computed(() => descreverTempoEstimado(contarGeocodificacoes(previa.value)))

const textoFaseAnalise = computed(() => {
  if (faseAnalise.value === 'analise') return 'Analisando planilha…'
  return percentualEnvio.value === null
    ? 'Enviando planilha…'
    : `Enviando planilha… ${percentualEnvio.value}%`
})

const gruposItens = computed(() => {
  const p = previa.value
  if (!p) return []
  return [
    { chave: 'inserir', titulo: 'Inserir', itens: p.inserir ?? [], mostrarCampos: false },
    { chave: 'atualizar', titulo: 'Atualizar', itens: p.atualizar ?? [], mostrarCampos: true },
    { chave: 'reativar', titulo: 'Reativar', itens: p.reativar ?? [], mostrarCampos: true },
    { chave: 'desativar', titulo: 'Desativar', itens: p.desativar ?? [], mostrarCampos: false },
  ].filter((grupo) => grupo.itens.length > 0)
})

function gruposDeOcorrencias(origem) {
  if (!origem) return []
  return [
    { chave: 'erros', titulo: 'Erros', itens: origem.erros ?? [] },
    { chave: 'avisos', titulo: 'Avisos', itens: origem.avisos ?? [] },
  ].filter((grupo) => grupo.itens.length > 0)
}

const gruposOcorrenciasPrevia = computed(() => gruposDeOcorrencias(previa.value))

const haDetalhesPrevia = computed(
  () => gruposItens.value.length > 0 || gruposOcorrenciasPrevia.value.length > 0,
)

// === Progresso ===
const totalImportacao = computed(() => importacao.value?.total ?? 0)
const processadosImportacao = computed(() => importacao.value?.processados ?? 0)

const percentual = computed(() =>
  totalImportacao.value > 0
    ? Math.min(100, Math.round((processadosImportacao.value / totalImportacao.value) * 100))
    : 0,
)

const textoProcessados = computed(() =>
  totalImportacao.value > 0
    ? `${formatarNumero(processadosImportacao.value)} de ${formatarNumero(totalImportacao.value)} postos processados`
    : 'Preparando a importação…',
)

const textoRestante = computed(() =>
  descreverTempoRestante(amostras.value, totalImportacao.value, processadosImportacao.value),
)

const cancelamentoSolicitado = computed(
  () => pedidoCancelamento.value !== null && pedidoCancelamento.value.id === importacao.value?.id,
)

// === Resultado ===
// parcial: a importação não chegou ao fim, e os contadores dizem só o que já
// tinha sido gravado.
const desfecho = computed(() => {
  const status = importacao.value?.status
  const mensagem = importacao.value?.mensagem
  if (status === 'FALHOU') {
    return { tipo: 'error', texto: mensagem || MENSAGEM_FALHA_PADRAO, parcial: true }
  }
  if (status === 'CANCELADA') {
    return { tipo: 'warning', texto: mensagem || MENSAGEM_CANCELADA_PADRAO, parcial: true }
  }
  return { tipo: 'success', texto: 'Importação concluída.', parcial: false }
})

// Só em CONCLUIDA: em FALHOU e CANCELADA o motivo do pedido não muda nada.
const avisoCancelamentoNaoAtendido = computed(() => {
  if (!cancelamentoSolicitado.value || importacao.value?.status !== 'CONCLUIDA') return ''
  return MENSAGENS_CANCELAMENTO_NAO_ATENDIDO[pedidoCancelamento.value.resultado] ?? ''
})

const contadoresResultado = computed(() => {
  const r = importacao.value?.resumo ?? {}
  return [
    { rotulo: 'Inseridos', valor: r.inseridos ?? 0 },
    { rotulo: 'Atualizados', valor: r.atualizados ?? 0 },
    { rotulo: 'Reativados', valor: r.reativados ?? 0 },
    { rotulo: 'Desativados', valor: r.desativados ?? 0, destaque: 'alerta' },
    { rotulo: 'Sem alteração', valor: r.semAlteracao ?? 0 },
    { rotulo: 'Erros', valor: r.erros?.length ?? 0, destaque: 'erro' },
    { rotulo: 'Avisos', valor: r.avisos?.length ?? 0 },
  ]
})

const gruposOcorrenciasResultado = computed(() => gruposDeOcorrencias(importacao.value?.resumo))

// === Ações disponíveis ===
const podeTentarNovamente = computed(
  () => etapa.value === 'progresso' && ['falhas', 'erro'].includes(acompanhamentoParado.value),
)

const podeNovaImportacao = computed(
  () =>
    etapa.value === 'resultado' ||
    (etapa.value === 'progresso' && acompanhamentoParado.value === 'interrompida'),
)

const rotuloFechar = computed(() =>
  ['progresso', 'resultado'].includes(etapa.value) ? 'Fechar' : 'Cancelar',
)

// === Erros ===
function mensagemDeErro(err) {
  const resposta = err?.response
  if (!resposta) return MENSAGEM_SEM_RESPOSTA

  const corpo = resposta.data
  const mensagem = typeof corpo?.message === 'string' ? corpo.message.trim() : ''
  if (mensagem) return mensagem

  const codigo = corpo?.error
  if (codigo && MENSAGENS_POR_ERRO[codigo]) return MENSAGENS_POR_ERRO[codigo]

  // 413 do nginx chega em HTML, sem ErrorResponse; 403 do Spring Security
  // (token vencido, por exemplo) chega sem corpo.
  if (resposta.status === 413) return MENSAGENS_POR_ERRO.ARQUIVO_MUITO_GRANDE
  if (resposta.status === 403) return MENSAGEM_ACESSO_NEGADO
  return MENSAGEM_ERRO_PADRAO
}

// === Ciclo de vida do acompanhamento ===
function pararPolling() {
  if (timerPolling !== null) {
    clearTimeout(timerPolling)
    timerPolling = null
  }
}

// Encerra timer e invalida toda resposta pendente. Roda ao fechar, ao trocar de
// arquivo, ao começar uma nova importação e ao desmontar a tela.
function invalidarOperacoes() {
  requisicaoAtual++
  pararPolling()
  pararTimerAnalise()
}

function limpar() {
  invalidarOperacoes()
  etapa.value = 'selecao'
  selecao.value = null
  arquivo.value = null
  erroArquivo.value = ''
  erroApi.value = ''
  aviso.value = null
  analisando.value = false
  faseAnalise.value = null
  percentualEnvio.value = 0
  analiseDemorada.value = false
  previa.value = null
  iniciando.value = false
  importacao.value = null
  amostras.value = []
  semResposta.value = false
  acompanhamentoParado.value = null
  erroAcompanhamento.value = ''
  pedidoCancelamento.value = null
  confirmacaoCancelamentoAberta.value = false
  cancelando.value = false
  erroCancelamento.value = ''
  falhasSeguidas = 0
  gravacoesNotificadas = false
}

// Retomada: cobre fechar e reabrir, F5 e importação iniciada por outro
// administrador. Só depois de saber que não há nada rodando é que a seleção
// aparece.
async function abrir() {
  limpar()
  etapa.value = 'carregando'
  const requisicao = requisicaoAtual

  try {
    const atual = await getCurrentImport()
    if (requisicao !== requisicaoAtual) return
    if (atual?.status === 'EM_ANDAMENTO') acompanhar(atual)
    else etapa.value = 'selecao'
  } catch {
    if (requisicao !== requisicaoAtual) return
    // Seguir é seguro: se houver importação rodando, o envio cai no 409 e
    // passa a acompanhá-la.
    aviso.value = {
      tipo: 'warning',
      texto: 'Não foi possível verificar se já há uma importação em andamento. Se houver, ao enviar a planilha você passa a acompanhá-la.',
    }
    etapa.value = 'selecao'
  }
}

function fechar() {
  limpar()
  emit('update:modelValue', false)
}

function novaImportacao() {
  limpar()
}

async function analisar() {
  const erro = validarArquivo(arquivo.value)
  if (erro) {
    erroArquivo.value = erro
    return
  }

  erroApi.value = ''
  analisando.value = true
  faseAnalise.value = 'envio'
  percentualEnvio.value = 0
  analiseDemorada.value = false
  const requisicao = ++requisicaoAtual

  const aoEnviar = (evento) => {
    // Cancelado no meio: o upload pode seguir notificando depois do descarte.
    if (requisicao !== requisicaoAtual || faseAnalise.value !== 'envio') return
    if (!evento.total) {
      percentualEnvio.value = null
      return
    }
    percentualEnvio.value = Math.min(100, Math.round((evento.loaded / evento.total) * 100))
    if (evento.loaded >= evento.total) iniciarFaseAnalise(requisicao)
  }

  try {
    const { data } = await previewImport(arquivo.value, { onUploadProgress: aoEnviar })
    if (requisicao !== requisicaoAtual) return
    previa.value = data
    etapa.value = 'previa'
  } catch (err) {
    if (requisicao !== requisicaoAtual) return
    erroApi.value = mensagemDeErro(err)
  } finally {
    if (requisicao === requisicaoAtual) {
      analisando.value = false
      faseAnalise.value = null
      analiseDemorada.value = false
      pararTimerAnalise()
    }
  }
}

// O upload terminou e a resposta não veio: o servidor está lendo a planilha.
// Os ~5 s contam daqui, que é quando a análise de fato começa.
function iniciarFaseAnalise(requisicao) {
  faseAnalise.value = 'analise'
  pararTimerAnalise()
  timerAnaliseDemorada = setTimeout(() => {
    timerAnaliseDemorada = null
    if (requisicao === requisicaoAtual) analiseDemorada.value = true
  }, ANALISE_DEMORADA_MS)
}

function pararTimerAnalise() {
  if (timerAnaliseDemorada !== null) {
    clearTimeout(timerAnaliseDemorada)
    timerAnaliseDemorada = null
  }
}

async function confirmarImportacao() {
  erroApi.value = ''
  iniciando.value = true
  const requisicao = ++requisicaoAtual

  try {
    // O backend relê o arquivo e recalcula o plano: os erros da prévia podem
    // voltar aqui, e são tratados igual.
    const { data } = await startImport(arquivo.value)
    if (requisicao !== requisicaoAtual) return
    acompanhar({ id: data.id, status: 'EM_ANDAMENTO' }, 0)
  } catch (err) {
    if (requisicao !== requisicaoAtual) return
    if (err?.response?.status === 409) await acompanharExistente(requisicao)
    else erroApi.value = mensagemDeErro(err)
  } finally {
    if (requisicao === requisicaoAtual) iniciando.value = false
  }
}

async function acompanharExistente(requisicao) {
  try {
    const atual = await getCurrentImport()
    if (requisicao !== requisicaoAtual) return
    if (atual?.status === 'EM_ANDAMENTO') {
      aviso.value = {
        tipo: 'info',
        texto: 'Já havia uma importação em andamento; acompanhando a existente.',
      }
      acompanhar(atual)
    } else {
      erroApi.value = MENSAGEM_OUTRA_TERMINOU
    }
  } catch (err) {
    if (requisicao !== requisicaoAtual) return
    erroApi.value = mensagemDeErro(err)
  }
}

// === Polling ===
function acompanhar(status, primeiraConsultaEmMs = INTERVALO_POLLING_MS) {
  importacao.value = status
  amostras.value = []
  falhasSeguidas = 0
  semResposta.value = false
  acompanhamentoParado.value = null
  erroAcompanhamento.value = ''
  etapa.value = 'progresso'
  registrarAmostra(status)
  agendarConsulta(primeiraConsultaEmMs)
  // Único ponto de entrada no acompanhamento: cobre início, 409 e retomada.
  emit('importacao-em-andamento')
}

function registrarAmostra(status) {
  // O status montado a partir do 202 não traz `processados`: não é amostra.
  if (typeof status.processados !== 'number') return
  amostras.value.push({ processados: status.processados, instante: Date.now() })
}

// setTimeout encadeado, nunca setInterval: a próxima consulta só é agendada
// depois que a anterior respondeu, então não há requisições sobrepostas.
function agendarConsulta(ms = INTERVALO_POLLING_MS) {
  pararPolling()
  const requisicao = requisicaoAtual
  timerPolling = setTimeout(() => consultarStatus(requisicao), ms)
}

async function consultarStatus(requisicao) {
  timerPolling = null
  if (requisicao !== requisicaoAtual) return

  try {
    const { data } = await getImportStatus(importacao.value.id)
    if (requisicao !== requisicaoAtual) return
    falhasSeguidas = 0
    semResposta.value = false
    aplicarStatus(data)
  } catch (err) {
    if (requisicao !== requisicaoAtual) return
    tratarFalhaConsulta(err)
  }
}

function aplicarStatus(status) {
  importacao.value = status
  if (status.status === 'EM_ANDAMENTO') {
    registrarAmostra(status)
    agendarConsulta()
    return
  }
  // CONCLUIDA, FALHOU ou CANCELADA: nos três casos houve gravação. A
  // confirmação de cancelamento, se aberta, não faz mais sentido sobre o relatório.
  confirmacaoCancelamentoAberta.value = false
  etapa.value = 'resultado'
  notificarGravacoes()
}

function notificarGravacoes() {
  if (gravacoesNotificadas) return
  gravacoesNotificadas = true
  emit('importacao-finalizada')
}

function tratarFalhaConsulta(err) {
  const status = err?.response?.status

  if (status === 404) {
    marcarInterrompida()
    return
  }

  if (!err?.response || STATUS_TRANSITORIOS.includes(status)) {
    falhasSeguidas++
    if (falhasSeguidas >= MAXIMO_FALHAS_SEGUIDAS) {
      pararAcompanhamento('falhas', MENSAGEM_SEM_RESPOSTA_REPETIDA)
      return
    }
    semResposta.value = true
    agendarConsulta()
    return
  }

  // Sessão expirada não se resolve tentando de novo.
  if (status === 403) {
    pararAcompanhamento('sessao', mensagemDeErro(err))
    return
  }

  pararAcompanhamento('erro', mensagemDeErro(err))
}

// O registro da importação vive em memória no backend: 404 é servidor
// reiniciado (ou mais de 24 h). O que já foi gravado continua gravado.
function marcarInterrompida() {
  confirmacaoCancelamentoAberta.value = false
  pararAcompanhamento('interrompida', MENSAGEM_INTERROMPIDA)
  notificarGravacoes()
}

function pararAcompanhamento(motivo, mensagem) {
  pararPolling()
  semResposta.value = false
  acompanhamentoParado.value = motivo
  erroAcompanhamento.value = mensagem
}

// === Cancelamento ===
function abrirConfirmacaoCancelamento() {
  erroCancelamento.value = ''
  confirmacaoCancelamentoAberta.value = true
}

async function confirmarCancelamento() {
  const id = importacao.value?.id
  if (id == null) return

  erroCancelamento.value = ''
  cancelando.value = true
  // Sem incrementar: um número novo descartaria a consulta de polling já
  // agendada. Basta saber se o usuário abandonou o acompanhamento no meio.
  const requisicao = requisicaoAtual

  try {
    await cancelImport(id)
    if (requisicao !== requisicaoAtual) return
    pedidoCancelamento.value = { id, resultado: 'aceito' }
    confirmacaoCancelamentoAberta.value = false
  } catch (err) {
    if (requisicao !== requisicaoAtual) return
    confirmacaoCancelamentoAberta.value = false
    tratarFalhaCancelamento(err, id)
  } finally {
    if (requisicao === requisicaoAtual) cancelando.value = false
  }
}

// O polling segue intocado em todos os casos: a parada real, ou o desfecho que
// já aconteceu, chega pelo GET. Nenhuma consulta é antecipada aqui: se houver
// uma em voo, agendar outra abriria duas cadeias de polling paralelas.
function tratarFalhaCancelamento(err, id) {
  const status = err?.response?.status

  // IMPORTACAO_NAO_EM_ANDAMENTO: terminou antes do pedido. Não é erro.
  if (status === 409) {
    pedidoCancelamento.value = { id, resultado: 'tardio' }
    return
  }

  if (status === 404) {
    marcarInterrompida()
    return
  }

  // Rede, 403, 5xx: o pedido não foi registrado e a importação segue rodando.
  // O botão volta a ficar disponível para nova tentativa.
  // Sem resposta, o texto de mensagemDeErro fala de envio da planilha: não serve.
  const detalhe = err?.response ? mensagemDeErro(err) : 'Verifique a conexão e tente novamente.'
  erroCancelamento.value = `Não foi possível pedir o cancelamento. ${detalhe}`
}

function tentarNovamente() {
  falhasSeguidas = 0
  acompanhamentoParado.value = null
  erroAcompanhamento.value = ''
  agendarConsulta(0)
}

// Cada abertura começa do zero e confere se há importação a retomar; fechar
// por qualquer caminho encerra o polling.
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) abrir()
    else invalidarOperacoes()
  },
)

onUnmounted(invalidarOperacoes)
</script>

<style scoped>
/* Forma e cor dos botões vêm de .btn-dialog* e .dialog-actions, em
   assets/main.css. Aqui só se permite quebrar linha: na prévia são três botões,
   e no mobile cada um ocupa 48%. */
.acoes-importacao {
  flex-wrap: wrap;
}

.texto-apoio {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.carregando {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}

/* Análise da planilha */
.analise-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.analise-texto {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Prévia */
.painel-titulo {
  font-weight: 600;
  color: var(--color-text);
}

.painel-contagem {
  margin-left: 8px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 20px;
}

.linha-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border);
}

.linha-titulo {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.linha-meta {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.linha-campos {
  font-size: 0.75rem;
  color: var(--color-primary);
}

.tempo-estimado {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Progresso */
.progresso-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.progresso-texto {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.progresso-percentual {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-primary);
}

.aviso-cancelamento {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-warning);
}

/* "Cancelando…": o Vuetify pinta o flat desabilitado com fundo de surface, e
   quem vence a disputa com .btn-dialog--perigo depende da ordem de injeção do
   CSS (CLAUDE.md §9, item 1). Fixa o vermelho de main.css, apagado. O scoped
   alcança o conteúdo do v-dialog (§9, item 8b). */
.v-btn.btn-dialog--perigo.v-btn--disabled {
  background-color: #c50606;
  color: var(--color-surface);
  opacity: 0.6;
}

/* O flat desabilitado também clareia o overlay interno, o que deixaria o
   vermelho rosado. */
.v-btn.btn-dialog--perigo.v-btn--disabled :deep(.v-btn__overlay) {
  opacity: 0;
}

.aviso-discreto {
  display: flex;
  align-items: center;
  margin-top: 6px;
  font-size: 0.8125rem;
  color: var(--color-warning);
}

/* Resultado */
.secao-titulo {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}
</style>
