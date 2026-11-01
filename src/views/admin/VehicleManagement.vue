<template>
  <div class="veiculos-container">
    <PageHeader titulo="Veículos" subtitulo="Gerenciar veículos cadastrados">
      <template #acoes>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="guardarOrigem($event); openDialog()">
          Novo veículo
        </v-btn>
      </template>
    </PageHeader>

    <section class="tabela-veiculos" aria-label="Lista de veículos">
      <div class="tabela-toolbar">
        <v-text-field
          ref="campoBusca"
          v-model="searchQuery"
          label="Buscar por placa ou modelo"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          hide-details
          class="tabela-busca"
        />

        <!-- Sem contagem: não há endpoint de contagem de veículos, e contar
             exigiria duas consultas extras só para ler o totalElements. -->
        <v-btn-toggle
          v-model="statusFilter"
          mandatory
          variant="text"
          density="compact"
          class="segmentado"
          aria-label="Filtrar veículos por status"
        >
          <v-btn v-for="opcao in OPCOES_STATUS" :key="opcao.valor" :value="opcao.valor">
            {{ opcao.rotulo }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <p class="sr-only" role="status">{{ descricaoFiltro }}</p>

      <div v-if="erroCarregamento && !loading" class="tabela-erro" role="alert">
        <v-icon icon="mdi-alert-circle-outline" size="40" class="tabela-erro__icone" />
        <p class="tabela-erro__titulo">Não foi possível carregar os veículos</p>
        <p class="tabela-erro__texto">Verifique a conexão e tente novamente.</p>
        <v-btn variant="outlined" class="btn-secundario mt-4" @click="loadingCars(currentPage)">
          Tentar novamente
        </v-btn>
      </div>

      <EmptyState
        v-else-if="!loading && vehicles.length === 0"
        icone="mdi-car-off"
        :titulo="filtrando ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'"
        :texto="filtrando ? 'Ajuste a busca ou o filtro de status.' : TEXTO_SEM_VEICULOS"
      />

      <table v-else class="tabela" :aria-busy="loading">
        <thead>
          <tr>
            <th scope="col" class="col-placa">Placa</th>
            <th scope="col" class="col-modelo">Modelo</th>
            <th scope="col" class="col-status">Status</th>
            <th scope="col" class="col-acoes">Ações</th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr v-for="n in linhasEsqueleto" :key="n" class="linha-esqueleto" aria-hidden="true">
            <td class="col-placa"><span class="esqueleto esqueleto--placa" /></td>
            <td class="col-modelo"><span class="esqueleto esqueleto--titulo" /></td>
            <td class="col-status"><span class="esqueleto esqueleto--chip" /></td>
            <td class="col-acoes" />
          </tr>
        </tbody>

        <tbody v-else>
          <tr v-for="veiculo in vehicles" :key="veiculo.id">
            <td class="col-placa">
              <PlateBadge v-if="veiculo.plate" :placa="veiculo.plate" />
            </td>
            <td class="col-modelo">
              <span class="truncado">{{ veiculo.model }}</span>
            </td>
            <td class="col-status">
              <StatusChip :status="veiculo.status ? 'ativo' : 'inativo'" />
            </td>
            <td class="col-acoes">
              <v-btn
                variant="text"
                size="small"
                density="compact"
                icon
                class="acao"
                :data-origem="`editar-${veiculo.id}`"
                :aria-label="`Editar veículo ${veiculo.plate}`"
                @click="guardarOrigem($event); editarVeiculo(veiculo)"
              >
                <v-icon icon="mdi-pencil-outline" size="20" />
                <v-tooltip activator="parent" location="top" text="Editar" />
              </v-btn>
              <!-- A exclusão é física (CarService.deleteCar) e vale para veículo
                   ativo ou inativo. -->
              <v-btn
                variant="text"
                size="small"
                density="compact"
                icon
                class="acao acao--perigo"
                :data-origem="`excluir-${veiculo.id}`"
                :aria-label="`Excluir veículo ${veiculo.plate}`"
                @click="guardarOrigem($event); abrirModalExclusao(veiculo.id)"
              >
                <v-icon icon="mdi-delete-outline" size="20" />
                <v-tooltip activator="parent" location="top" text="Excluir" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!erroCarregamento && vehicles.length > 0" class="tabela-rodape">
        <PaginationBar
          v-model="currentPageUi"
          :length="totalPages"
          :total="totalElements"
          :por-pagina="pageSize"
          @update:modelValue="(page) => loadingCars(page - 1)"
        />
      </div>
    </section>

    <!-- Todo diálogo da tela devolve o foco ao botão que o abriu (aoFecharDialogo).
         O VehicleDialog emite `fechado` porque tem mais de uma raiz e não
         repassa o after-leave; o ConfirmDialog é v-dialog na raiz. -->
    <VehicleDialog
      v-model="dialog"
      :is-editing="isEditing"
      :veiculo="formVeiculo"
      @save="salvarVeiculo"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import VehicleDialog from '@/components/admin/VehicleDialog.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import StatusChip from '@/components/app/StatusChip.vue'
import PlateBadge from '@/components/app/PlateBadge.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import BaseStatusModal from '@/components/app/BaseStatusModal.vue'
import { getCars, deleteCar } from '@/services/vehicleService'
import { devolverFoco, elementoDeOrigem } from '@/utils/foco'
import { mensagemErroExclusao } from '@/utils/exclusao'

const OPCOES_STATUS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'inativo', rotulo: 'Inativos' },
]

const TEXTO_SEM_VEICULOS = 'Use "Novo veículo" para cadastrar o primeiro.'

// Estados reativos
const dialog = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const vehicles = ref([])
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
const veiculoParaExcluir = ref(null)

const filtrando = computed(() => !!searchQuery.value || statusFilter.value !== 'todos')

const descricaoFiltro = computed(() => {
  if (statusFilter.value === 'ativo') return 'Exibindo veículos ativos.'
  if (statusFilter.value === 'inativo') return 'Exibindo veículos inativos.'
  return 'Exibindo todos os veículos.'
})

// Numa recarga o esqueleto tem a altura da página anterior; na primeira carga,
// cinco linhas.
const linhasEsqueleto = computed(() => vehicles.value.length || 5)

watch(currentPage, (newVal) => {
  currentPageUi.value = newVal + 1
})

watchDebounced(
  [searchQuery, statusFilter],
  () => {
    loadingCars(0)
  },
  { debounce: 400 },
)

async function loadingCars(page = 0) {
  loading.value = true
  erroCarregamento.value = false
  try {
    const search = searchQuery.value || undefined
    let active

    if (statusFilter.value === 'ativo') active = true
    else if (statusFilter.value === 'inativo') active = false
    else active = undefined

    const response = await getCars(page, search, active)
    const data = response.data

    vehicles.value = response.data.content.map((veiculo) => ({
      id: veiculo.id,
      plate: veiculo.licensePlate,
      model: veiculo.model,
      status: veiculo.active,
    }))
    currentPage.value = data.number
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    pageSize.value = data.size
  } catch (err) {
    console.log('Erro ao buscar veículos', err)
    erroCarregamento.value = true
  } finally {
    loading.value = false
  }
}

// === Foco devolvido ao fechar diálogos ===
// Os diálogos não têm activator, e sem isso o foco cairia no <body>. A origem
// sobrevive à cadeia formulário → modal de sucesso: só é descartada quando o
// último fecha.
const campoBusca = ref(null)
let origemFoco = null

function guardarOrigem(evento) {
  origemFoco = elementoDeOrigem(evento)
}

function aoFecharDialogo() {
  const resultado = devolverFoco(origemFoco, {
    // Veículo excluído sai da lista junto com o botão: o foco vai para a busca.
    alternativas: [campoBusca.value?.$el?.querySelector('input')],
  })
  if (resultado !== 'aguardando') origemFoco = null
}

const formVeiculo = ref({
  id: null,
  plate: '',
  model: '',
  status: true,
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
  formVeiculo.value = {
    id: null,
    plate: '',
    model: '',
    // Booleano, como o `active` da API. Era 'ativo', e o POST saía com
    // isActive: "ativo"; o backend ignora o campo (CreateCarRequest não o tem)
    // e o @PrePersist de Car fixa active = true.
    status: true,
  }
}

const editarVeiculo = (veiculo) => {
  isEditing.value = true
  formVeiculo.value = { ...veiculo }
  dialog.value = true
}

const salvarVeiculo = async () => {
  try {
    await loadingCars()
    closeDialog()
  } catch (err) {
    console.error('Erro ao salvar veículo:', err)
  }
}

const abrirModalExclusao = (id) => {
  veiculoParaExcluir.value = id
  modalExclusao.value = true
}

// "Excluir o veículo ABC1D23?": a confirmação nomeia o que vai ser apagado.
const objetoExclusao = computed(() => {
  const veiculo = vehicles.value.find((item) => item.id === veiculoParaExcluir.value)
  return veiculo ? `o veículo ${veiculo.plate}` : ''
})

const fecharModalExclusao = () => {
  modalExclusao.value = false
  veiculoParaExcluir.value = null
}

const confirmarExclusao = async () => {
  try {
    await deleteCar(veiculoParaExcluir.value)
    await loadingCars()
    fecharModalExclusao()
  } catch (err) {
    console.error('Erro ao deletar Veiculo:', err)
    // O erro abre antes de a confirmação fechar: no after-leave dela o modal
    // de erro já está ativo, e o foco só volta ao botão quando ele fechar.
    mensagemErroExclusaoAtual.value = mensagemErroExclusao(err)
    modalErroExclusao.value = true
    fecharModalExclusao()
  }
}

onMounted(() => {
  loadingCars()
})
</script>

<style scoped>
.veiculos-container {
  max-width: 1440px;
  padding: var(--space-8);
}

/* Botão secundário (REDESIGN §4.6), igual ao de Postos e Usuários. */
.v-btn.btn-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ── container da tabela ─────────────────────────────────────────────────── */

.tabela-veiculos {
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

/* Segmentado no mesmo desenho do de Postos e Usuários. */
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

.tabela th.col-placa { width: 160px; }
.tabela th.col-status { width: 160px; }
.tabela th.col-acoes { width: 112px; }

.col-acoes {
  text-align: right !important;
  white-space: nowrap;
}

.col-modelo {
  min-width: 0;
}

.truncado {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
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

.acao + .acao {
  margin-left: var(--space-1);
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
  width: 50%;
}

.esqueleto--placa {
  width: 88px;
  height: 22px;
}

.esqueleto--chip {
  width: 72px;
  height: 22px;
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

/* Quatro colunas cabem nos ~700px que sobram em 1024px com o menu aberto: só
   o respiro lateral diminui. */
@media (max-width: 1279px) {
  .tabela th,
  .tabela td {
    padding-inline: var(--space-3);
  }

  .tabela th.col-placa { width: 140px; }
  .tabela th.col-status { width: 128px; }
  .tabela th.col-acoes { width: 104px; }
}

@media (max-width: 959px) {
  .veiculos-container {
    padding: var(--space-4);
  }
}

/* Celular: cada linha vira um bloco, sem rolagem horizontal. Placa e status em
   cima, modelo e ações embaixo. */
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
      'placa status'
      'modelo acoes';
    align-items: center;
    column-gap: var(--space-3);
    row-gap: var(--space-1);
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

  .tabela .col-placa { grid-area: placa; }
  .tabela .col-modelo { grid-area: modelo; min-width: 0; }
  .tabela .col-status { grid-area: status; justify-self: end; }
  .tabela .col-acoes { grid-area: acoes; }

  .tabela tbody tr.linha-esqueleto .col-acoes {
    display: none;
  }
}
</style>
