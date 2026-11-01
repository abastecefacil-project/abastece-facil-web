<template>
  <div class="postos-container">
    <PageHeader titulo="Postos" subtitulo="Gerenciar postos de combustível">
      <template #acoes>
        <!-- Conveniência de tela: quem autoriza a importação é o backend
             (403 PERFIL_NAO_PERMITIDO para quem não é administrador).
             Em andamento continua clicável: o dialog retoma o progresso sozinho. -->
        <v-btn
          v-if="isAdministrador"
          variant="outlined"
          class="btn-secundario"
          :title="importacaoEmAndamento ? ROTULO_IMPORTANDO : undefined"
          @click="dialogImportacao = true"
        >
          <template #prepend>
            <v-progress-circular v-if="importacaoEmAndamento" indeterminate size="18" width="2" />
            <v-icon v-else icon="mdi-file-upload-outline" />
          </template>
          <!-- "Importar planilha" fica sempre na mesma célula do grid, invisível,
               para o botão nunca ficar mais estreito que o original. -->
          <span class="importar-rotulo">
            <span class="importar-rotulo-referencia" aria-hidden="true">Importar planilha</span>
            <span v-if="!importacaoEmAndamento">Importar planilha</span>
            <template v-else>
              <span class="importar-rotulo-longo">{{ ROTULO_IMPORTANDO }}</span>
              <span class="importar-rotulo-curto">Importando…</span>
            </template>
          </span>
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="guardarOrigem($event); openDialog()">Novo posto</v-btn>
      </template>
    </PageHeader>

    <v-alert
      v-if="erroNotificacao"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="erroNotificacao = ''"
    >{{ erroNotificacao }}</v-alert>

    <section class="tabela-postos" aria-label="Lista de postos">
      <div class="tabela-toolbar">
        <v-text-field
          ref="campoBusca"
          v-model="searchQuery"
          label="Buscar postos"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          hide-details
          class="tabela-busca"
        />

        <!-- Contagens da base inteira: busca e paginação não as alteram. -->
        <v-btn-toggle
          v-model="statusFilter"
          mandatory
          variant="text"
          density="compact"
          class="segmentado"
          aria-label="Filtrar postos por status"
        >
          <v-btn v-for="opcao in opcoesStatus" :key="opcao.valor" :value="opcao.valor">
            {{ opcao.rotulo }}
            <span v-if="opcao.contagem" class="segmentado__contagem">{{ opcao.contagem }}</span>
          </v-btn>
        </v-btn-toggle>
      </div>

      <div v-if="erroCarregamento && !loading" class="tabela-erro" role="alert">
        <v-icon icon="mdi-alert-circle-outline" size="40" class="tabela-erro__icone" />
        <p class="tabela-erro__titulo">Não foi possível carregar os postos</p>
        <p class="tabela-erro__texto">Verifique a conexão e tente novamente.</p>
        <v-btn variant="outlined" class="btn-secundario mt-4" @click="loadingStations(currentPage)">
          Tentar novamente
        </v-btn>
      </div>

      <EmptyState
        v-else-if="!loading && postos.length === 0"
        icone="mdi-gas-station-off-outline"
        :titulo="filtrando ? 'Nenhum posto encontrado' : 'Nenhum posto cadastrado'"
        :texto="filtrando ? 'Ajuste a busca ou o filtro de status.' : 'Use o botão Novo posto para cadastrar o primeiro.'"
      />

      <table v-else class="tabela" :aria-busy="loading">
        <thead>
          <tr>
            <th scope="col">Posto</th>
            <th scope="col" class="col-endereco">Endereço</th>
            <th scope="col">Telefone</th>
            <th scope="col">Horário</th>
            <th scope="col">Status</th>
            <th scope="col" class="col-acoes">Ações</th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr v-for="n in LINHAS_ESQUELETO" :key="n" class="linha-esqueleto" aria-hidden="true">
            <td class="col-posto">
              <span class="esqueleto esqueleto--titulo" />
              <span class="esqueleto esqueleto--meta" />
            </td>
            <td class="col-endereco"><span class="esqueleto" /></td>
            <td class="col-telefone"><span class="esqueleto esqueleto--curto" /></td>
            <td class="col-horario"><span class="esqueleto esqueleto--curto" /></td>
            <td class="col-status"><span class="esqueleto esqueleto--chip" /></td>
            <td class="col-acoes" />
          </tr>
        </tbody>

        <tbody v-else>
          <tr v-for="linha in linhas" :key="linha.posto.id">
            <td class="col-posto">
              <span class="posto-nome">{{ linha.nome }}</span>
              <span class="posto-local">{{ linha.cidadeUf }}</span>
              <!-- Abaixo de 1280px a coluna Endereço some e o endereço vem para cá. -->
              <span class="posto-local posto-local--compacto">
                {{ linha.enderecoCompleto }}
                <v-tooltip activator="parent" location="top" :text="linha.enderecoCompleto" />
              </span>
            </td>
            <td class="col-endereco">
              <span class="truncado">
                {{ linha.endereco }}
                <v-tooltip activator="parent" location="top" :text="linha.enderecoCompleto" />
              </span>
            </td>
            <td class="col-telefone">
              <span v-if="linha.telefone" class="tabular">{{ linha.telefone }}</span>
              <span v-else class="horario-nao-informado">{{ TELEFONE_NAO_INFORMADO }}</span>
            </td>
            <td class="col-horario">
              <span v-if="linha.horario" class="tabular">{{ linha.horario }}</span>
              <span v-else class="horario-nao-informado">{{ HORARIO_NAO_INFORMADO }}</span>
            </td>
            <td class="col-status">
              <StatusChip :status="linha.posto.status ? 'ativo' : 'inativo'" />
            </td>
            <td class="col-acoes">
              <v-btn
                variant="text"
                size="small"
                density="compact"
                icon
                class="acao"
                :data-origem="`editar-${linha.posto.id}`"
                :aria-label="`Editar posto ${linha.nome}`"
                @click="guardarOrigem($event); editarPosto(linha.posto)"
              >
                <v-icon icon="mdi-pencil-outline" size="20" />
                <v-tooltip activator="parent" location="top" text="Editar" />
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                density="compact"
                icon
                class="acao acao--perigo"
                :data-origem="`excluir-${linha.posto.id}`"
                :aria-label="`Excluir posto ${linha.nome}`"
                @click="guardarOrigem($event); abrirModalExclusao(linha.posto.id)"
              >
                <v-icon icon="mdi-trash-can-outline" size="20" />
                <v-tooltip activator="parent" location="top" text="Excluir" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!erroCarregamento && postos.length > 0" class="tabela-rodape">
        <PaginationBar
          v-model="currentPageUi"
          :length="totalPages"
          :total="totalElements"
          :por-pagina="pageSize"
          @update:modelValue="(page) => loadingStations(page - 1)"
        />
      </div>
    </section>

    <!-- Dialog para Adicionar/Editar Posto. Os dois devolvem o foco ao botão
         que os abriu (aoFecharDialogo); o PostoDialog emite `fechado` porque
         tem mais de uma raiz e não repassa o after-leave. -->
    <PostoDialog
      v-model="dialog"
      :is-editing="isEditing"
      :posto="formPosto"
      @save="salvarPosto"
      @close="closeDialog"
      @fechado="aoFecharDialogo"
    />
    <ConfirmDialog
      v-model="modalExclusao"
      :objeto="objetoExclusao"
      @confirm="confirmarExclusao"
      @after-leave="aoFecharDialogo"
    />
    <BaseStatusModal
      v-model="modalErroExclusao"
      type="error"
      title="Erro ao excluir"
      :message="mensagemErroExclusaoAtual"
      @after-leave="aoFecharDialogo"
    />
    <ImportacaoPostosDialog
      v-if="isAdministrador"
      v-model="dialogImportacao"
      @importacao-em-andamento="importacaoEmAndamento = true"
      @importacao-finalizada="aoFinalizarImportacaoPeloDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import PostoDialog from '../../components/admin/PostoDialog.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import StatusChip from '@/components/app/StatusChip.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import {
  getStations,
  getStationById,
  deleteStation,
  countStations,
  getCurrentImport,
} from '@/services/stationService'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import BaseStatusModal from '@/components/app/BaseStatusModal.vue'
import { mensagemErroExclusao } from '@/utils/exclusao'
import {
  HORARIO_NAO_INFORMADO,
  nomeExibicaoPosto,
  postoVazio,
  prepararPostoParaEdicao,
} from '@/utils/posto'
import { TELEFONE_NAO_INFORMADO, nomeProprio } from '@/utils/formatacao'
import { apresentacaoLinhaPosto } from '@/utils/postoExibicao'
import { formatarNumero } from '@/utils/importacaoPostos'
import { devolverFoco, elementoDeOrigem } from '@/utils/foco'
import { useRoute, useRouter } from 'vue-router'
import ImportacaoPostosDialog from '@/components/admin/ImportacaoPostosDialog.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const erroNotificacao = ref('')

// Importar planilha é só para ADMINISTRADOR; o gestor de frota vê o resto da
// tela normalmente. Mesmo critério do UserDialog.
const isAdministrador = computed(() => authStore.perfil === 'ADMINISTRADOR')

// Mesma quantidade da página do backend (size 10), para a tabela não mudar de
// altura quando os dados chegam.
const LINHAS_ESQUELETO = 10

// Estados reativos
const dialog = ref(false)
const dialogImportacao = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const postos = ref([])
const loading = ref(false)
const erroCarregamento = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(null)
const pageSize = ref(null)
const currentPageUi = ref(1)
const modalExclusao = ref(false)
const modalErroExclusao = ref(false)
const mensagemErroExclusaoAtual = ref('')
const postoParaExcluir = ref(null)

const filtrando = computed(() => !!searchQuery.value || statusFilter.value !== 'todos')

// null = sem número ainda (carregando) ou consulta que falhou ("—").
const indicadores = ref({ total: null, ativos: null, inativos: null })
const carregandoIndicadores = ref(false)
// Duas recargas sobrepostas (excluir e logo em seguida fim de importação, por
// exemplo): só a resposta da mais recente vale.
let consultaIndicadores = 0

// Segmentado de status. Sem número ainda, o botão mostra só o rótulo; com a
// consulta falha, "—".
const opcoesStatus = computed(() =>
  [
    { valor: 'todos', rotulo: 'Todos', numero: indicadores.value.total },
    { valor: 'ativo', rotulo: 'Ativos', numero: indicadores.value.ativos },
    { valor: 'inativo', rotulo: 'Inativos', numero: indicadores.value.inativos },
  ].map((opcao) => {
    let contagem = ''
    if (opcao.numero !== null) contagem = formatarNumero(opcao.numero)
    else if (!carregandoIndicadores.value) contagem = '—'
    return { ...opcao, contagem }
  }),
)

// Só apresentação: nome, endereço e cidade em caixa alta (postos importados)
// viram Title Case, telefone e horário ganham formato legível. O posto original
// segue intacto para o PostoDialog.
// A montagem é a mesma da lista do colaborador (utils/postoExibicao.js).
const linhas = computed(() =>
  postos.value.map((posto) => ({ posto, ...apresentacaoLinhaPosto(posto) })),
)

watch(currentPage, (newVal) => {
  currentPageUi.value = newVal + 1
})

watchDebounced(
  [searchQuery, statusFilter],
  () => {
    loadingStations(0)
  },
  { debounce: 400 },
)

//GET- Busca postos
async function loadingStations(page = 0) {
  loading.value = true
  erroCarregamento.value = false
  try {
    const search = searchQuery.value || undefined
    let active

    if (statusFilter.value === 'ativo') active = true
    else if (statusFilter.value === 'inativo') active = false
    else active = undefined

    const response = await getStations(page, search, active)
    const data = response.data

    postos.value = response.data.content.map(prepararPostoParaEdicao)
    currentPage.value = data.number
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    pageSize.value = data.size

  } catch (err) {
    console.log('Erro ao buscar postos', err)
    erroCarregamento.value = true
  } finally {
    loading.value = false
  }
}

// Recarregado só quando os dados mudam (criar, editar, excluir, importar), nunca
// por busca ou paginação. is_active é NOT NULL, então ativos + inativos é o
// total exato. Numa recarga os números antigos ficam até os novos chegarem.
async function carregarIndicadores() {
  const consulta = ++consultaIndicadores
  carregandoIndicadores.value = true

  const [ativos, inativos] = await Promise.allSettled([countStations(true), countStations(false)])
  if (consulta !== consultaIndicadores) return

  const valor = (resultado) => (resultado.status === 'fulfilled' ? resultado.value : null)
  const qtdAtivos = valor(ativos)
  const qtdInativos = valor(inativos)
  indicadores.value = {
    ativos: qtdAtivos,
    inativos: qtdInativos,
    total: qtdAtivos !== null && qtdInativos !== null ? qtdAtivos + qtdInativos : null,
  }
  carregandoIndicadores.value = false
}

function aoFinalizarImportacao() {
  loadingStations(0)
  carregarIndicadores()
}

// === Importação em andamento, com o dialog fechado ===
// Só para ADMINISTRADOR, e só enquanto houver importação: sem ela, nenhum timer
// existe. Com o dialog aberto, quem consulta é ele; a tela suspende a própria
// consulta e se sincroniza pelos eventos importacao-em-andamento e
// importacao-finalizada.
const ROTULO_IMPORTANDO = 'Realizando importação da planilha'
const INTERVALO_IMPORTACAO_MS = 10000

const importacaoEmAndamento = ref(false)
let timerImportacao = null
// Mesmo papel do requisicaoAtual do dialog: resposta com número antigo pertence
// a uma consulta suspensa (dialog aberto, tela desmontada) e é descartada.
let consultaImportacao = 0

function suspenderConsultaImportacao() {
  consultaImportacao++
  if (timerImportacao !== null) {
    clearTimeout(timerImportacao)
    timerImportacao = null
  }
}

// setTimeout encadeado, nunca setInterval: a próxima só é agendada depois da
// resposta da anterior.
function agendarConsultaImportacao() {
  suspenderConsultaImportacao()
  timerImportacao = setTimeout(verificarImportacao, INTERVALO_IMPORTACAO_MS)
}

async function verificarImportacao() {
  timerImportacao = null
  if (!isAdministrador.value || dialogImportacao.value) return
  const consulta = ++consultaImportacao

  try {
    const atual = await getCurrentImport()
    if (consulta !== consultaImportacao) return

    if (atual?.status === 'EM_ANDAMENTO') {
      importacaoEmAndamento.value = true
      agendarConsultaImportacao()
    } else if (importacaoEmAndamento.value) {
      // Só a transição recarrega: a montagem sem importação não faz nada, e um
      // desfecho já recebido do dialog deixou o estado em false.
      importacaoEmAndamento.value = false
      aoFinalizarImportacao()
    }
  } catch (err) {
    if (consulta !== consultaImportacao) return
    // Sessão expirada não se resolve tentando de novo.
    if (err?.response?.status === 403) return
    // Falha isolada (rede, 5xx): o estado não muda, tenta no próximo ciclo.
    if (importacaoEmAndamento.value) agendarConsultaImportacao()
  }
}

function aoFinalizarImportacaoPeloDialog() {
  importacaoEmAndamento.value = false
  aoFinalizarImportacao()
}

// Aberto: só o dialog consulta. Fechado com importação em andamento: consulta na
// hora, porque ela pode ter terminado enquanto o dialog estava aberto sem que
// ele emitisse nada (abriu já sem importação e foi direto para a seleção).
watch(dialogImportacao, (aberto) => {
  if (aberto) suspenderConsultaImportacao()
  else if (importacaoEmAndamento.value) verificarImportacao()
})

const formPosto = ref(postoVazio())

// === Foco devolvido ao fechar diálogos ===
// Os diálogos não têm activator, e sem isso o foco cairia no <body>. A origem
// sobrevive à cadeia formulário → modal de sucesso: só é descartada quando o
// último fecha. Aberto pela notificação (?posto=), não há origem, e o foco fica
// onde o Vuetify o deixar.
const campoBusca = ref(null)
let origemFoco = null

function guardarOrigem(evento) {
  origemFoco = elementoDeOrigem(evento)
}

function aoFecharDialogo() {
  const resultado = devolverFoco(origemFoco, {
    // Posto excluído sai da lista junto com o botão: o foco vai para a busca.
    alternativas: [campoBusca.value?.$el?.querySelector('input')],
  })
  if (resultado !== 'aguardando') origemFoco = null
}

// Funções
const openDialog = () => {
  isEditing.value = false
  resetForm()
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  resetForm()
  if (route.query.posto) router.replace({ query: { ...route.query, posto: undefined } })
}

const resetForm = () => {
  formPosto.value = postoVazio()
}

const editarPosto = (posto) => {
  isEditing.value = true
  formPosto.value = { ...posto }
  dialog.value = true
}

const salvarPosto = async () => {
  try {
    carregarIndicadores()
    await loadingStations()
    closeDialog()
  } catch (err) {
    console.error('Erro ao salvar posto:', err)
  }
}

// Funções da Modal de Exclusão
const abrirModalExclusao = (id) => {
  postoParaExcluir.value = id
  modalExclusao.value = true
}

// "Excluir o posto Posto Delta?": a confirmação nomeia o que vai ser apagado,
// com o mesmo nome exibido na tabela.
const objetoExclusao = computed(() => {
  const posto = postos.value.find((item) => item.id === postoParaExcluir.value)
  return posto ? `o posto ${nomeProprio(nomeExibicaoPosto(posto))}` : ''
})

const fecharModalExclusao = () => {
  modalExclusao.value = false
  postoParaExcluir.value = null
}

const confirmarExclusao = async () => {
  try {
    await deleteStation(postoParaExcluir.value)
    carregarIndicadores()
    await loadingStations()
    fecharModalExclusao()
  } catch (err) {
    console.error('Erro ao deletar posto:', err)
    // O erro abre antes de a confirmação fechar: no after-leave dela o modal
    // de erro já está ativo, e o foco só volta ao botão quando ele fechar.
    mensagemErroExclusaoAtual.value = mensagemErroExclusao(err)
    modalErroExclusao.value = true
    fecharModalExclusao()
  }
}

onMounted(() => {
  loadingStations()
  carregarIndicadores()
  // GESTOR_FROTA não vê o botão nem dispara a consulta (verificarImportacao
  // confere o perfil antes de qualquer requisição).
  verificarImportacao()
})

onUnmounted(suspenderConsultaImportacao)

watch(() => route.query.posto, async (id) => {
  if (!id) return
  erroNotificacao.value = ''
  try {
    const { data } = await getStationById(id)
    if (id === route.query.posto) editarPosto(prepararPostoParaEdicao(data))
  } catch {
    if (id === route.query.posto) erroNotificacao.value = 'Não foi possível abrir o posto da notificação. Tente novamente.'
  }
}, { immediate: true })
</script>

<style scoped>
.postos-container {
  max-width: 1440px;
  padding: var(--space-8);
}

/* Botão secundário (REDESIGN §4.6): contornado, borda neutral-300, texto
   neutral-800. A classe dobrada vence o outlined do Vuetify, que herdaria a
   cor do texto na borda. */
.v-btn.btn-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}

/* Rótulos empilhados na mesma célula: a largura é a do maior, e a referência
   invisível garante no mínimo a do botão original. */
.importar-rotulo {
  display: inline-grid;
}

.importar-rotulo > span {
  grid-area: 1 / 1;
  text-align: center;
}

.importar-rotulo-referencia {
  visibility: hidden;
}

.importar-rotulo-curto {
  display: none;
}

/* Até 1280px o texto longo apertaria o "Novo posto" ao lado. */
@media (max-width: 1280px) {
  .importar-rotulo-longo {
    display: none;
  }

  .importar-rotulo-curto {
    display: inline;
  }
}

/* ── container da tabela ─────────────────────────────────────────────────── */

.tabela-postos {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tabela-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.tabela-busca {
  flex: 1 1 240px;
  max-width: 360px;
}

/* Segmentado: o contorno é do grupo, e as divisórias ficam entre os botões.
   Com variant outlined, cada botão desenhava a própria borda e o raio do grupo
   cortava a da ponta. O selecionado ganha o fundo blue-50 e o texto primary,
   sem o preenchimento cheio do Vuetify. */
.segmentado {
  flex-shrink: 0;
  height: 40px;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
}

.segmentado :deep(.v-btn) {
  height: 38px !important;
  padding-inline: var(--space-3);
  color: var(--color-text-muted);
  border-radius: 0 !important;
}

.segmentado :deep(.v-btn + .v-btn) {
  border-inline-start: 1px solid var(--color-neutral-300);
}

.segmentado :deep(.v-btn--active) {
  background-color: var(--color-blue-50);
  color: var(--color-primary);
}

.segmentado :deep(.v-btn.v-btn--active > .v-btn__overlay) {
  opacity: 0;
}

.segmentado__contagem {
  margin-left: var(--space-2);
  color: var(--color-neutral-500);
  font-variant-numeric: tabular-nums;
}

.segmentado :deep(.v-btn--active) .segmentado__contagem {
  color: inherit;
}

/* ── tabela ──────────────────────────────────────────────────────────────── */

.tabela {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.tabela th {
  height: 40px;
  padding: 0 var(--space-4);
  background: var(--color-neutral-50);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.tabela td {
  height: 52px;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  vertical-align: middle;
}

.tabela tbody tr:last-child td {
  border-bottom: none;
}

.tabela tbody tr:not(.linha-esqueleto):hover td {
  background: var(--color-neutral-50);
}

.tabela th:nth-child(1) { width: 25%; }
.tabela th:nth-child(3) { width: 150px; }
.tabela th:nth-child(4) { width: 170px; }
.tabela th:nth-child(5) { width: 104px; }
.tabela th.col-acoes { width: 104px; }

.col-acoes {
  text-align: right !important;
  white-space: nowrap;
}

.col-posto {
  min-width: 0;
}

.posto-nome,
.posto-local,
.truncado {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.posto-nome {
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
}

.posto-local {
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.posto-local--compacto {
  display: none;
}

.tabular {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.col-telefone,
.col-horario {
  white-space: nowrap;
}

/* Botões de ícone de 32px (size small + density compact). */
.acao {
  color: var(--color-text-muted);
}

.acao:hover {
  color: var(--color-text);
}

.acao--perigo:hover {
  color: var(--color-error);
}

/* Esqueleto de linha: blocos estáticos, sem animação (§4.4). */
.esqueleto {
  display: block;
  height: 12px;
  width: 80%;
  border-radius: var(--radius-sm);
  background: var(--color-neutral-100);
}

.esqueleto--titulo {
  height: 14px;
  width: 70%;
  margin-bottom: 6px;
}

.esqueleto--meta {
  width: 40%;
}

.esqueleto--curto {
  width: 96px;
}

.esqueleto--chip {
  width: 56px;
  height: 20px;
}

/* ── estados e rodapé ────────────────────────────────────────────────────── */

.tabela-erro {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.tabela-erro p {
  margin: 0;
}

.tabela-erro__icone {
  color: var(--color-error-icon);
  margin-bottom: var(--space-3);
}

.tabela-erro__titulo {
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-text);
}

.tabela-erro__texto {
  margin-top: var(--space-1) !important;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

.tabela-rodape {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.tabela-rodape :deep(.pagination-bar) {
  padding: 0;
}

/* ── responsividade ──────────────────────────────────────────────────────── */

/* Com o menu aberto, 1024px deixa ~700px de conteúdo: a coluna Endereço sai e
   o endereço vira a segunda linha da célula Posto. */
@media (max-width: 1279px) {
  .col-endereco {
    display: none;
  }

  .tabela th,
  .tabela td {
    padding-inline: var(--space-3);
  }

  .tabela th:nth-child(1) { width: auto; }
  .tabela th:nth-child(3) { width: 136px; }
  .tabela th:nth-child(4) { width: 168px; }
  .tabela th:nth-child(5) { width: 88px; }
  .tabela th.col-acoes { width: 88px; }

  .posto-local {
    display: none;
  }

  .posto-local--compacto {
    display: block;
  }
}

@media (max-width: 959px) {
  .postos-container {
    padding: var(--space-4);
  }
}

/* Celular: cada linha vira um bloco empilhado, sem rolagem horizontal. */
@media (max-width: 599px) {
  .tabela-busca {
    max-width: none;
    flex-basis: 100%;
  }

  .segmentado {
    width: 100%;
    flex-shrink: 1;
  }

  .segmentado :deep(.v-btn) {
    flex: 1 1 0;
    padding-inline: var(--space-1);
  }

  .tabela,
  .tabela tbody {
    display: block;
  }

  .tabela thead {
    display: none;
  }

  .tabela tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'posto status'
      'telefone acoes'
      'horario acoes';
    column-gap: var(--space-3);
    row-gap: 2px;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .tabela tbody tr:last-child {
    border-bottom: none;
  }

  .tabela td {
    height: auto;
    padding: 0;
    border-bottom: none;
    background: none !important;
  }

  .tabela .col-posto { grid-area: posto; margin-bottom: var(--space-1); }
  .tabela .col-status { grid-area: status; }
  .tabela .col-telefone { grid-area: telefone; font-size: var(--text-body-sm-size); }
  .tabela .col-horario { grid-area: horario; font-size: var(--text-body-sm-size); }
  .tabela .col-acoes { grid-area: acoes; align-self: end; }

  .tabela tbody tr.linha-esqueleto .col-acoes {
    display: none;
  }
}
</style>
