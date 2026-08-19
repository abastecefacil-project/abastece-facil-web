<template>
  <v-dialog
    :model-value="modelValue"
    max-width="800px"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <!-- Título -->
      <v-card-title class="pa-6 pb-4">
        <span class="text-h5 font-weight-bold">
          {{ props.isEditing ? 'Editar Posto' : 'Novo Posto' }}
        </span>
      </v-card-title>

      <!-- Conteúdo -->
      <v-card-text class="px-6 py-4">
        <v-form ref="form">
          <!-- Nome e Nome Fantasia -->
          <v-row dense>
            <v-col cols="12" sm="6" md="6">
              <v-text-field
                v-model="localPosto.name"
                class="small-input"
                label="Nome*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Nome é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="6">
              <v-text-field
                v-model="localPosto.fantasyName"
                class="small-input"
                label="Nome Fantasia"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

          <!-- CNPJ e Telefone -->
            <v-col cols="6" sm="5" md="6">
              <v-text-field
                v-model="localPosto.cnpj"
                class="small-input"
                label="CNPJ*"
                variant="outlined"
                density="comfortable"
                maxlength="18"
                :rules="[(v) => !!v || 'CNPJ é obrigatório']"
                @input="formatCnpj"
              ></v-text-field>
            </v-col>
            <v-col cols="6" sm="4" md="6">
              <v-text-field
                v-model="localPosto.phone"
                class="small-input"
                label="Telefone"
                variant="outlined"
                density="comfortable"
                @input="formatPhone"
              ></v-text-field>
            </v-col>

          <!-- CEP e Endereço na mesma linha -->
            <v-col cols="4" sm="3" md="3">
              <v-text-field
                v-model="localPosto.cep"
                class="small-input"
                label="CEP*"
                style="font-size: 2px;"
                variant="outlined"
                density="comfortable"
                maxlength="9"
                :rules="[(v) => !!v || 'CEP é obrigatório']"
                :error="cepNotFound"
                :error-messages="cepNotFound ? ['CEP não encontrado'] : []"
                @input="formatCep"
                @blur="searchCep"
              />
            </v-col>
            <v-col cols="8" sm="9" md="7">
              <v-text-field
                v-model="localPosto.address"
                class="small-input"
                label="Endereço*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Endereço é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="4" sm="3" md="2">
              <v-text-field
                v-model="localPosto.number"
                class="small-input"
                label="Numero*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Numero é obrigatório']"
              ></v-text-field>
            </v-col>          

          <!-- Bairro, Cidade e Estado -->
            <v-col cols="8" sm="5" md="6">
              <v-text-field
                v-model="localPosto.district"
                class="small-input"
                label="Bairro*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Bairro é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="8" sm="5" md="4">
              <v-text-field
                v-model="localPosto.city"
                class="small-input"
                label="Cidade*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Cidade é obrigatória']"
              ></v-text-field>
            </v-col>
            <v-col cols="4" sm="2" md="2">
              <v-text-field
                v-model="localPosto.state"
                class="small-input"
                label="Estado*"
                variant="outlined"
                density="comfortable"
                maxlength="2"
                :rules="[(v) => !!v || 'Estado é obrigatório']"
              ></v-text-field>
            </v-col>

          <!-- Horário de Funcionamento e Switch de Ativação -->
            <v-col 
              :cols="isEditing ? 6 : 6"
              :sm="isEditing ? 4 : 6"
              :md="isEditing ? 4 : 6"
            >
              <v-text-field
                v-model="localPosto.openTime"
                class="small-input"
                label="Horário de Abertura"
                type="time"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
            
            <v-col
              :cols="isEditing ? 6 : 6"
              :sm="isEditing ? 4 : 6"
              :md="isEditing ? 4 : 6"
            >
              <v-text-field
                v-model="localPosto.closeTime"
                class="small-input"
                label="Horário de Fechamento"
                type="time"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
            
            <!-- Switch de Ativação Compacto -->
            <v-col v-if="isEditing" cols="12" sm="4" md="4">
              <v-card
                :color="localPosto.active ? '#008109' : '#C62828'"
                variant="outlined"
                class="pa-3 activation-card-compact"
                :class="{ 'active-card': localPosto.active }"
                height="50"
              >
                <div class="d-flex align-center justify-space-between h-100">
                  <span class="text-body-2 font-weight-medium">
                    {{ localPosto.active ? 'Posto Ativo' : 'Posto Inativo' }}
                  </span>
                  <v-switch
                    v-model="localPosto.active"
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

      <!-- Ações -->
      <v-card-actions class="px-6 pb-6 pt-4 card-actions-custom">
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
          color="#0D47A1"
          class="save-btn"
          @click="handleSave"
          :loading="isLoading"
          :disabled="isLoading"
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
    message="Posto cadastrado com sucesso!"
  />

  <BaseStatusModal
    v-model="errorDialog"
    type="error"
    title="Erro!"
    message="Não foi possível cadastrar o Posto. Tente novamente."
  />

</template>

<script setup>
import BaseStatusModal from '../app/BaseStatusModal.vue';
import { ref, watch } from 'vue'
import { createStation, updateStation, getAddressByCep } from '@/services/stationService';

const isLoading = ref(false);
const successDialog = ref(false)
const errorDialog = ref(false)

const props = defineProps({
  modelValue: Boolean,
  isEditing: Boolean,
  posto: {
    type: Object,
    default: () => ({}),
  },
})

const cepNotFound = ref(false);
const form = ref(null)
const localPosto = ref({
  ...props.posto,
  openTime: props.posto.openTime || '06:00',
  closeTime: props.posto.closeTime || '22:00',
  active: props.posto.active ?? false
})  

//Busca dados pelo cep
async function searchCep() {
  if(!localPosto.value.cep || localPosto.value.cep.length < 8) return;

  try {
    const response = await getAddressByCep(localPosto.value.cep);
    const data = response.data;
    if (!data.cep) {
      cepNotFound.value = true;
      return
    }
    if(data) {
      cepNotFound.value = false;
      localPosto.value.address = data.logradouro;
      localPosto.value.district = data.bairro;
      localPosto.value.city = data.localidade;
      localPosto.value.state = data.uf;
    }

  } catch(err) {
    cepNotFound.value = true;
    console.error("Erro ao buscar CEP", err)
  }
}

//Cadastra Postos
const handleSave = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;

   isLoading.value = true;

  try {
    const body = {
      name: localPosto.value.name,
      fantasyName: localPosto.value.fantasyName,
      cnpj: localPosto.value.cnpj,
      cep: localPosto.value.cep,
      address: `${localPosto.value.address}, ${localPosto.value.number}`,
      district: localPosto.value.district,
      city: localPosto.value.city,
      state: localPosto.value.state,
      phone: localPosto.value.phone, 
      businessHours: `${localPosto.value.openTime} - ${localPosto.value.closeTime}`,
      isActive: localPosto.value.active
    };

    let response;

    if (props.isEditing) {
      response = await updateStation(localPosto.value.id, body);
    } else {
      response = await createStation(body);
      successDialog.value = true
    }

    emit('save', response.data);
    emit('update:modelValue', false);

  } catch (err) {
      errorDialog.value = true 
  }  finally {
    isLoading.value = false;
  }
};

const emit = defineEmits(['update:modelValue', 'save', 'close'])

watch(
  () => props.posto,
  (newPosto) => {
    localPosto.value = {
      ...newPosto,
      openTime: newPosto.openTime || '00:00',
      closeTime: newPosto.closeTime || '00:00',
      active: newPosto.status ?? true
    }
  },
  { deep: true },
)

const formatCep = (event) => {
  cepNotFound.value = false;
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 5) {
    value = value.slice(0, 5) + '-' + value.slice(5, 8)
  }
  localPosto.value.cep = value
}

const formatCnpj = (event) => {
  let value = event.target.value.replace(/\D/g, '')

  if (value.length > 2) {
    value = value.slice(0, 2) + '.' + value.slice(2)
  }
  if (value.length > 6) {
    value = value.slice(0, 6) + '.' + value.slice(6)
  }
  if (value.length > 10) {
    value = value.slice(0, 10) + '/' + value.slice(10)
  }
  if (value.length > 15) {
    value = value.slice(0, 15) + '-' + value.slice(15, 17)
  }

  localPosto.value.cnpj = value
}

const formatPhone = (event) => {
  let value = event.target.value.replace(/\D/g, '')

  if (value.length > 0) {
    value = '(' + value
  }
  if (value.length > 3) {
    value = value.slice(0, 3) + ') ' + value.slice(3)
  }
  if (value.length > 10) {
    // 11 dígitos (celular)
    value = value.slice(0, 10) + '-' + value.slice(10, 14)
  } else if (value.length > 9) {
    // 10 dígitos (fixo)
    value = value.slice(0, 9) + '-' + value.slice(9, 13)
  }

  localPosto.value.phone = value
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
}

/* Estilos do Card de Ativação Compacto */
.activation-card-compact {
  transition: all 0.3s ease;
  border-width: 2px;
  
}

.activation-card-compact.active-card {
  border-color: #4CAF50 !important;
  background-color: rgba(76, 175, 80, 0.08) !important;
}

.activation-card-compact :deep(.v-switch) {
  flex: 0 0 auto;
}

.activation-card-compact :deep(.v-switch__track) {
  height: 20px;
  width: 40px;
}

.activation-card-compact :deep(.v-switch__thumb) {
  height: 16px;
  width: 16px;
}

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
