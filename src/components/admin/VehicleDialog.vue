<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500px"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="pa-6 pb-4">
        <span class="text-h5 font-weight-bold">
          {{ props.isEditing ? 'Editar Veículo' : 'Novo Veículo'
        }}</span>
      </v-card-title>

      <v-card-text class="px-6 py-4">
        <v-form ref="form">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="localVeiculo.plate"
                label="Placa*"
                placeholder="Ex: AAA1234"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Placa é obrigatória']"
                @input="formatPlaca"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="localVeiculo.model"
                label="Modelo*"
                placeholder="Ex: Fiat Uno"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Modelo é obrigatório']"
              ></v-text-field>
            </v-col>
            
            <v-col v-if="isEditing" cols="12" sm="12" md="12">
              <v-card
                :color="localVeiculo.active ? '#008109' : '#C62828'"
                variant="outlined"
                class="pa-3 activation-card-compact"
                :class="{ 'active-card': localVeiculo.active }"
                height="50"
              >
                <div class="d-flex align-center justify-space-between h-100">
                  <span class="text-body-2 font-weight-medium">
                    {{ localVeiculo.active ? 'Veículo Ativo' : 'Veículo Inativo' }}
                  </span>
                  <v-switch
                    v-model="localVeiculo.active"
                    color="success"
                    hide-details
                    density="compact"
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-4 card-actions-custom">
        <v-btn
          variant="outlined"
          size="large"
          rounded="lg"
          @click="$emit('close')"
          color="#424242"
          class="mr-3 cancel-btn"
        >
          CANCELAR
        </v-btn>
        <v-btn 
          size="large" 
          rounded="lg" 
          @click="handleSave" 
          color="#0D47A1" 
          class="save-btn"
        >
          {{ props.isEditing ? 'SALVAR' : 'CADASTRAR' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <BaseStatusModal
    v-model="successDialog"
    type="success"
    title="Sucesso!"
    message="Veículo cadastrado com sucesso!"
  />

  <BaseStatusModal
    v-model="errorDialog"
    type="error"
    title="Erro!"
    message="Não foi possível cadastrar o Veículo. Tente novamente."
  />

</template>

<script setup>
import BaseStatusModal from '../app/BaseStatusModal.vue';
import { createCar, updateCar } from '@/services/vehicleService';
import { ref, watch } from 'vue'

const isLoading = ref(false);
const successDialog = ref(false)
const errorDialog = ref(false)

const props = defineProps({
  modelValue: Boolean,
  isEditing: Boolean,
  veiculo: {
    type: Object,
    default: () => ({}),
  },
})


const form = ref(null)
const localVeiculo = ref({ ...props.veiculo })

// Watch para atualizar o veículo local quando o prop mudar
watch(
  () => props.veiculo,
  (newVeiculo) => {
    localVeiculo.value = { ...newVeiculo,
      active: newVeiculo.status ?? true
    }  
  },
  { deep: true },
)

const handleSave = async () => {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  isLoading.value = true;

  try { 
    const body = {
      licensePlate: localVeiculo.value.plate.replace('-', ''),
      model: localVeiculo.value.model,
      isActive: localVeiculo.value.active
    };

    let response;

    if (props.isEditing) {
      response = await updateCar(localVeiculo.value.id, body);
    } else {
      response = await createCar(body)  
      successDialog.value = true
    }

    const convertedVehicle = {
      id: response.data.id,
      plate: response.data.licensePlate,
      model: response.data.model,
      status: localVeiculo.value.active ? 'ativo' : 'inativo',
    };
    emit('save', convertedVehicle)
  } catch (err) {
      errorDialog.value = true 
  } finally {
    isLoading.value = false;
  }
}

const emit = defineEmits(['update:modelValue', 'save', 'close'])

const formatPlaca = (event) => {
  let value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (value.length > 3) {
    value = value.slice(0, 3) + '-' + value.slice(3, 7)
  }
  localVeiculo.value.plate = value
}
</script>

<style scoped>
:deep(.v-dialog .v-card) {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.save-btn {
  background-color: #0d47a1 !important;
  color: white !important;
  font-weight: bold;
}

.cancel-btn {
  background-color: #424242 !important;
  color: white !important;
  border: 1px solid #424242 !important;
  font-weight: bold;
  margin-right: 0 !important;

}
</style>

<style>

/* Responsividade */
@media (max-width: 600px) {
  :deep(.v-card-actions) {
    flex-direction: row !important;
    justify-content: space-between !important;
    gap: 8px !important;
  }

  .cancel-btn {
    margin-right: 0 !important;
    flex: 1;
  }

  .save-btn {
    flex: 1;
  }
}

</style>
