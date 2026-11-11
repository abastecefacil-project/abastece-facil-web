<template>
  <v-btn
    ref="botao"
    variant="outlined"
    class="btn-secundario"
    prepend-icon="mdi-file-excel-outline"
    :loading="exportando"
    :disabled="exportando || desabilitado"
    @click="exportar"
  >
    Exportar
  </v-btn>

  <BaseStatusModal
    v-model="modalErro"
    type="error"
    title="Erro ao exportar"
    :message="mensagemErro"
    @after-leave="botao?.$el.focus()"
  />
</template>

<script setup>
// Botão "Exportar" das listagens do admin (Ocorrências, Usuários, Postos e
// Veículos). A tela passa os filtros da última carga da lista; permissão e
// escopo de regional são do backend.
import { ref } from 'vue'
import BaseStatusModal from '@/components/app/BaseStatusModal.vue'
import { baixarExportacao } from '@/services/exportacaoService'
import { mensagemErroExportacao } from '@/utils/exportacao'

const props = defineProps({
  caminho: { type: String, required: true },
  params: { type: Object, default: () => ({}) },
  entidade: { type: String, required: true },
  desabilitado: { type: Boolean, default: false },
})

const botao = ref(null)
const exportando = ref(false)
const modalErro = ref(false)
const mensagemErro = ref('')

async function exportar() {
  if (exportando.value) return
  exportando.value = true
  try {
    await baixarExportacao(props.caminho, props.params, props.entidade)
  } catch (erro) {
    mensagemErro.value = await mensagemErroExportacao(erro)
    modalErro.value = true
  } finally {
    exportando.value = false
  }
}
</script>

<style scoped>
/* Botão secundário (REDESIGN §4.6), igual ao das telas. Fica aqui porque o
   componente tem duas raízes e não herda o data-v de quem o usa. */
.v-btn.btn-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}
</style>
