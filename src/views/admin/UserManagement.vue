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
      v-model:status-filter="statusFilter"
      search-label="Buscar por nome ou cidade"
      action-label="NOVO USUÁRIO"
      action-icon="mdi-plus"
      @action="openDialog"
    />

    <!-- Lista de Usuários em Cards -->
    <div class="usuarios-grid">
      <v-row>
        <v-col v-for="user in users" :key="user.id" cols="12" md="6" lg="6" xl="4">
          <UserCard :user="user" @edit="editarUsuario" @delete="abrirModalExclusao" />
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

    <!-- Dialog para Adicionar/Editar Usuário -->
    <UserDialog
      v-model="dialog"
      :is-editing="isEditing"
      :user="formUsuario"
      @save="salvarUsuario"
      @close="closeDialog"
    />
    <ConfirmDialog
      v-model="modalExclusao"
      @confirm="confirmarExclusao"
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
import { ref, watch, onMounted } from 'vue'
import UserCard from '@/components/admin/UserCard.vue'
import UserDialog from '@/components/admin/UserDialog.vue'
import SearchFilterBar from '../../components/app/SearchFilterBar.vue'
import Footer from '@/components/app/Footer.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import { watchDebounced } from '@vueuse/core'
import { deleteUser, getUsers } from '@/services/userService'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'

// Estados reativos
const dialog = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')
const statusFilter = ref('todos')
const users = ref([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const currentPageUi = ref(1)
const modalExclusao = ref(false)
const usuarioParaExcluir = ref(null)

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
    let active

    if (statusFilter.value === 'ativos') active = true
    else if (statusFilter.value === 'inativos') active = false
    else active = undefined

    const response = await getUsers(page, name, active)
    const data = response.data
    
    users.value = data.content.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      // status: user.active
    }))
    currentPage.value = data.number
    totalPages.value = data.totalPages
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  } finally {
    loading.value = false
  }
}

// Objeto para armazenar os dados do formulário
const formUsuario = ref({
  id: null,
  name: '',
  email: '',
  // status: 'ativo',
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
  formUsuario.value = {
    id: null,
    nome: '',
    email: '',
    senha: '',
    status: 'ativo',
  }
}

const editarUsuario = (usuario) => {
  isEditing.value = true
  formUsuario.value = { ...usuario }
  dialog.value = true
}

const salvarUsuario = async () => {
  try {
    await loadingUsers()
    closeDialog()
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
    console.error('Erro ao deletar Veiculo:', err)
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
