<!-- ConfirmDialog.vue -->
<template>
    <v-dialog v-model="dialogModel" max-width="480" persistent>
      <v-card class="modal-card">
        <v-card-title class="modal-title">
          {{ tituloExibido }}
        </v-card-title>
  
        <v-card-text class="modal-text">
          {{ mensagemExibida }}
        </v-card-text>
  
        <v-card-actions class="dialog-actions">
          <v-btn
            class="btn-dialog btn-dialog--cancelar"
            variant="outlined"
            :disabled="loading"
            @click="handleCancel"
          >
            {{ cancelText }}
          </v-btn>
          <!-- A cor sai do modificador, nunca da prop `color`: o Vuetify a
               converte em .bg-<cor>, que é !important e venceria o CSS. -->
          <v-btn
            :class="[
              'btn-dialog',
              confirmTone === 'primary' ? 'btn-dialog--confirmar' : 'btn-dialog--perigo',
            ]"
            variant="flat"
            :loading="loading"
            @click="handleConfirm"
          >
            {{ textoConfirmar }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  // title, message, confirmText, cancelText, confirmTone e loading são aditivos:
  // sem eles, os textos são os que o componente sempre teve, então as telas que
  // o usam sem passar nada continuam funcionando sem alteração.
  //
  // `objeto` nomeia o que vai ser excluído (REDESIGN §4.6), com artigo e tipo:
  // "o posto Posto Delta". Com ele, e sem title/message/confirmText explícitos,
  // o título vira "Excluir o posto Posto Delta?" e o botão, "Excluir".
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: ''
    },
    objeto: {
      type: String,
      default: ''
    },
    cancelText: {
      type: String,
      default: 'Cancelar'
    },
    // 'danger' (default, vermelho de exclusão) | 'primary' (azul, ação não destrutiva)
    confirmTone: {
      type: String,
      default: 'danger'
    },
    loading: {
      type: Boolean,
      default: false
    }
  })
  
  const emit = defineEmits(['update:modelValue', 'confirm'])
  
  const dialogModel = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })
  
  const tituloExibido = computed(() =>
    props.title || (props.objeto ? `Excluir ${props.objeto}?` : 'Confirmar Exclusão')
  )

  const mensagemExibida = computed(() => {
    if (props.message) return props.message
    return props.objeto
      ? 'Esta ação não poderá ser desfeita.'
      : 'Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.'
  })

  const textoConfirmar = computed(() => props.confirmText || (props.objeto ? 'Excluir' : 'Sim'))

  const handleConfirm = () => {
    emit('confirm')
  }
  
  const handleCancel = () => {
    dialogModel.value = false
  }
  </script>
  
  <style scoped>
  /* O raio de 16px e a sombra de overlay vêm da regra global de diálogo em
     main.css. */
  .modal-title {
    font-size: var(--text-section-title-size) !important;
    line-height: var(--text-section-title-line) !important;
    font-weight: var(--text-section-title-weight) !important;
    color: var(--color-neutral-900) !important;
    white-space: normal;
    padding: 24px 24px 16px !important;
    border-bottom: 1px solid var(--color-border);
  }
  
  .modal-text {
    font-size: var(--text-body-lg-size) !important;
    line-height: var(--text-body-lg-line) !important;
    color: var(--color-text) !important;
    padding: 24px !important;
  }
  
  /* Forma, cor e responsividade dos botões vêm de .btn-dialog* e .dialog-actions,
     em assets/main.css, compartilhadas com os demais diálogos do sistema. */
  
  @media (max-width: 640px) {
    .modal-title {
      padding: 20px 20px 12px !important;
    }
  
    .modal-text {
      padding: 20px !important;
    }
  }
  </style>
