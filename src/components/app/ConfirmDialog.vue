<!-- ConfirmDialog.vue -->
<template>
    <v-dialog v-model="dialogModel" max-width="480" persistent>
      <v-card class="modal-card">
        <v-card-title class="modal-title">
          Confirmar Exclusão
        </v-card-title>
  
        <v-card-text class="modal-text">
          Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.
        </v-card-text>
  
        <v-card-actions class="modal-actions">
          <v-btn
            class="btn-cancelar"
            variant="flat"
            @click="handleCancel"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="btn-confirmar"
            variant="flat"
            @click="handleConfirm"
          >
            Sim
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    modelValue: {
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
  
  .modal-actions {
    padding: 16px 24px 24px !important;
    gap: 12px;
  }
  
  .btn-cancelar {
    background-color: rgb(175, 171, 171) !important;
    color: white !important;
    text-transform: none !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    letter-spacing: normal !important;
    min-width: 100px !important;
    padding: 10px 24px !important;
    height: auto !important;
  }
  
  .btn-cancelar:hover {
    background-color: #635d5d !important;
  }
  
  .btn-confirmar {
    background-color:#c50606 !important;
    color: white !important;
    text-transform: none !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    letter-spacing: normal !important;
    min-width: 100px !important;
    padding: 10px 24px !important;
    height: auto !important;
  }
  
  .btn-confirmar:hover {
    background-color: #920606 !important;
  }
  
  @media (max-width: 640px) {
    .modal-title {
      font-size: 18px !important;
      padding: 20px 20px 12px !important;
    }
  
    .modal-text {
      font-size: 15px !important;
      padding: 20px !important;
    }
  
    .modal-actions {
      padding: 12px 20px 20px !important;
      flex-direction: column-reverse !important;
    }
  
    .btn-cancelar,
    .btn-confirmar {
      width: 100% !important;
      min-width: unset !important;
    }
  }
  </style>