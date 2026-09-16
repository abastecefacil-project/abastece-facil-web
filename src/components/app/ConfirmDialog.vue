<!-- ConfirmDialog.vue -->
<template>
    <v-dialog v-model="dialogModel" max-width="480" persistent>
      <v-card class="modal-card">
        <v-card-title class="modal-title">
          {{ title }}
        </v-card-title>
  
        <v-card-text class="modal-text">
          {{ message }}
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
            {{ confirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  // title, message, confirmText, cancelText, confirmTone e loading são aditivos:
  // os defaults reproduzem o texto que o componente já tinha, então as telas que
  // o usam sem passar nada continuam funcionando sem alteração.
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirmar Exclusão'
    },
    message: {
      type: String,
      default: 'Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.'
    },
    confirmText: {
      type: String,
      default: 'Sim'
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
  
  const handleConfirm = () => {
    emit('confirm')
  }
  
  const handleCancel = () => {
    dialogModel.value = false
  }
  </script>
  
  <style scoped>
  .modal-card {
    border-radius: 8px !important;
  }
  
  .modal-title {
    font-size: 20px !important;
    font-weight: 600 !important;
    color: #212121 !important;
    padding: 24px 24px 16px !important;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .modal-text {
    font-size: 16px !important;
    line-height: 1.5 !important;
    color: #424242 !important;
    padding: 24px !important;
  }
  
  /* Forma, cor e responsividade dos botões vêm de .btn-dialog* e .dialog-actions,
     em assets/main.css, compartilhadas com os demais diálogos do sistema. */
  
  @media (max-width: 640px) {
    .modal-title {
      font-size: 18px !important;
      padding: 20px 20px 12px !important;
    }
  
    .modal-text {
      font-size: 15px !important;
      padding: 20px !important;
    }
  }
  </style>
