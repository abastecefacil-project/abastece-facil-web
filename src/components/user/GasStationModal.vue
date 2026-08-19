<template>
  <v-dialog v-model="dialog" max-width="700px">
    <v-card rounded="lg">
      <!-- Header Simples -->
      <v-card-title class="pa-4 d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-bold text-grey-darken-3">Detalhes do Posto</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeModal"></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-5" v-if="props.posto">
        <v-row>
          <!-- Nome -->
          <v-col cols="12" md="6">
            <div class="info-item mb-3">
              <label class="info-label">NOME:</label>
              <p class="info-value">{{ props.posto.name || '-' }}</p>
            </div>
          </v-col>

          <!-- Nome Fantasia -->
          <v-col cols="12" md="6">
            <div class="info-item mb-3">
              <label class="info-label">NOME FANTASIA:</label>
              <p class="info-value">{{ props.posto.fantasyName || '-' }}</p>
            </div>
          </v-col>

          <!-- CNPJ -->
          <v-col cols="12" md="6">
            <div class="info-item mb-3">
              <label class="info-label">CNPJ:</label>
              <p class="info-value">{{ props.posto.cnpj || '-' }}</p>
            </div>
          </v-col>

          <!-- Telefone -->
          <v-col cols="12" md="6">
            <div class="info-item mb-3">
              <label class="info-label">TELEFONE:</label>
              <p class="info-value">{{ props.posto.telefone || '-' }}</p>
            </div>
          </v-col>

          <!-- Endereço Completo Destacado -->
          <v-col cols="12">
            <div class="complete-address-highlight">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="d-flex align-center">
                  <v-icon
                    icon="mdi-map-marker-radius"
                    color="success"
                    size="20"
                    class="mr-2"
                  ></v-icon>
                  <span class="text-subtitle-2 font-weight-bold" style="color: #2e7d32"
                    >ENDEREÇO:</span
                  >
                </div>
                <v-btn
                  icon="mdi-content-copy"
                  variant="text"
                  size="small"
                  color="success"
                  @click="copyAddress"
                >
                  <v-icon size="18"></v-icon>
                  <v-tooltip activator="parent" location="top">Copiar endereço</v-tooltip>
                </v-btn>
              </div>
              <p class="text-body-2 mb-0" style="color: #1b5e20; font-weight: 500">
                {{ props.posto.completeAddress }}, {{ props.posto.cep || '-' }}
              </p>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3 justify-end">
        <v-btn color="grey-darken-3" variant="flat" size="default" @click="closeModal">
          FECHAR
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

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
.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #424242;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.info-value {
  font-size: 15px;
  color: #616161;
  line-height: 1.5;
}

.complete-address-highlight {
  padding: 10px 12px;
  border-left: 4px solid #66bb6a;
  background: linear-gradient(90deg, rgba(232, 245, 233, 0.4) 0%, transparent 100%);
}

/* Responsividade */
@media (max-width: 600px) {
  .info-label {
    font-size: 0.65rem;
  }

  .info-value {
    font-size: 0.9rem;
  }
}
</style>
