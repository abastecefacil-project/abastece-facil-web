<template>
  <div class="usuarios-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Usuários</h1>
        <p class="page-subtitle">Gerenciar usuários do sistema</p>
      </div>
    </div>

    <!-- Barra de Pesquisa, Filtros e Novo Usuário -->
    <SearchFilterBar
      v-model:search-query="searchQuery"
      search-label="Buscar por nome"
      action-label="NOVO USUÁRIO"
      action-icon="mdi-plus"
      @action="openDialog"
    >
      <template #acoes-extras>
        <v-btn-toggle v-model="statusFilter" mandatory divided color="primary" variant="outlined" aria-label="Status dos usuários">
          <v-btn value="ativo">Ativos</v-btn>
          <v-btn value="inativo">Inativos</v-btn>
        </v-btn-toggle>
      </template>
    </SearchFilterBar>

    <v-alert v-if="avisoStatus" type="success" variant="tonal" closable class="mb-4" @click:close="avisoStatus = null">
      {{ avisoStatus.nome }} foi {{ avisoStatus.ativo ? 'reativado' : 'inativado' }}.
      O cadastro está na lista de {{ avisoStatus.ativo ? 'ativos' : 'inativos' }}.
      <template #append>
        <v-btn
          v-if="statusFilter !== (avisoStatus.ativo ? 'ativo' : 'inativo')"
          variant="text"
          size="small"
          @click="statusFilter = avisoStatus.ativo ? 'ativo' : 'inativo'"
        >Ver {{ avisoStatus.ativo ? 'ativos' : 'inativos' }}</v-btn>
      </template>
    </v-alert>

    <p class="text-body-2 text-medium-emphasis mb-3" role="status">
      Exibindo usuários {{ statusFilter === 'ativo' ? 'ativos' : 'inativos' }}.
    </p>
    <v-progress-linear v-if="loading" indeterminate color="primary" aria-label="Carregando usuários" />

    <!-- Lista de Usuários em Cards -->
    <div class="usuarios-grid">
      <v-row>
        <v-col v-for="user in users" :key="user.id" cols="12" md="6" lg="6" xl="4">
          <UserCard
            :user="user"
            :pode-editar="podeEditarUsuario(user)"
            :pode-alterar-status="podeAlterarStatus(user)"
            @edit="editarUsuario"
            @alterar-status="abrirModalStatus"
            @reenviar-ativacao="abrirModalReenvio"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Mensagem quando não há resultados -->
    <div v-if="!loading && users.length === 0" class="empty-state">
      <div class="empty-state-content">
        <v-icon icon="mdi-account-off" size="64" class="empty-icon"></v-icon>
        <h3 class="empty-title">
          Nenhum usuário {{ statusFilter === 'ativo' ? 'ativo' : 'inativo' }} encontrado
        </h3>
        <p class="empty-subtitle">
          Tente ajustar a busca ou alternar entre Ativos e Inativos.
        </p>
      </div>
    </div>

    <UserDialog v-model="dialog" :user="usuarioEmEdicao" @save="salvarUsuario" @close="closeDialog" />

    <ConfirmDialog
      v-model="modalStatus"
      :title="usuarioParaStatus?.isActive ? 'Inativar usuário' : 'Reativar usuário'"
      :message="mensagemConfirmacaoStatus"
      :confirm-text="usuarioParaStatus?.isActive ? 'Inativar' : 'Reativar'"
      :confirm-tone="usuarioParaStatus?.isActive ? 'danger' : 'primary'"
      :loading="alterandoStatus"
      @confirm="confirmarStatus"
    />

    <ConfirmDialog
      v-model="modalReenvio"
      title="Reenviar ativação"
      :message="mensagemConfirmacaoReenvio"
      confirm-text="Reenviar"
      confirm-tone="primary"
      :loading="reenviando"
      @confirm="confirmarReenvio"
    />

    <BaseStatusModal
      v-model="feedbackDialog"
      :type="feedbackTipo"
      :title="feedbackTitulo"
      :message="feedbackMensagem"
    />
  </div>

  <PaginationBar
    v-model="currentPageUi"
    :length="totalPages"
    @update:modelValue="(page) => loadingUsers(page - 1)"
  />


  <Footer />
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import UserCard from '@/components/admin/UserCard.vue'
import UserDialog from '@/components/admin/UserDialog.vue'
import SearchFilterBar from '../../components/app/SearchFilterBar.vue'
import Footer from '@/components/app/Footer.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import { watchDebounced } from '@vueuse/core'
import { inativarUser, reativarUser, getUsers, getUsuarioAutenticado, reenviarAtivacao } from '@/services/userService'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import BaseStatusModal from '@/components/app/BaseStatusModal.vue'

// Estados reativos
const dialog = ref(false)
const usuarioEmEdicao = ref(null)
const usuarioLogado = ref(null)
const auth = useAuthStore()
const router = useRouter()
const searchQuery = ref('')
const statusFilter = ref('ativo')
const users = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const currentPageUi = ref(1)
const modalStatus = ref(false)
const usuarioParaStatus = ref(null)
const alterandoStatus = ref(false)
const avisoStatus = ref(null)

// Reenvio de ativação
const modalReenvio = ref(false)
const usuarioParaReenviar = ref(null)
const reenviando = ref(false)

// Feedback de sucesso/erro do reenvio
const feedbackDialog = ref(false)
const feedbackTipo = ref('success')
const feedbackTitulo = ref('')
const feedbackMensagem = ref('')

const MENSAGENS_ERRO_REENVIO = {
  SENHA_JA_DEFINIDA:
    'Esse usuário já definiu a senha. O reenvio só vale para contas aguardando ativação.',
  PERFIL_NAO_PERMITIDO: 'Você não tem permissão para reenviar o convite desse usuário.',
  REGIONAL_NAO_PERMITIDA: 'Você só pode reenviar convite de usuários da sua própria regional.',
  NOT_FOUND: 'Usuário não encontrado. Atualize a listagem e tente de novo.',
}

watch(currentPageUi, (newPage) => {
  currentPage.value = newPage - 1
})

watch(statusFilter, () => loadingUsers())

watchDebounced(
  searchQuery,
  () => {
    loadingUsers()
  },
  { debounce: 300 },
)

async function loadingUsers(page = 0) {
  loading.value = true
  try {
    const name = searchQuery.value || undefined
    const active = statusFilter.value !== 'inativo'

    const response = await getUsers(page, name, active)
    const data = response.data

    // isActive e senhaDefinida alimentam o estado da conta no card.
    // conviteEnviado não é lido aqui: em GET ele vem sempre null.
    users.value = data.content
    currentPage.value = data.number
    currentPageUi.value = data.number + 1
    totalPages.value = data.totalPages
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  } finally {
    loading.value = false
  }
}

// Funções
const openDialog = () => {
  usuarioEmEdicao.value = null
  dialog.value = true
}

function podeEditarUsuario(user) {
  const autor = usuarioLogado.value
  if (!autor || user.isActive === false) return false
  if (autor.perfil === 'ADMINISTRADOR' || autor.id === user.id) return true
  return autor.perfil === 'GESTOR_FROTA' && user.perfil === 'COLABORADOR'
    && autor.regional?.id != null && autor.regional.id === user.regional?.id
}

function editarUsuario(user) {
  if (!podeEditarUsuario(user)) return
  usuarioEmEdicao.value = user
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
}

const salvarUsuario = async (salvo) => {
  if (salvo.id === usuarioLogado.value?.id) {
    if (salvo.email !== usuarioLogado.value.email) {
      closeDialog()
      await auth.logout(router)
      return
    }
    usuarioLogado.value = salvo
  }
  try {
    await loadingUsers(usuarioEmEdicao.value ? currentPage.value : 0)
  } catch (err) {
    console.error('Erro ao salvar usuário:', err)
  }

  closeDialog()
}

function podeAlterarStatus(user) {
  return usuarioLogado.value?.perfil === 'ADMINISTRADOR' && usuarioLogado.value.id !== user.id
}

const mensagemConfirmacaoStatus = computed(() => {
  const user = usuarioParaStatus.value
  if (!user) return ''
  return user.isActive
    ? `Inativar ${user.name}? O acesso será bloqueado e o histórico será preservado.`
    : `Reativar ${user.name}? O acesso será liberado novamente, preservando o cadastro e o histórico.`
})

function abrirModalStatus(user) {
  if (!podeAlterarStatus(user)) return
  usuarioParaStatus.value = user
  modalStatus.value = true
}

const confirmarStatus = async () => {
  if (!usuarioParaStatus.value || alterandoStatus.value) return
  alterandoStatus.value = true
  try {
    const user = usuarioParaStatus.value
    if (user.isActive) await inativarUser(user.id)
    else await reativarUser(user.id)
    avisoStatus.value = { nome: user.name, ativo: !user.isActive }
    await loadingUsers()
    modalStatus.value = false
    usuarioParaStatus.value = null
  } catch (err) {
    mostrarFeedback('error', 'Não foi possível alterar o status',
      err?.response?.data?.message || 'Tente novamente em alguns instantes.')
  } finally {
    alterandoStatus.value = false
  }
}

// === Reenvio do convite de ativação ===
const mensagemConfirmacaoReenvio = computed(() =>
  usuarioParaReenviar.value
    ? `Enviar um novo link de ativação para ${usuarioParaReenviar.value.email}? O link anterior deixa de valer.`
    : '',
)

const abrirModalReenvio = (usuario) => {
  usuarioParaReenviar.value = usuario
  modalReenvio.value = true
}

const mostrarFeedback = (tipo, titulo, mensagem) => {
  feedbackTipo.value = tipo
  feedbackTitulo.value = titulo
  feedbackMensagem.value = mensagem
  feedbackDialog.value = true
}

function mensagemDeErroReenvio(err) {
  const corpo = err?.response?.data
  const codigo = corpo?.error

  if (codigo && MENSAGENS_ERRO_REENVIO[codigo]) return MENSAGENS_ERRO_REENVIO[codigo]
  if (corpo?.message) return corpo.message
  return 'Não foi possível reenviar o convite. Tente novamente.'
}

const confirmarReenvio = async () => {
  if (!usuarioParaReenviar.value) return

  const email = usuarioParaReenviar.value.email
  reenviando.value = true
  try {
    const response = await reenviarAtivacao(usuarioParaReenviar.value.id)

    // Mesmo contrato do cadastro: só `false` significa que o e-mail não saiu.
    if (response.data?.conviteEnviado === false) {
      mostrarFeedback(
        'warning',
        'Convite não enviado',
        'O link foi gerado, mas o e-mail não saiu. Tente reenviar em alguns minutos.',
      )
    } else {
      mostrarFeedback('success', 'Convite reenviado', `Um novo link de ativação foi enviado para ${email}.`)
    }

    await loadingUsers(currentPage.value)
  } catch (err) {
    mostrarFeedback('error', 'Erro!', mensagemDeErroReenvio(err))
  } finally {
    reenviando.value = false
    modalReenvio.value = false
    usuarioParaReenviar.value = null
  }
}

async function carregarUsuarioLogado() {
  try {
    usuarioLogado.value = await getUsuarioAutenticado()
  } catch {
    mostrarFeedback('error', 'Não foi possível habilitar a edição', 'Recarregue a página para tentar novamente.')
  }
}

onMounted(() => {
  loadingUsers()
  carregarUsuarioLogado()
})
</script>

<style scoped>
.usuarios-container {
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

.usuarios-grid {
  margin-top: 8px;
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
  .usuarios-container {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .usuarios-container {
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
  .usuarios-container {
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
