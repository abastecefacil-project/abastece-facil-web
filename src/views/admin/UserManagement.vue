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
    <!-- Sem opção "Todos": GET /api/users exige o parâmetro active. -->
    <SearchFilterBar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      search-label="Buscar por nome"
      :filter-options="[
        { label: 'Ativos', value: 'ativo' },
        { label: 'Inativos', value: 'inativo' },
      ]"
      action-label="NOVO USUÁRIO"
      action-icon="mdi-plus"
      @action="openDialog"
    />

    <!-- Lista de Usuários em Cards -->
    <div class="usuarios-grid">
      <v-row>
        <v-col v-for="user in users" :key="user.id" cols="12" md="6" lg="6" xl="4">
          <UserCard
            :user="user"
            @delete="abrirModalExclusao"
            @reenviar-ativacao="abrirModalReenvio"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Mensagem quando não há resultados -->
    <div v-if="users.length === 0" class="empty-state">
      <div class="empty-state-content">
        <v-icon icon="mdi-account-off" size="64" class="empty-icon"></v-icon>
        <h3 class="empty-title">
          {{ searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado' }}
        </h3>
        <p class="empty-subtitle">
          {{
            searchQuery
              ? 'Tente ajustar os filtros de pesquisa'
              : 'Clique em "Novo Usuário" para adicionar o primeiro usuário'
          }}
        </p>
      </div>
    </div>

    <!-- Dialog para Adicionar Usuário -->
    <UserDialog v-model="dialog" @save="salvarUsuario" @close="closeDialog" />

    <ConfirmDialog v-model="modalExclusao" @confirm="confirmarExclusao" />

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
import { deleteUser, getUsers, reenviarAtivacao } from '@/services/userService'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import BaseStatusModal from '@/components/app/BaseStatusModal.vue'

// Estados reativos
const dialog = ref(false)
const searchQuery = ref('')
const statusFilter = ref('ativo')
const users = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const currentPageUi = ref(1)
const modalExclusao = ref(false)
const usuarioParaExcluir = ref(null)

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

watchDebounced(
  [searchQuery, statusFilter],
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
    users.value = data.content.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      senhaDefinida: user.senhaDefinida,
      perfil: user.perfil,
      regional: user.regional,
    }))
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
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
}

const salvarUsuario = async () => {
  try {
    await loadingUsers()
  } catch (err) {
    console.error('Erro ao salvar usuário:', err)
  }

  closeDialog()
}

const abrirModalExclusao = (id) => {
  usuarioParaExcluir.value = id
  modalExclusao.value = true
}

const fecharModalExclusao = () => {
  modalExclusao.value = false
  usuarioParaExcluir.value = null
}

const confirmarExclusao = async () => {
  try {
    await deleteUser(usuarioParaExcluir.value)
    await loadingUsers()
    fecharModalExclusao()
  } catch (err) {
    console.error('Erro ao deletar usuário:', err)
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

onMounted(() => {
  loadingUsers()
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
