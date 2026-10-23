<template>
  <v-menu v-model="aberto" :close-on-content-click="false" location="bottom end" max-width="420">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon variant="text" color="white" :aria-label="`Notificações: ${naoLidas} não lidas`">
        <v-badge :content="naoLidas > 99 ? '99+' : naoLidas" :model-value="naoLidas > 0" color="error">
          <v-icon icon="mdi-bell-outline" />
        </v-badge>
      </v-btn>
    </template>
    <v-card class="notificacoes">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Notificações</span>
        <v-btn icon="mdi-refresh" variant="text" size="small" aria-label="Atualizar notificações" :loading="carregando" @click="carregar" />
      </v-card-title>
      <v-divider />
      <v-card-text class="notificacoes-conteudo">
        <v-alert v-if="erro" type="error" variant="tonal" density="compact" class="mb-3">{{ erro }}</v-alert>
        <p v-if="!carregando && !erro && !itens.length" class="text-medium-emphasis">Nenhuma notificação ainda.</p>
        <article v-for="item in itens" :key="item.id" :class="['notificacao', { 'notificacao--nova': !item.lida }]">
          <div class="d-flex align-center ga-2 mb-2">
            <v-icon icon="mdi-credit-card-remove-outline" color="error" size="20" />
            <strong>Recusa do cartão Neo</strong>
            <v-chip v-if="!item.lida" size="x-small" color="primary">Nova</v-chip>
            <v-chip v-else size="x-small" variant="tonal">Lida</v-chip>
          </div>
          <p><strong>{{ item.usuarioNome }}</strong> relatou que o Neo não passou no posto <strong>{{ item.postoNome }}</strong>.</p>
          <time class="text-caption text-medium-emphasis" :datetime="item.criadoEm">{{ new Date(item.criadoEm).toLocaleString('pt-BR') }}</time>
          <div class="d-flex flex-wrap ga-1 mt-2">
            <v-btn variant="tonal" color="primary" size="small" :disabled="ocupado || carregando" @click="executar(item, true)">Analisar posto</v-btn>
            <v-btn v-if="!item.lida" variant="text" size="small" :disabled="ocupado || carregando" @click="executar(item, false)">Marcar como lida</v-btn>
          </div>
        </article>
      </v-card-text>
      <v-card-actions v-if="totalPaginas > 1" class="justify-space-between">
        <v-btn :disabled="pagina === 0 || carregando || ocupado" @click="mudarPagina(pagina - 1)">Anterior</v-btn>
        <span class="text-caption">{{ pagina + 1 }} / {{ totalPaginas }}</span>
        <v-btn :disabled="pagina + 1 >= totalPaginas || carregando || ocupado" @click="mudarPagina(pagina + 1)">Próxima</v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getNotificacoesNeo, marcarNotificacaoNeoLida } from '@/services/notificacaoService'

const router = useRouter()
const aberto = ref(false)
const itens = ref([])
const naoLidas = ref(0)
const pagina = ref(0)
const totalPaginas = ref(0)
const carregando = ref(false)
const ocupado = ref(false)
const erro = ref('')
let intervalo
let desmontado = false

async function carregar() {
  if (carregando.value || ocupado.value) return
  carregando.value = true
  try {
    const { data } = await getNotificacoesNeo(pagina.value)
    if (desmontado) return
    itens.value = data.pagina.content
    totalPaginas.value = data.pagina.totalPages
    naoLidas.value = data.naoLidas
    erro.value = ''
  } catch {
    if (!desmontado) erro.value = 'Não foi possível carregar as notificações. Tente atualizar.'
  } finally {
    carregando.value = false
  }
}

function mudarPagina(valor) {
  if (carregando.value || ocupado.value) return
  pagina.value = valor
  carregar()
}

async function executar(item, analisarPosto) {
  if (ocupado.value || carregando.value) return
  ocupado.value = true
  try {
    if (!item.lida) {
      await marcarNotificacaoNeoLida(item.id)
      if (desmontado) return
      item.lida = true
      naoLidas.value = Math.max(0, naoLidas.value - 1)
    }
    if (analisarPosto) {
      await router.push({ name: 'StationAdmin', query: { posto: String(item.postoId) } })
      aberto.value = false
    }
    erro.value = ''
  } catch {
    erro.value = 'Não foi possível abrir ou atualizar a notificação. Tente novamente.'
  } finally {
    ocupado.value = false
  }
}

watch(aberto, (valor) => { if (valor) carregar() })
onMounted(() => {
  carregar()
  intervalo = window.setInterval(() => { if (!document.hidden && !ocupado.value) carregar() }, 30000)
})
onUnmounted(() => {
  desmontado = true
  window.clearInterval(intervalo)
})
</script>

<style scoped>
.notificacoes { width: 420px; max-width: calc(100vw - 32px); }
.notificacoes-conteudo { max-height: 60vh; overflow-y: auto; }
.notificacao { padding: 16px 12px; border-bottom: 1px solid var(--color-border); overflow-wrap: anywhere; }
.notificacao:last-child { border-bottom: 0; }
.notificacao--nova { background: var(--color-primary-soft); border-radius: var(--radius-sm); }
.notificacao p { font-size: 0.875rem; line-height: 1.5; margin-bottom: 8px; }
</style>
