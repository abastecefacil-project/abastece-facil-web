<template>
  <v-layout>
    <!-- Barra superior clara (REDESIGN §5.1). O título da página não fica aqui,
         só no cabeçalho de cada view: a barra mostra o breadcrumb. `order` 1
         cede a prioridade de layout à sidebar, que ocupa a altura inteira com o
         logo no topo; a barra fica ao lado dela. A ordem no DOM, e com ela a do
         Tab, continua barra primeiro. -->
    <v-app-bar color="surface" :height="56" :order="1" flat class="app-header">
      <!-- Abaixo de 960px a sidebar vira drawer temporário, e o logo, que mora
           nela, sai da tela; por isso a versão colorida aparece aqui. -->
      <template v-if="mobile">
        <v-app-bar-nav-icon aria-label="Abrir menu" class="ml-1" @click="toggleMobileDrawer" />
        <img src="../assets/logo.png" alt="Abastece Fácil" class="app-logo-compacto" />
      </template>

      <nav v-if="trilha && larguraBreadcrumb" aria-label="Você está em" class="trilha">
        <ol>
          <li v-if="trilha.grupo && !mobile" class="trilha__grupo">{{ trilha.grupo }}</li>
          <li class="trilha__pagina" aria-current="page">{{ trilha.pagina }}</li>
        </ol>
      </nav>

      <v-spacer />

      <NotificacoesNeo v-if="authStore.perfil === 'ADMINISTRADOR'" />

      <!-- Menu do usuário. Sempre presente, inclusive com perfil nulo: é ele que
           leva ao "Sair", e uma sessão sem perfil também precisa sair. -->
      <v-menu location="bottom end" :offset="8">
        <template #activator="{ props: ativador }">
          <v-btn
            v-bind="ativador"
            variant="text"
            :height="44"
            class="usuario-ativador"
            :aria-label="rotuloAtivador"
          >
            <v-avatar size="32" class="usuario-avatar">
              <span v-if="iniciais">{{ iniciais }}</span>
              <v-icon v-else :icon="iconeAvatar" size="18" />
            </v-avatar>
            <span v-if="!mobile && (nomeUsuario || perfilLongo)" class="usuario-identidade">
              <span class="usuario-nome">{{ nomeUsuario || perfilLongo }}</span>
              <span v-if="perfilSecundario" class="usuario-perfil">{{ perfilSecundario }}</span>
            </span>
            <v-icon v-if="!mobile" icon="mdi-chevron-down" size="18" class="usuario-seta" />
          </v-btn>
        </template>

        <v-list class="usuario-menu" min-width="240">
          <div v-if="nomeUsuario || perfilLongo" class="usuario-menu__cabecalho">
            <span class="usuario-nome">{{ nomeUsuario || perfilLongo }}</span>
            <span v-if="perfilSecundario" class="usuario-perfil">{{ perfilSecundario }}</span>
          </div>
          <v-divider v-if="nomeUsuario || perfilLongo" class="mb-1" />
          <v-list-item prepend-icon="mdi-logout" title="Sair" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Menu lateral recolhível -->
    <v-navigation-drawer
      v-model="drawer"
      color="sidebar"
      :rail="emRail"
      :permanent="!mobile"
      :temporary="mobile"
      class="app-drawer"
      @click="handleDrawerClick"
    >
      <div class="drawer-header">
        <img v-if="!emRail" src="../assets/logoBranco.png" alt="Abastece Fácil" class="drawer-logo" />
        <v-btn
          v-if="!mobile"
          :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          :aria-label="rail ? 'Expandir menu' : 'Recolher menu'"
          variant="text"
          size="small"
          class="drawer-toggle"
          @click.stop="rail = !rail"
        />
        <v-btn
          v-else
          icon="mdi-close"
          aria-label="Fechar menu"
          variant="text"
          size="small"
          class="drawer-toggle"
          @click.stop="drawer = false"
        />
      </div>

      <!-- Uma lista só, com os grupos como subheader: o VList dá foco ao
           primeiro item quando recebe Tab e percorre os itens pelas setas, então
           uma lista por grupo quebraria a navegação por teclado entre grupos. -->
      <nav aria-label="Menu principal">
        <v-list nav density="compact" class="drawer-list">
          <template v-for="(secao, indice) in secoes" :key="secao.grupo ?? indice">
            <template v-if="secao.grupo">
              <v-list-subheader v-if="!emRail" class="drawer-overline">{{ secao.grupo }}</v-list-subheader>
              <v-divider v-else-if="indice > 0" class="drawer-divisor" />
            </template>

            <v-list-item
              v-for="item in secao.itens"
              :key="item.value"
              :prepend-icon="item.icon"
              :title="emRail ? '' : item.title"
              :aria-label="emRail ? item.title : undefined"
              :to="item.to"
              exact
              rounded="lg"
              class="drawer-item"
              @click="handleMenuItemClick"
            >
              <template v-if="emRail" #append>
                <v-tooltip activator="parent" location="end" :text="item.title" />
              </template>
            </v-list-item>
          </template>
        </v-list>
      </nav>
    </v-navigation-drawer>

    <!-- Área de Conteúdo Principal -->
    <v-main class="main-content">
      <v-container fluid class="pa-0 main-container">
        <router-view />
      </v-container>
    </v-main>

    <!-- Vale para os dois contextos, porque o shell é um só: o "Sair" do menu do
         usuário passa pelo mesmo `handleLogout`. Tom `primary`, e não o vermelho
         padrão, porque sair não destrói nada — mesma escolha do reenvio de
         convite no S5. -->
    <ConfirmDialog
      v-model="modalSaida"
      title="Confirmar saída"
      message="Tem certeza que deseja sair?"
      confirm-text="Sair"
      confirm-tone="primary"
      @confirm="confirmarSaida"
    />
  </v-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import '@/assets/main.css'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { NAVEGACAO, agruparPorGrupo, itensVisiveis } from '@/config/navegacao'
import { iconePerfil, rotuloPerfil } from '@/utils/perfil'
import { iniciaisDoNome } from '@/utils/usuario'
import { getUsuarioAutenticado } from '@/services/userService'
import ConfirmDialog from '@/components/app/ConfirmDialog.vue'
import NotificacoesNeo from '@/components/admin/NotificacoesNeo.vue'

// Qual conjunto de menu usar. Os dois únicos call sites são os wrappers
// `AdminLayout.vue` e `DefaultLayout.vue`, que o router referencia por nome
// desde sempre.
const props = defineProps({
  contexto: {
    type: String,
    required: true,
    validator: (valor) => valor in NAVEGACAO,
  },
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Reativos sobre `authStore.perfil`: `aplicarSessao` grava o perfil novo no
// login e `logout` zera, então trocar de usuário atualiza sem recarregar.
// Perfil nulo ou desconhecido dá `null` e nenhum rótulo aparece.
const perfilLongo = computed(() => rotuloPerfil(authStore.perfil))

// Nome do usuário logado, para o menu do usuário. Não está na store nem no
// token: vem de `GET /api/users/me`, uma chamada por montagem do shell. Enquanto
// carrega, ou se falhar, fica `null` e o menu mostra só o perfil, como antes do
// redesign. A store não guarda o nome de propósito (REDESIGN §5.1).
const nomeUsuario = ref(null)
let desmontado = false

async function carregarNomeUsuario() {
  try {
    const usuario = await getUsuarioAutenticado()
    if (!desmontado) nomeUsuario.value = usuario?.name?.trim() || null
  } catch {
    // Sem nome, o menu continua com o rótulo do perfil. Um 401 já é tratado
    // pelo interceptor do `apiPrivate`, que encerra a sessão.
  }
}

// Perfil como segunda linha só quando acrescenta algo: um usuário cadastrado
// com o nome "Administrador" não precisa ler "Administrador" duas vezes.
const perfilSecundario = computed(() => {
  const nome = nomeUsuario.value?.toLocaleLowerCase('pt-BR')
  return nome && perfilLongo.value && perfilLongo.value.toLocaleLowerCase('pt-BR') !== nome
    ? perfilLongo.value
    : null
})

const iniciais = computed(() => iniciaisDoNome(nomeUsuario.value))
const iconeAvatar = computed(() => iconePerfil(authStore.perfil) ?? 'mdi-account')
const rotuloAtivador = computed(() => {
  const quem = [nomeUsuario.value || perfilLongo.value, perfilSecundario.value].filter(Boolean).join(', ')
  return quem ? `Menu do usuário: ${quem}` : 'Menu do usuário'
})

const modalSaida = ref(false)

// O clique no "Sair" só abre a confirmação — quem encerra a sessão é o
// `confirmarSaida`.
const handleLogout = () => {
  modalSaida.value = true
}

// Não fecha o diálogo depois: a navegação desmonta o `AppShell` inteiro, e o
// diálogo vai junto. Também não passa `loading` ao `ConfirmDialog` — diferente
// do reenvio de convite, aqui não há ida ao servidor para esperar, só navegação
// e limpeza de `localStorage`.
const confirmarSaida = () => {
  authStore.logout(router)
}

// Estados reativos para controle do drawer
const drawer = ref(true)
const rail = ref(false)
const windowWidth = ref(window.innerWidth)

// Computed para detectar se está em mobile
const mobile = computed(() => windowWidth.value < 960)

// Rail só existe no desktop: no mobile o drawer é temporário e sempre largo.
const emRail = computed(() => rail.value && !mobile.value)

// Abaixo de 600px a barra só tem espaço para menu, logo, sino e avatar; a
// página continua identificada pelo título dela.
const larguraBreadcrumb = computed(() => windowWidth.value >= 600)

// Função para atualizar largura da janela
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

// Função para alternar o drawer no mobile
const toggleMobileDrawer = () => {
  drawer.value = !drawer.value
}

// Função para lidar com cliques no drawer
const handleDrawerClick = () => {
  if (!mobile.value && rail.value) {
    rail.value = false
  }
}

// Função para lidar com cliques nos itens do menu
const handleMenuItemClick = () => {
  if (mobile.value) {
    drawer.value = false
  }
}

// Watchers para ajustar comportamento baseado no tamanho da tela
const adjustLayoutForScreenSize = () => {
  if (mobile.value) {
    // No mobile, drawer inicia fechado
    drawer.value = false
    rail.value = false
  } else {
    // No desktop, drawer inicia aberto
    drawer.value = true
    rail.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
  adjustLayoutForScreenSize()
  carregarNomeUsuario()
})

onUnmounted(() => {
  desmontado = true
  window.removeEventListener('resize', updateWindowWidth)
})

// Item sem `perfis` aparece para qualquer sessão, inclusive perfil nulo: é a
// mesma regra do guard, que libera rota sem `meta.perfis`. Ver config/navegacao.js.
const menuItems = computed(() => itensVisiveis(props.contexto, authStore.perfil))
const secoes = computed(() => agruparPorGrupo(menuItems.value))

// Breadcrumb "grupo / página". Sai do próprio menu, sem texto novo; rota fora do
// menu não mostra breadcrumb.
const trilha = computed(() => {
  const ativo = menuItems.value.find((item) => item.to.name === route.name)
  return ativo ? { grupo: ativo.grupo ?? null, pagina: ativo.title } : null
})
</script>

<style scoped>
/* Scroll no conteúdo principal */
.main-content {
  background-color: var(--color-background);
  display: flex;
  flex-direction: column;
}

.main-container {
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Barra superior ─────────────────────────────────────────────────────── */
/* Linha inferior como sombra interna, e não border: a borda somaria 1px aos
   56px da barra. */
.app-header {
  box-shadow: inset 0 -1px 0 var(--color-border);
}

.app-header :deep(.v-toolbar__content) {
  padding-inline: var(--space-6) var(--space-4);
  gap: var(--space-2);
}

.app-logo-compacto {
  height: 28px;
  width: auto;
  object-fit: contain;
}

.trilha ol {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
}

.trilha__grupo {
  color: var(--color-text-muted);
}

.trilha__grupo + .trilha__pagina::before {
  content: '/';
  margin-inline: var(--space-2);
  color: var(--color-neutral-400);
}

.trilha__pagina {
  color: var(--color-text);
  font-weight: 500;
}

/* Menu do usuário */
.usuario-ativador {
  padding-inline: var(--space-1) var(--space-2);
  gap: var(--space-2);
}

.usuario-ativador :deep(.v-btn__content) {
  gap: var(--space-2);
}

.usuario-avatar {
  background-color: var(--color-blue-50);
  color: var(--color-blue-700);
  font-size: var(--text-body-sm-size);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.usuario-identidade,
.usuario-menu__cabecalho {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  text-align: left;
}

.usuario-identidade {
  max-width: 200px;
}

.usuario-nome {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  font-weight: 600;
}

.usuario-perfil {
  color: var(--color-text-muted);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 400;
}

.usuario-seta {
  color: var(--color-text-muted);
}

.usuario-menu__cabecalho {
  padding: var(--space-3) var(--space-4);
}

.usuario-menu__cabecalho .usuario-nome {
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--app-bar-height);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-5);
}

.app-drawer.v-navigation-drawer--rail .drawer-header {
  justify-content: center;
  padding-inline: var(--space-2);
}

.drawer-logo {
  height: 30px;
  width: auto;
  object-fit: contain;
}

.drawer-toggle {
  color: var(--color-sidebar-text);
}

.drawer-toggle:hover {
  color: var(--color-sidebar-text-active);
}

/* Rótulo de grupo em overline: 6,33:1 sobre o blue-900 (tokens em main.css).
   A lista na frente vence o `.v-list--nav .v-list-subheader` do Vuetify. */
.drawer-list .drawer-overline {
  min-height: 0;
  padding: var(--space-4) var(--space-2) var(--space-2);
  color: var(--color-sidebar-overline);
  font-size: var(--text-overline-size);
  line-height: var(--text-overline-line);
  font-weight: var(--text-overline-weight);
  letter-spacing: var(--text-overline-tracking);
  text-transform: uppercase;
}

/* Em rail o rótulo não cabe; um divisor marca a troca de grupo. */
.drawer-divisor {
  margin: var(--space-2) var(--space-3);
  border-color: var(--color-sidebar-divider);
  opacity: 1;
}

.drawer-list {
  padding: 0 var(--space-3) var(--space-3);
}

.drawer-list .drawer-overline:first-child {
  padding-top: var(--space-2);
}

.app-drawer.v-navigation-drawer--rail .drawer-list {
  padding-inline: var(--space-2);
}

.app-drawer.v-navigation-drawer--rail :deep(.v-list-item__spacer),
.app-drawer.v-navigation-drawer--rail :deep(.v-list-item__content) {
  display: none;
}

.drawer-item {
  min-height: 40px;
  margin-bottom: 2px;
  color: var(--color-sidebar-text);
  font-weight: 500;
  transition: background-color var(--transition), color var(--transition);
}

/* O overlay do Vuetify somaria ao fundo dos estados abaixo (no hover do ativo,
   16% sobre os 10%); quem desenha hover, ativo e foco aqui é o CSS do shell. A
   classe do drawer na frente vence o `.v-list-item--active:hover > …__overlay`. */
.app-drawer .drawer-item :deep(.v-list-item__overlay) {
  opacity: 0;
}

.drawer-item :deep(.v-list-item__prepend .v-icon) {
  opacity: 1;
}

.drawer-item:hover {
  background-color: var(--color-sidebar-hover);
  color: var(--color-sidebar-text-active);
}

/* Item ativo: fundo branco 10%, texto branco e indicador lateral blue-300. */
.drawer-item.v-list-item--active {
  background-color: var(--color-sidebar-active);
  color: var(--color-sidebar-text-active);
  font-weight: 600;
}

.drawer-item.v-list-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background-color: var(--color-sidebar-indicator);
}

/* Foco por teclado: o anel global (blue-400 a 45%) desaparece sobre o
   blue-900. A classe do drawer na frente dá a especificidade para vencer a
   regra global de main.css. */
.app-drawer .drawer-item:focus-visible,
.app-drawer .drawer-toggle:focus-visible {
  outline: 2px solid var(--color-sidebar-focus-ring);
  outline-offset: 2px;
}

:deep(.v-navigation-drawer__content) {
  overflow-y: auto;
}

/* Transição de largura do rail */
.v-navigation-drawer {
  transition: width 0.3s ease;
}

@media (max-width: 959px) {
  .app-header :deep(.v-toolbar__content) {
    padding-inline: 0 var(--space-2);
  }
}
</style>
