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

        <!-- Etapa 1: seleção do arquivo -->
        <template v-if="etapa === 'selecao'">
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
        </template>

        <!-- Etapa 2: prévia -->
        <template v-else-if="previa">
          <p class="texto-apoio mb-4">
            {{ arquivo?.name }} · {{ totaisLeitura }}
          </p>

          <div class="contadores mb-4">
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

          <v-alert
            v-if="alertaDesativacao"
            :type="alertaDesativacao.tipo"
            variant="tonal"
            density="compact"
            class="mb-4"
            :text="alertaDesativacao.texto"
          />

          <v-expansion-panels v-if="haDetalhes" multiple variant="accordion">
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

            <v-expansion-panel v-for="grupo in gruposOcorrencias" :key="grupo.chave">
              <v-expansion-panel-title>
                <span class="painel-titulo">{{ grupo.titulo }}</span>
                <span class="painel-contagem">{{ formatarNumero(grupo.itens.length) }}</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-virtual-scroll :items="grupo.itens" max-height="320">
                  <template #default="{ item }">
                    <div class="linha-item">
                      <span class="linha-meta">
                        {{ rotuloLinha(item.linha) }} · CNPJ {{ item.cnpj || '—' }}
                      </span>
                      <span class="linha-mensagem">{{ item.mensagem }}</span>
                    </div>
                  </template>
                </v-virtual-scroll>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>
      </v-card-text>

      <v-card-actions class="dialog-actions acoes-importacao">
        <v-btn class="btn-dialog btn-dialog--cancelar" variant="outlined" @click="cancelar">
          Cancelar
        </v-btn>

        <template v-if="etapa === 'selecao'">
          <v-btn
            class="btn-dialog btn-dialog--confirmar"
            variant="flat"
            :loading="analisando"
            :disabled="analisando"
            @click="analisar"
          >
            Analisar planilha
          </v-btn>
        </template>

        <template v-else>
          <v-btn class="btn-dialog btn-dialog--cancelar" variant="outlined" @click="trocarArquivo">
            Trocar arquivo
          </v-btn>
          <!-- Sem ação por enquanto: confirmar e executar a importação é a etapa
               seguinte, que reenvia o mesmo `arquivo` guardado aqui. -->
          <v-btn class="btn-dialog btn-dialog--confirmar" variant="flat" :disabled="!previa">
            Confirmar importação
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { previewImport } from '@/services/stationService'
import { escolherNomeExibicao } from '@/utils/posto'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const TIPOS_ACEITOS = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Mesmo teto do client_max_body_size do nginx. A checagem no front não é só
// conveniência: bem acima do limite o servidor pode resetar a conexão em vez de
// responder um 413 legível.
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024

const MENSAGEM_ERRO_PADRAO = 'Não foi possível analisar a planilha. Tente novamente.'
const MENSAGEM_SEM_RESPOSTA =
  'Não foi possível enviar a planilha. Verifique a conexão e se o arquivo tem até 10 MB.'
const MENSAGEM_ACESSO_NEGADO =
  'Acesso negado. Sua sessão pode ter expirado: entre novamente e tente de novo.'

// Usado só quando o backend não traz `message`: a dele vem em pt-BR, é segura
// para exibir e é mais específica (diz qual coluna falta, por exemplo).
const MENSAGENS_POR_ERRO = {
  PLANILHA_INVALIDA:
    'A planilha não está no formato esperado. Confira se é o arquivo .xlsx original, com o cabeçalho e as colunas completos.',
  ARQUIVO_OBRIGATORIO: 'Selecione a planilha .xlsx antes de analisar.',
  ARQUIVO_MUITO_GRANDE: 'O arquivo passa do limite de 10 MB da importação.',
  PLANILHA_SEM_POSTOS_NO_ESCOPO: 'A planilha não tem nenhum posto dentro do escopo da importação.',
  PERFIL_NAO_PERMITIDO: 'Apenas administradores podem importar a planilha de postos.',
}

const formatoNumero = new Intl.NumberFormat('pt-BR')
const formatoPercentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

const etapa = ref('selecao')
const selecao = ref(null)
const arquivo = ref(null)
const erroArquivo = ref('')
const erroApi = ref('')
const analisando = ref(false)
const previa = ref(null)

// Identifica a análise em andamento: uma resposta que chega depois de Cancelar
// ou Trocar arquivo pertence a uma requisição antiga e é descartada.
let requisicaoAtual = 0

function formatarNumero(valor) {
  return formatoNumero.format(valor ?? 0)
}

function nomeDoItem(item) {
  return escolherNomeExibicao(item.nomeFantasia, item.nome)
}

// linha = 0 é a convenção do backend para "sem linha na planilha" — caso dos
// postos a desativar, que existem só no banco.
function rotuloLinha(linha) {
  return linha > 0 ? `Linha ${linha}` : '—'
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

const contadores = computed(() => {
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

// Desativar tira o posto do mapa. Metade ou mais da base sumindo de uma vez
// costuma ser planilha incompleta, não descredenciamento em massa.
const alertaDesativacao = computed(() => {
  const desativar = previa.value?.desativar?.length ?? 0
  if (desativar === 0) return null

  const ativos = previa.value.totalAtivosNoBanco ?? 0
  const proporcao = ativos > 0 ? (desativar / ativos) * 100 : 100
  const percentual = `${formatoPercentual.format(proporcao)}%`
  const [desativados, deixarao] = desativar === 1
    ? ['será desativado', 'deixará']
    : ['serão desativados', 'deixarão']
  const base =
    `${formatarNumero(desativar)} de ${formatarNumero(ativos)} postos ativos ${desativados} ` +
    `(${percentual}) e ${deixarao} de aparecer no mapa.`

  if (proporcao >= 50) {
    return {
      tipo: 'error',
      texto: `${base} A proporção é alta: confira se a planilha está completa antes de confirmar.`,
    }
  }
  return { tipo: 'warning', texto: base }
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

const gruposOcorrencias = computed(() => {
  const p = previa.value
  if (!p) return []
  return [
    { chave: 'erros', titulo: 'Erros', itens: p.erros ?? [] },
    { chave: 'avisos', titulo: 'Avisos', itens: p.avisos ?? [] },
  ].filter((grupo) => grupo.itens.length > 0)
})

const haDetalhes = computed(
  () => gruposItens.value.length > 0 || gruposOcorrencias.value.length > 0,
)

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

async function analisar() {
  const erro = validarArquivo(arquivo.value)
  if (erro) {
    erroArquivo.value = erro
    return
  }

  erroApi.value = ''
  analisando.value = true
  const requisicao = ++requisicaoAtual

  try {
    const { data } = await previewImport(arquivo.value)
    if (requisicao !== requisicaoAtual) return
    previa.value = data
    etapa.value = 'previa'
  } catch (err) {
    if (requisicao !== requisicaoAtual) return
    erroApi.value = mensagemDeErro(err)
  } finally {
    if (requisicao === requisicaoAtual) analisando.value = false
  }
}

function limpar() {
  requisicaoAtual++
  etapa.value = 'selecao'
  selecao.value = null
  arquivo.value = null
  erroArquivo.value = ''
  erroApi.value = ''
  analisando.value = false
  previa.value = null
}

function trocarArquivo() {
  limpar()
}

function cancelar() {
  limpar()
  emit('update:modelValue', false)
}

// Cada abertura começa do zero.
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) limpar()
  },
)
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

/* Contadores */
.contadores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
}

.contador {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.contador-valor {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.contador-rotulo {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.contador--alerta {
  border-color: var(--color-warning);
}

.contador--alerta .contador-valor {
  color: var(--color-warning);
}

.contador--erro {
  border-color: rgb(var(--v-theme-error));
}

.contador--erro .contador-valor {
  color: rgb(var(--v-theme-error));
}

/* Painéis */
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

.linha-mensagem {
  font-size: 0.8125rem;
  color: var(--color-text);
}
</style>
