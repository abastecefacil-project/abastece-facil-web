<template>
  <v-dialog :model-value="true" max-width="560" :persistent="salvando" aria-labelledby="titulo-avaliacoes" @update:model-value="fechar">
    <v-card>
      <v-card-title class="avaliacoes-header">
        <div>
          <h2 id="titulo-avaliacoes">Avaliações do posto</h2>
          <p>{{ nomeProprio(nomeExibicaoPosto(posto)) }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" aria-label="Fechar" :disabled="salvando" @click="fechar" />
      </v-card-title>
      <v-card-text class="avaliacoes-conteudo">
        <v-progress-linear v-if="carregando" indeterminate aria-label="Carregando avaliações" />
        <v-alert v-if="erro" type="error" variant="tonal" class="mb-3">{{ erro }}</v-alert>
        <v-btn v-if="falhaCarga" variant="outlined" @click="carregar()">Tentar novamente</v-btn>
        <template v-if="resumo && !falhaCarga">
          <section aria-label="Resumo das avaliações" aria-live="polite">
            <p class="avaliacoes-media"><v-icon icon="mdi-star" color="amber-darken-2" />
              <strong>{{ resumo.total ? resumo.media.toFixed(1) : 'Sem avaliações' }}</strong>
              <span v-if="resumo.total"> · {{ resumo.total }} {{ resumo.total === 1 ? 'avaliação' : 'avaliações' }}</span>
            </p>
          </section>
          <section class="avaliacoes-formulario" aria-labelledby="sua-avaliacao">
            <h3 id="sua-avaliacao">Sua avaliação</h3>
            <v-rating v-model="nota" :length="5" color="amber-darken-2" active-color="amber-darken-2"
              :disabled="salvando || carregando" item-aria-label="Dar {0} de {1} estrelas" aria-label="Sua nota de 1 a 5 estrelas" />
            <v-textarea v-model="comentario" label="Comentário (opcional)" variant="outlined" rows="3"
              maxlength="1000" counter="1000" :disabled="salvando || carregando" />
            <v-btn v-if="resumo.minhaAvaliacao" variant="text" :disabled="salvando || carregando" @click="remover">Remover minha avaliação</v-btn>
          </section>
          <v-alert v-if="sucesso" type="success" variant="tonal" class="my-3" role="status">{{ sucesso }}</v-alert>
          <section aria-labelledby="avaliacoes-recentes" :aria-busy="carregando">
            <h3 id="avaliacoes-recentes">Avaliações dos usuários</h3>
            <p v-if="!resumo.total">Seja a primeira pessoa a avaliar este posto.</p>
            <article v-for="(avaliacao, indice) in resumo.avaliacoes.content" :key="indice" class="avaliacao-relato">
              <strong>{{ avaliacao.autor }}</strong>
              <div class="avaliacao-metadata">
                <v-rating :model-value="avaliacao.nota" readonly density="compact" size="small" color="amber-darken-2"
                  :aria-label="`${avaliacao.nota} de 5 estrelas`" />
                <time>{{ new Date(avaliacao.atualizadoEm).toLocaleDateString('pt-BR') }}</time>
              </div>
              <p v-if="avaliacao.comentario" class="avaliacao-comentario">{{ avaliacao.comentario }}</p>
            </article>
            <div v-if="resumo.avaliacoes.totalPages > 1" class="avaliacoes-paginacao">
              <v-btn variant="text" :disabled="carregando || salvando || pagina === 0" @click="carregar(pagina - 1)">Anterior</v-btn>
              <span>{{ pagina + 1 }} / {{ resumo.avaliacoes.totalPages }}</span>
              <v-btn variant="text" :disabled="carregando || salvando || resumo.avaliacoes.last" @click="carregar(pagina + 1)">Próxima</v-btn>
            </div>
          </section>
        </template>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-btn class="btn-dialog btn-dialog--cancelar" variant="outlined" :disabled="salvando" @click="fechar">Fechar</v-btn>
        <v-btn class="btn-dialog btn-dialog--confirmar" variant="flat" :loading="salvando"
          :disabled="carregando || falhaCarga || !resumo || !nota || comentario.length > 1000" @click="salvar">Salvar avaliação</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getAvaliacoesPosto, salvarAvaliacaoPosto, removerAvaliacaoPosto } from '@/services/stationService'
import { nomeExibicaoPosto } from '@/utils/posto'
import { nomeProprio } from '@/utils/formatacao'

const props = defineProps({ posto: { type: Object, required: true } })
const emit = defineEmits(['fechar', 'atualizar'])
const resumo = ref(null)
const nota = ref(0)
const comentario = ref('')
const pagina = ref(0)
const carregando = ref(true)
const salvando = ref(false)
const falhaCarga = ref(false)
const erro = ref('')
const sucesso = ref('')

function fechar() {
  if (!salvando.value) emit('fechar')
}

async function carregar(page = 0) {
  carregando.value = true
  erro.value = ''
  try {
    const { data } = await getAvaliacoesPosto(props.posto.id, page)
    if (!resumo.value) {
      nota.value = data.minhaAvaliacao?.nota ?? 0
      comentario.value = data.minhaAvaliacao?.comentario ?? ''
    }
    resumo.value = data
    pagina.value = page
    falhaCarga.value = false
  } catch {
    falhaCarga.value = !resumo.value
    erro.value = 'Não foi possível carregar as avaliações. Tente novamente.'
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  if (!Number.isInteger(nota.value) || nota.value < 1 || nota.value > 5 || comentario.value.length > 1000) return
  salvando.value = true
  erro.value = ''
  sucesso.value = ''
  try {
    const { data } = await salvarAvaliacaoPosto(props.posto.id, nota.value, comentario.value)
    resumo.value = data
    pagina.value = 0
    sucesso.value = 'Avaliação salva!'
    emit('atualizar', { postoId: props.posto.id, media: data.media, total: data.total })
  } catch {
    erro.value = 'Não foi possível salvar sua avaliação. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

async function remover() {
  salvando.value = true
  erro.value = ''
  sucesso.value = ''
  try {
    const { data } = await removerAvaliacaoPosto(props.posto.id)
    resumo.value = data
    pagina.value = 0
    nota.value = 0
    comentario.value = ''
    sucesso.value = 'Avaliação removida.'
    emit('atualizar', { postoId: props.posto.id, media: data.media, total: data.total })
  } catch {
    erro.value = 'Não foi possível remover sua avaliação. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

onMounted(() => carregar())
</script>

<style scoped>
.avaliacoes-header { display: flex; justify-content: space-between; align-items: center; white-space: normal; gap: var(--space-3); }
.avaliacoes-header h2 { font-size: var(--text-section-title-size); margin: 0; }
.avaliacoes-header p { font-size: var(--text-body-sm-size); color: var(--color-text-muted); margin: 0; }
.avaliacoes-conteudo { overflow-y: auto; }
.avaliacoes-media { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); }
.avaliacoes-formulario, .avaliacao-relato { border-top: 1px solid var(--color-border); padding-top: var(--space-4); margin-top: var(--space-4); }
h3 { font-size: var(--text-card-title-size); margin-bottom: var(--space-3); }
.avaliacoes-formulario { margin-bottom: var(--space-5); }
.avaliacao-metadata, .avaliacoes-paginacao { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.avaliacao-metadata time { font-size: var(--text-body-sm-size); color: var(--color-text-muted); }
.avaliacao-comentario { white-space: pre-wrap; overflow-wrap: anywhere; margin-top: var(--space-2); }
</style>
