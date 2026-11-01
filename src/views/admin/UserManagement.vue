<template>
  <div class="usuarios-container">
    <PageHeader titulo="Usuários" subtitulo="Gerenciar usuários do sistema">
      <template #acoes>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="guardarOrigem($event); openDialog()">
          Novo usuário
        </v-btn>
      </template>
    </PageHeader>

    <!-- tabindex -1: recebe o foco quando o usuário inativado ou reativado sai
         da lista e o botão que abriu a confirmação deixa de existir. -->
    <v-alert
      v-if="avisoStatus"
      ref="alertaStatus"
      type="success"
      variant="tonal"
      closable
      tabindex="-1"
      class="mb-4"
      @click:close="avisoStatus = null"
    >
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

    <section class="tabela-usuarios" aria-label="Lista de usuários">
      <div class="tabela-toolbar">
        <v-text-field
          ref="campoBusca"
          v-model="searchQuery"
          label="Buscar por nome"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          hide-details
          class="tabela-busca"
        />

        <!-- Sem "Todos": GET /api/users exige `active` (REDESIGN §5.7). -->
        <v-btn-toggle
          v-model="statusFilter"
          mandatory
          variant="text"
          density="compact"
          class="segmentado"
          aria-label="Filtrar usuários por status"
        >
          <v-btn value="ativo">Ativos</v-btn>
          <v-btn value="inativo">Inativos</v-btn>
        </v-btn-toggle>
      </div>

      <p class="sr-only" role="status">
        Exibindo usuários {{ statusFilter === 'ativo' ? 'ativos' : 'inativos' }}.
      </p>

      <div v-if="erroCarregamento && !loading" class="tabela-erro" role="alert">
        <v-icon icon="mdi-alert-circle-outline" size="40" class="tabela-erro__icone" />
        <p class="tabela-erro__titulo">Não foi possível carregar os usuários</p>
        <p class="tabela-erro__texto">Verifique a conexão e tente novamente.</p>
        <v-btn variant="outlined" class="btn-secundario mt-4" @click="loadingUsers(currentPage)">
          Tentar novamente
        </v-btn>
      </div>

      <EmptyState
        v-else-if="!loading && users.length === 0"
        icone="mdi-account-off-outline"
        :titulo="`Nenhum usuário ${statusFilter === 'ativo' ? 'ativo' : 'inativo'} encontrado`"
        :texto="searchQuery ? 'Ajuste a busca ou alterne entre Ativos e Inativos.' : 'Alterne entre Ativos e Inativos para ver os demais cadastros.'"
      />

      <table v-else class="tabela" :aria-busy="loading">
        <thead>
          <tr>
            <th scope="col" class="col-nome">Nome</th>
            <th scope="col" class="col-perfil">Perfil</th>
            <th scope="col" class="col-regional">Regional</th>
            <th scope="col" class="col-status">Status</th>
            <th scope="col" class="col-acoes">Ações</th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr v-for="n in linhasEsqueleto" :key="n" class="linha-esqueleto" aria-hidden="true">
            <td class="col-nome">
              <span class="esqueleto esqueleto--titulo" />
              <span class="esqueleto esqueleto--meta" />
            </td>
            <td class="col-perfil"><span class="esqueleto esqueleto--chip" /></td>
            <td class="col-regional"><span class="esqueleto esqueleto--curto" /></td>
            <td class="col-status"><span class="esqueleto esqueleto--chip" /></td>
            <td class="col-acoes" />
          </tr>
        </tbody>

        <tbody v-else>
          <tr v-for="linha in linhas" :key="linha.usuario.id">
            <td class="col-nome">
              <span class="usuario-nome">{{ linha.nome }}</span>
              <span class="usuario-email">{{ linha.email }}</span>
            </td>
            <td class="col-perfil">
              <span v-if="linha.perfil" class="chip-perfil">{{ linha.perfil }}</span>
              <!-- Abaixo de 1280px a coluna Regional some e a regional vem para cá. -->
              <span class="regional-compacta">
                <template v-if="linha.regional">{{ linha.regional }}</template>
                <span v-else class="horario-nao-informado">{{ linha.regionalAusente }}</span>
              </span>
            </td>
            <td class="col-regional">
              <span v-if="linha.regional" class="truncado">{{ linha.regional }}</span>
              <span v-else class="horario-nao-informado">{{ linha.regionalAusente }}</span>
            </td>
            <td class="col-status">
              <StatusChip :status="linha.status" />
            </td>
            <td class="col-acoes">
              <!-- Só faz sentido reenviar para quem ainda não definiu a senha: o
                   backend recusa os demais com 409 SENHA_JA_DEFINIDA. -->
              <v-btn
                v-if="linha.status === 'aguardando'"
                variant="text"
                size="small"
                density="compact"
                icon
                class="acao"
                :data-origem="`reenvio-${linha.usuario.id}`"
                :aria-label="`Reenviar ativação para ${linha.nome}`"
                @click="guardarOrigem($event); abrirModalReenvio(linha.usuario)"
              >
                <v-icon icon="mdi-email-sync-outline" size="20" />
                <v-tooltip activator="parent" location="top" text="Reenviar ativação" />
              </v-btn>
              <v-btn
                v-if="podeEditarUsuario(linha.usuario)"
                variant="text"
                size="small"
                density="compact"
                icon
                class="acao"
                :data-origem="`editar-${linha.usuario.id}`"
                :aria-label="`Editar usuário ${linha.nome}`"
                @click="guardarOrigem($event); editarUsuario(linha.usuario)"
              >
                <v-icon icon="mdi-pencil-outline" size="20" />
                <v-tooltip activator="parent" location="top" text="Editar" />
              </v-btn>
              <v-btn
                v-if="podeAlterarStatus(linha.usuario)"
                variant="text"
                size="small"
                density="compact"
                icon
                :class="['acao', { 'acao--perigo': linha.usuario.isActive }]"
                :data-origem="`status-${linha.usuario.id}`"
                :aria-label="`${linha.usuario.isActive ? 'Inativar' : 'Reativar'} usuário ${linha.nome}`"
                @click="guardarOrigem($event); abrirModalStatus(linha.usuario)"
              >
                <v-icon :icon="linha.usuario.isActive ? 'mdi-account-off-outline' : 'mdi-account-check-outline'" size="20" />
                <v-tooltip activator="parent" location="top" :text="linha.usuario.isActive ? 'Inativar' : 'Reativar'" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!erroCarregamento && users.length > 0" class="tabela-rodape">
        <PaginationBar
          v-model="currentPageUi"
          :length="totalPages"
          :total="totalElements"
          :por-pagina="pageSize"
          @update:modelValue="(page) => loadingUsers(page - 1)"
        />
      </div>
    </section>

    <!-- Todo diálogo da tela devolve o foco ao botão que o abriu (aoFecharDialogo).
         O UserDialog emite `fechado` porque tem mais de uma raiz e não repassa
         o after-leave; os demais são v-dialog na raiz e recebem o atributo. -->
    <UserDialog
      v-model="dialog"
      :user="usuarioEmEdicao"
      @save="salvarUsuario"
      @close="closeDialog"
      @fechado="aoFecharDialogo"
    />

    <ConfirmDialog
      v-model="modalStatus"
      :title="tituloConfirmacaoStatus"
      :message="mensagemConfirmacaoStatus"
      :confirm-text="usuarioParaStatus?.isActive ? 'Inativar' : 'Reativar'"
      :confirm-tone="usuarioParaStatus?.isActive ? 'danger' : 'primary'"
      :loading="alterandoStatus"
      @confirm="confirmarStatus"
      @after-leave="aoFecharDialogo"
    />

    <ConfirmDialog
      v-model="modalReenvio"
      :title="tituloConfirmacaoReenvio"
      :message="mensagemConfirmacaoReenvio"
      confirm-text="Reenviar"
      confirm-tone="primary"
      :loading="reenviando"
      @confirm="confirmarReenvio"
      @after-leave="aoFecharDialogo"
    />

    <BaseStatusModal
      v-model="feedbackDialog"
      :type="feedbackTipo"
      :title="feedbackTitulo"
      :message="feedbackMensagem"
      @after-leave="aoFecharDialogo"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import UserDialog from '@/components/admin/UserDialog.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import StatusChip from '@/components/app/StatusChip.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { watchDebounced } from '@vueuse/core'
import { inativarUser, reativarUser, getUsers, getUsuarioAutenticado, reenviarAtivacao } from '@/services/userService'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import BaseStatusModal from '@/components/app/BaseStatusModal.vue'
import { apresentacaoLinhaUsuario } from '@/utils/usuarioExibicao'
import { devolverFoco, elementoDeOrigem } from '@/utils/foco'

// tests/user-edit.test.js roda este script numa VM sem as linhas de import:
// nada importado pode ser chamado no topo nem nas funções que o teste exercita
// (loadingUsers, abrirModalStatus, confirmarStatus, salvarUsuario…). Os
// imports novos só aparecem dentro de computed e de handlers do template.

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
const erroCarregamento = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
// O endpoint não tem @PageableDefault: o tamanho é o padrão do Spring (20), e
// por isso vem da resposta, não de uma constante.
const totalElements = ref(null)
const pageSize = ref(null)
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

// Elementos do template usados como destino alternativo do foco.
const alertaStatus = ref(null)
const campoBusca = ref(null)

const MENSAGENS_ERRO_REENVIO = {
  SENHA_JA_DEFINIDA:
    'Esse usuário já definiu a senha. O reenvio só vale para contas aguardando ativação.',
  PERFIL_NAO_PERMITIDO: 'Você não tem permissão para reenviar o convite desse usuário.',
  REGIONAL_NAO_PERMITIDA: 'Você só pode reenviar convite de usuários da sua própria regional.',
  NOT_FOUND: 'Usuário não encontrado. Atualize a listagem e tente de novo.',
}

// Só apresentação (utils/usuarioExibicao.js): o usuário da API segue intacto em
// `usuario`, que é o que as permissões e os diálogos recebem.
const linhas = computed(() =>
  users.value.map((usuario) => ({ usuario, ...apresentacaoLinhaUsuario(usuario) })),
)

// Numa recarga o esqueleto tem a altura da página anterior; na primeira carga,
// cinco linhas.
const linhasEsqueleto = computed(() => users.value.length || 5)

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
  erroCarregamento.value = false
  try {
    const name = searchQuery.value || undefined
    const active = statusFilter.value !== 'inativo'

    const response = await getUsers(page, name, active)
    const data = response.data

    // isActive e senhaDefinida alimentam o status da linha.
    // conviteEnviado não é lido aqui: em GET ele vem sempre null.
    users.value = data.content
    currentPage.value = data.number
    currentPageUi.value = data.number + 1
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    pageSize.value = data.size
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    erroCarregamento.value = true
  } finally {
    loading.value = false
  }
}

// === Foco devolvido ao fechar diálogos ===
// Os diálogos não têm activator, e sem isso o foco cairia no <body>. A origem
// sobrevive a uma cadeia de diálogos (formulário → sucesso, confirmação →
// feedback): só é descartada quando o último deles fecha.
let origemFoco = null

function guardarOrigem(evento) {
  origemFoco = elementoDeOrigem(evento)
}

function aoFecharDialogo() {
  const resultado = devolverFoco(origemFoco, {
    // O botão some quando o usuário inativado sai da lista: o foco vai para o
    // aviso que diz para onde ele foi, ou para a busca.
    alternativas: [alertaStatus.value?.$el, campoBusca.value?.$el?.querySelector('input')],
  })
  if (resultado !== 'aguardando') origemFoco = null
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

// A confirmação nomeia o usuário no título (REDESIGN §4.6).
const tituloConfirmacaoStatus = computed(() => {
  const user = usuarioParaStatus.value
  if (!user) return ''
  return `${user.isActive ? 'Inativar' : 'Reativar'} ${user.name}?`
})

const mensagemConfirmacaoStatus = computed(() => {
  const user = usuarioParaStatus.value
  if (!user) return ''
  return user.isActive
    ? 'O acesso será bloqueado e o histórico será preservado.'
    : 'O acesso será liberado novamente, preservando o cadastro e o histórico.'
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
const tituloConfirmacaoReenvio = computed(() =>
  usuarioParaReenviar.value ? `Reenviar ativação para ${usuarioParaReenviar.value.name}?` : '',
)

const mensagemConfirmacaoReenvio = computed(() =>
  usuarioParaReenviar.value
    ? `Um novo link de ativação será enviado para ${usuarioParaReenviar.value.email}. O link anterior deixa de valer.`
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
  max-width: 1440px;
  padding: var(--space-8);
}

/* Botão secundário (REDESIGN §4.6), igual ao de Postos. */
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

.tabela-usuarios {
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

/* Segmentado no mesmo desenho do de Postos: contorno do grupo, divisória entre
   os botões, selecionado em blue-50 com texto primary. */
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

.tabela th.col-perfil { width: 168px; }
.tabela th.col-regional { width: 22%; }
.tabela th.col-status { width: 184px; }
.tabela th.col-acoes { width: 136px; }

.col-acoes {
  text-align: right !important;
  white-space: nowrap;
}

.col-nome {
  min-width: 0;
}

.usuario-nome,
.usuario-email,
.regional-compacta,
.truncado {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usuario-nome {
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
}

.usuario-email {
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

/* Chip neutro de perfil (§4.1: fundo neutral-100, borda neutral-300). Não é
   status, então não tem o ponto do StatusChip. */
.chip-perfil {
  display: inline-block;
  max-width: 100%;
  padding: 2px var(--space-2);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.regional-compacta {
  display: none;
  margin-top: 2px;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
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

/* Até três ações por linha: sem o respiro de 4px os ícones encostam. */
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
  width: 60%;
  margin-bottom: 6px;
}

.esqueleto--meta {
  width: 45%;
}

.esqueleto--curto {
  width: 112px;
}

.esqueleto--chip {
  width: 88px;
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

/* Com o menu aberto, 1024px deixa ~700px de conteúdo: a coluna Regional sai e
   a regional vira a segunda linha da célula Perfil. */
@media (max-width: 1279px) {
  .col-regional {
    display: none;
  }

  .tabela th,
  .tabela td {
    padding-inline: var(--space-3);
  }

  .tabela th.col-perfil { width: 180px; }
  .tabela th.col-status { width: 172px; }
  .tabela th.col-acoes { width: 120px; }

  .regional-compacta {
    display: block;
  }
}

@media (max-width: 959px) {
  .usuarios-container {
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

  /* Nome e e-mail na largura toda (o e-mail é o dado que identifica o
     cadastro), perfil e regional na linha de baixo, status e ações na última. */
  .tabela tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'nome nome'
      'perfil perfil'
      'status acoes';
    align-items: center;
    column-gap: var(--space-3);
    row-gap: var(--space-2);
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

  .tabela .col-nome { grid-area: nome; }
  .tabela .col-perfil { grid-area: perfil; min-width: 0; }
  .tabela .col-status { grid-area: status; justify-self: start; }
  .tabela .col-acoes { grid-area: acoes; }

  /* Perfil e regional lado a lado. */
  .tabela .col-perfil {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .tabela .chip-perfil {
    flex-shrink: 0;
  }

  .tabela .regional-compacta {
    flex: 1 1 auto;
    min-width: 0;
    margin-top: 0;
  }

  .tabela tbody tr.linha-esqueleto .col-acoes {
    display: none;
  }
}
</style>
