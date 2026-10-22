<template>
  <div class="dashboard-header">
    <h1 class="page-title">Painel</h1>
    <p v-if="subtitulo" class="page-subtitle">{{ subtitulo }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { subtituloPainel } from '@/utils/dashboard'

// O perfil vem da store, pela view: nada aqui chama /api/users/me.
const props = defineProps({
  perfil: { type: String, default: null },
  carregadoEm: { type: Date, default: null },
})

const subtitulo = computed(() => subtituloPainel(props.perfil, props.carregadoEm))
</script>

<style scoped>
.dashboard-header .page-subtitle {
  margin-top: 4px;
}
</style>
