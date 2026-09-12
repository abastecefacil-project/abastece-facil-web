<template>
  <v-layout>
    <!-- Barra Superior -->
    <v-app-bar color="#16496E" density="compact" elevation="0" class="app-header">
      <!-- Botão hambúrguer (apenas mobile) -->
      <v-app-bar-nav-icon
        v-if="mobile"
        @click="toggleMobileDrawer"
        color="white"
      ></v-app-bar-nav-icon>

      <img src="../assets/logoBranco.png" alt="Abastece Fácil" class="app-logo" />

      <span v-if="!mobile" class="header-divider"></span>
      <span v-if="!mobile" class="header-section">{{ currentSection }}</span>

      <v-spacer></v-spacer>

      <v-btn :prepend-icon="botao.icon" variant="text" color="white" @click="handleLogout">
        {{ botao.title }}
      </v-btn>
    </v-app-bar>

    <!-- Menu Lateral Recolhível -->
    <v-navigation-drawer
      v-model="drawer"
      color="#0F324C"
      :rail="rail && !mobile"
      :permanent="!mobile"
      :temporary="mobile"
      class="app-drawer"
      @click="handleDrawerClick"
    >
      <!-- Cabeçalho do drawer quando expandido -->
      <template v-if="!rail || mobile">
        <div class="drawer-header">
          <span class="drawer-label">Menu</span>
          <v-btn
            v-if="!mobile"
            icon="mdi-chevron-left"
            variant="text"
            color="white"
            size="small"
            @click.stop="rail = true"
          ></v-btn>
          <v-btn
            v-if="mobile"
            icon="mdi-close"
            variant="text"
            color="white"
            size="small"
            @click.stop="drawer = false"
          ></v-btn>
        </div>
      </template>

      <v-list nav density="compact" class="drawer-list">
        <v-list-item
          v-for="item in menuItems"
          :key="item.value"
          :prepend-icon="item.icon"
          :title="rail && !mobile ? '' : item.title"
          :to="item.to"
          exact
          class="drawer-item"
          color="white"
          rounded="md"
          @click="handleMenuItemClick"
        >
          <template v-if="rail && !mobile" v-slot:append>
            <v-tooltip activator="parent" location="end" :text="item.title"></v-tooltip>
          </template>
        </v-list-item>
      </v-list>

      <!-- Botão para expandir quando em modo rail (apenas desktop) -->
      <template v-if="rail && !mobile" v-slot:append>
        <div class="pa-2">
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            color="white"
            size="small"
            @click.stop="rail = false"
          ></v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Área de Conteúdo Principal -->
    <v-main class="main-content">
      <v-container fluid class="pa-0 main-container">
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import '@/assets/main.css'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { NAVEGACAO, itensVisiveis } from '@/config/navegacao'

// Qual conjunto de menu e qual botão superior usar. Os dois únicos call sites
// são os wrappers `AdminLayout.vue` e `DefaultLayout.vue`, que o router
// referencia por nome desde sempre.
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

const botao = computed(() => NAVEGACAO[props.contexto].botao)

const handleLogout = () => {
  authStore.logout(router)
}

// Estados reativos para controle do drawer
const drawer = ref(true)
const rail = ref(false)
const windowWidth = ref(window.innerWidth)

// Computed para detectar se está em mobile
const mobile = computed(() => windowWidth.value < 960)

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
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// Item sem `perfis` aparece para qualquer sessão, inclusive perfil nulo: é a
// mesma regra do guard, que libera rota sem `meta.perfis`. Ver config/navegacao.js.
const menuItems = computed(() => itensVisiveis(props.contexto, authStore.perfil))

// Nome da seção atual, exibido no header. Sai do próprio menu, sem texto novo.
const currentSection = computed(() => {
  const active = menuItems.value.find((item) => item.to.name === route.name)
  return active ? active.title : ''
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

/* Header */
.app-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-divider {
  width: 1px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.22);
  margin: 0 16px;
}

.header-section {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* Drawer */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
}

.drawer-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.drawer-list {
  padding: 8px 12px;
}

.drawer-item {
  margin-bottom: 4px;
  min-height: 42px;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
  transition: background-color var(--transition), color var(--transition);
}

:deep(.v-navigation-drawer__content) {
  overflow-y: auto;
}

/* Hover discreto */
.drawer-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

/* Item ativo: fundo levemente mais claro + barra lateral */
:deep(.v-list-item--active) {
  background-color: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  font-weight: 600;
}

:deep(.v-list-item--active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background-color: #ffffff;
  opacity: 1;
}

:deep(.v-list-item--active .v-list-item__overlay) {
  opacity: 0;
}

:deep(.v-list-item--active .v-list-item__prepend .v-icon) {
  color: white !important;
  opacity: 1;
}

:deep(.v-list-item__prepend .v-icon) {
  opacity: 0.85;
}

/* Transições suaves */
.v-navigation-drawer {
  transition: width 0.3s ease;
}

/* Lockup horizontal (símbolo + texto em duas linhas): altura menor que a
   do logo antigo, senão encosta nas bordas da barra de 48px. */
.app-logo {
  height: 34px;
  width: auto;
  object-fit: contain;
  margin-left: 20px;
}

/* Ajustes para mobile */
@media (max-width: 959px) {
  .app-logo {
    margin-left: 8px;
    height: 28px;
  }
}
</style>
