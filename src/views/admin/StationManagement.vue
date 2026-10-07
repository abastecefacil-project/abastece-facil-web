<template>
  <div class="postos-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Postos</h1>
        <p class="page-subtitle">Gerenciar postos de combustível</p>
      </div>
    </div>

    <!-- Base inteira: busca, filtro e paginação não alteram estes números. -->
    <IndicadoresPostos
      :total="indicadores.total"
      :ativos="indicadores.ativos"
      :inativos="indicadores.inativos"
      :carregando="carregandoIndicadores"
    />

    <!-- Barra de Pesquisa, Filtros e Novo Posto -->
    <SearchFilterBar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      search-label="Pesquisar postos..."
      :filter-options="[
        { label: 'Todos', value: 'todos' },
        { label: 'Ativos', value: 'ativo' },
        { label: 'Inativos', value: 'inativo' },
      ]"
      action-label="NOVO POSTO"
      action-icon="mdi-plus"
      @action="openDialog"
    >
      <!-- Conveniência de tela: quem autoriza a importação é o backend
           (403 PERFIL_NAO_PERMITIDO para quem não é administrador). -->
      <template v-if="isAdministrador" #acoes-extras>
        <!-- Em andamento continua clicável: o dialog retoma o progresso sozinho. -->
        <v-btn
          variant="outlined"
          color="primary"
          size="large"
          rounded="lg"
          class="importar-btn"
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
      </template>
    </SearchFilterBar>

    <!-- Lista de Postos em Cards -->
    <div class="postos-grid">
      <v-row>
        <v-col v-for="posto in postos" :key="posto.id" cols="12" md="6" lg="6" xl="4">
          <PostoCard :posto="posto" @edit="editarPosto" @delete="abrirModalExclusao" />
        </v-col>
      </v-row>
    </div>

    <!-- Mensagem quando não há resultados -->
    <div v-if="postos.length === 0" class="empty-state">
      <div class="empty-state-content">
        <v-icon icon="mdi-gas-station-off" size="64" class="empty-icon"></v-icon>
        <h3 class="empty-title">
          {{ searchQuery ? 'Nenhum posto encontrado' : 'Nenhum posto cadastrado' }}
        </h3>
        <p class="empty-subtitle">
          {{
            searchQuery
              ? 'Tente ajustar os filtros de pesquisa'
              : 'Clique em "NOVO POSTO" para adicionar o primeiro posto'
          }}
        </p>
      </div>
    </div>

    <!-- Dialog para Adicionar/Editar Posto -->
    <PostoDialog
      v-model="dialog"
      :is-editing="isEditing"
      :posto="formPosto"
      @save="salvarPosto"
      @close="closeDialog"
    />
    <ConfirmDialog
      v-model="modalExclusao"
      @confirm="confirmarExclusao"
    />
    <ImportacaoPostosDialog
      v-if="isAdministrador"
      v-model="dialogImportacao"
      @importacao-em-andamento="importacaoEmAndamento = true"
      @importacao-finalizada="aoFinalizarImportacaoPeloDialog"
    />
  </div>

  <PaginationBar
    v-model="currentPageUi"
    :length="totalPages"
    @update:modelValue="(page) => loadingStations(page - 1)"
  />

  <Footer />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import PostoCard from '../../components/admin/PostoCard.vue'
import PostoDialog from '../../components/admin/PostoDialog.vue'
import SearchFilterBar from '../../components/app/SearchFilterBar.vue'
import Footer from '@/components/app/Footer.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import {
  getStations,
  deleteStation,
  countStations,
  getCurrentImport,
} from '@/services/stationService'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import { lerHorarioFuncionamento } from '@/utils/posto'
import ImportacaoPostosDialog from '@/components/admin/ImportacaoPostosDialog.vue'
import IndicadoresPostos from '@/components/admin/IndicadoresPostos.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Importar planilha é só para ADMINISTRADOR; o gestor de frota vê o resto da
// tela normalmente. Mesmo critério do UserDialog.
const isAdministrador = computed(() => authStore.perfil === 'ADMINISTRADOR')

// Estados reativos
const dialog = ref(false)
const dialogImportacao = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const postos = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const currentPageUi = ref(1)
const modalExclusao = ref(false)
const postoParaExcluir = ref(null)

// null = sem número ainda (skeleton) ou consulta que falhou ("—").
const indicadores = ref({ total: null, ativos: null, inativos: null })
const carregandoIndicadores = ref(false)
// Duas recargas sobrepostas (excluir e logo em seguida fim de importação, por
// exemplo): só a resposta da mais recente vale.
let consultaIndicadores = 0

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
  try {
    const search = searchQuery.value || undefined
    let active

    if (statusFilter.value === 'ativo') active = true
    else if (statusFilter.value === 'inativo') active = false
    else active = undefined

    const response = await getStations(page, search, active)
    const data = response.data

    postos.value = response.data.content.map((posto) => {
      const horario = lerHorarioFuncionamento(posto.businessHours)
      return {
        id: posto.id,
        name: posto.name,
        fantasyName: posto.fantasyName,
        completeAddress: `${posto.address} - ${posto.district}, ${posto.city} - ${posto.state}`,
        phone: posto.phone,
        cnpj: posto.cnpj,
        cep: posto.cep,
        district: posto.district,
        city: posto.city,
        state: posto.state,
        address: posto.address.split(',')[0],
        number: posto.address.split(',')[1]?.trim() || '',
        status: posto.isActive,
        businessHours: posto.businessHours,
        openTime: horario?.abertura ?? '',
        closeTime: horario?.fechamento ?? '',
      }
    })
    currentPage.value = data.number
    totalPages.value = data.totalPages

  } catch (err) {
    console.log('Erro ao buscar postos', err)
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

const formPosto = ref({
  id: null,
  name: '',
  cnpj: '',
  cep: '',
  city: '',
  state: '',
  address: '',
  number: '',
  phone: '',
  status: '',
  openTime: '',
  closeTime: '',
})

// Funções
const openDialog = () => {
  isEditing.value = false
  resetForm()
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formPosto.value = {
    id: null,
    name: '',
    cnpj: '',
    cep: '',
    city: '',
    state: '',
    address: '',
    number: '',
    phone: '',
    status: '',
    openTime: '',
    closeTime: '',
  }
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
  }
}

const deletarPosto = async (id) => {
  abrirModalExclusao(id)
}

onMounted(() => {
  loadingStations()
  carregarIndicadores()
  // GESTOR_FROTA não vê o botão nem dispara a consulta (verificarImportacao
  // confere o perfil antes de qualquer requisição).
  verificarImportacao()
})

onUnmounted(suspenderConsultaImportacao)
</script>

<style scoped>
.postos-container {
  padding: 24px;
  background-color: #fafafa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #424242;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1rem;
  color: #757575;
  margin: 0;
  font-weight: 400;
}

.postos-grid {
  margin-top: 8px;
}

/* Botão passado pelo slot acoes-extras do SearchFilterBar: o conteúdo do slot
   carrega o data-v desta view, então o estilo scoped daqui o alcança. Mesma
   altura e tipografia do botão principal (.new-item-btn). */
.importar-btn {
  flex-shrink: 0;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  height: 46px;
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

/* Até 1280px a barra ainda fica numa linha só com o menu lateral aberto, e o
   texto longo apertaria a busca e o "Novo posto". */
@media (max-width: 1280px) {
  .importar-rotulo-longo {
    display: none;
  }

  .importar-rotulo-curto {
    display: inline;
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 24px;
  min-height: 300px;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  color: #bdbdbd;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #616161;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.empty-subtitle {
  font-size: 0.95rem;
  color: #9e9e9e;
  margin: 0;
  line-height: 1.4;
}

/* Responsividade */
@media (max-width: 1200px) {
  .postos-container {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .postos-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-subtitle {
    font-size: 0.95rem;
  }

  .empty-state {
    padding: 48px 16px;
    min-height: 250px;
  }

  .empty-title {
    font-size: 1.1rem;
  }

  .empty-subtitle {
    font-size: 0.9rem;
  }
}


@media (max-width: 480px) {
  .postos-container {
    padding: 12px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .empty-state {
    padding: 32px 12px;
  }
}
</style>