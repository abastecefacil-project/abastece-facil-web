<template>
  <v-dialog v-model="dialog" max-width="560px" scrollable>
    <v-card v-if="props.posto">
      <!-- Cabeçalho (REDESIGN §4.6): título e fechar. -->
      <v-card-title class="dialogo-cabecalho">
        <div class="dialogo-titulos">
          <h2 class="dialogo-titulo">{{ linha.nome }}</h2>
          <p v-if="linha.cidadeUf" class="dialogo-subtitulo">{{ linha.cidadeUf }}</p>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          density="comfortable"
          aria-label="Fechar"
          class="dialogo-fechar"
          @click="closeModal"
        >
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </v-card-title>

      <v-card-text class="dialogo-corpo">
        <!-- Os mesmos formatadores da lista (utils/postoExibicao.js). -->
        <dl class="ficha">
          <div class="ficha__item">
            <dt>Razão social</dt>
            <dd>{{ nomeProprio(props.posto.name) || NAO_INFORMADO }}</dd>
          </div>
          <div class="ficha__item">
            <dt>Nome fantasia</dt>
            <dd v-if="props.posto.fantasyName">{{ nomeProprio(props.posto.fantasyName) }}</dd>
            <dd v-else class="horario-nao-informado">{{ NAO_INFORMADO }}</dd>
          </div>
          <div class="ficha__item">
            <dt>CNPJ</dt>
            <dd class="tabular">{{ props.posto.cnpj || NAO_INFORMADO }}</dd>
          </div>
          <div class="ficha__item">
            <dt>Telefone</dt>
            <dd v-if="linha.telefone">
              <a :href="hrefTelefone(linha.telefone)" class="ficha__link tabular">{{ linha.telefone }}</a>
            </dd>
            <dd v-else class="horario-nao-informado">{{ TELEFONE_NAO_INFORMADO }}</dd>
          </div>
          <div class="ficha__item ficha__item--largo">
            <dt>Horário</dt>
            <dd v-if="linha.horario" class="tabular">{{ linha.horario }}</dd>
            <dd v-else class="horario-nao-informado">{{ HORARIO_NAO_INFORMADO }}</dd>
          </div>
        </dl>

        <div class="endereco">
          <div class="endereco__textos">
            <p class="endereco__rotulo">Endereço</p>
            <p class="endereco__texto">{{ linha.enderecoCompleto }}</p>
            <p v-if="props.posto.cep" class="endereco__cep tabular">CEP {{ props.posto.cep }}</p>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            density="comfortable"
            aria-label="Copiar endereço"
            class="endereco__copiar"
            @click="copyAddress"
          >
            <v-icon icon="mdi-content-copy" size="18" />
            <v-tooltip activator="parent" location="top">Copiar endereço</v-tooltip>
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-btn class="btn-dialog btn-dialog--cancelar" variant="outlined" @click="closeModal">
          Fechar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { TELEFONE_NAO_INFORMADO, hrefTelefone, nomeProprio } from '@/utils/formatacao'
import { HORARIO_NAO_INFORMADO } from '@/utils/posto'
import { apresentacaoLinhaPosto } from '@/utils/postoExibicao'

const NAO_INFORMADO = 'Não informado'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  posto: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const dialog = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal
  },
)

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

const linha = computed(() => (props.posto ? apresentacaoLinhaPosto(props.posto) : {}))

const closeModal = () => {
  dialog.value = false
}

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(props.posto.completeAddress)
    console.log('Endereço copiado!')
  } catch (err) {
    console.error('Erro ao copiar:', err)
  }
}
</script>

<style scoped>
/* Raio de 16px e sombra de overlay vêm da regra global de diálogo em main.css.
   Forma e cor do "Fechar" vêm de .btn-dialog* e .dialog-actions. */

.dialogo-cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4) var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  white-space: normal;
}

.dialogo-titulos {
  min-width: 0;
}

.dialogo-titulo {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
  overflow-wrap: anywhere;
}

.dialogo-subtitulo {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

.dialogo-fechar {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.dialogo-corpo {
  padding: var(--space-6) !important;
}

/* Ficha: rótulo em caption neutral-600, sentence case; valor em body. */
.ficha {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4) var(--space-6);
  margin: 0;
}

.ficha__item--largo {
  grid-column: 1 / -1;
}

.ficha dt,
.endereco__rotulo {
  margin: 0 0 2px;
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 600;
  color: var(--color-text-muted);
}

.ficha dd {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text);
  overflow-wrap: anywhere;
}

/* Mesmo estilo de valor vazio da lista, no tamanho do valor. */
.ficha dd.horario-nao-informado {
  color: var(--color-neutral-500);
}

.ficha__link {
  color: var(--color-blue-600);
  font-weight: 500;
  text-decoration: none;
}

.ficha__link:hover {
  text-decoration: underline;
}

.tabular {
  font-variant-numeric: tabular-nums;
}

/* Endereço em bloco neutro, com o copiar ao lado. */
.endereco {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.endereco__textos {
  flex: 1;
  min-width: 0;
}

.endereco p {
  margin: 0;
}

.endereco__texto {
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.endereco__cep {
  margin-top: 2px !important;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.endereco__copiar {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.endereco__copiar:hover {
  color: var(--color-primary);
}

@media (max-width: 599px) {
  .dialogo-corpo {
    padding: var(--space-5) !important;
  }

  .ficha {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
