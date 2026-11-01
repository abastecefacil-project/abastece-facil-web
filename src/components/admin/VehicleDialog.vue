<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560px"
    scrollable
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @after-leave="$emit('fechado')"
  >
    <v-card>
      <!-- Cabeçalho (REDESIGN §4.6): título e fechar. O X emite o mesmo `close`
           do botão Cancelar. -->
      <v-card-title class="dialogo-cabecalho">
        <h2 class="dialogo-titulo">{{ props.isEditing ? 'Editar veículo' : 'Novo veículo' }}</h2>
        <v-btn
          icon
          variant="text"
          size="small"
          density="comfortable"
          aria-label="Fechar"
          class="dialogo-fechar"
          @click="$emit('close')"
        >
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </v-card-title>

      <v-card-text class="dialogo-corpo">
        <!-- Uma coluna em todas as larguras: cols="12" em todo campo. -->
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

            <v-col v-if="isEditing" cols="12">
              <div class="status-linha">
                <span class="status-linha__rotulo">
                  {{ localVeiculo.active ? 'Veículo ativo' : 'Veículo inativo' }}
                </span>
                <v-switch
                  v-model="localVeiculo.active"
                  color="success"
                  hide-details
                  density="compact"
                  aria-label="Veículo ativo"
                />
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-btn
          class="btn-dialog btn-dialog--cancelar"
          variant="outlined"
          @click="$emit('close')"
        >
          Cancelar
        </v-btn>
        <v-btn
          class="btn-dialog btn-dialog--confirmar"
          variant="flat"
          @click="handleSave"
        >
          {{ props.isEditing ? 'Salvar' : 'Cadastrar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <BaseStatusModal
    v-model="successDialog"
    type="success"
    title="Sucesso!"
    message="Veículo cadastrado com sucesso!"
    @after-leave="$emit('fechado')"
  />

  <BaseStatusModal
    v-model="errorDialog"
    type="error"
    title="Erro!"
    :message="props.isEditing ? 'Não foi possível salvar o veículo.' : 'Não foi possível cadastrar o Veículo. Tente novamente.'"
    @after-leave="$emit('fechado')"
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

const emit = defineEmits(['update:modelValue', 'save', 'close', 'fechado'])

const formatPlaca = (event) => {
  let value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (value.length > 3) {
    value = value.slice(0, 3) + '-' + value.slice(3, 7)
  }
  localVeiculo.value.plate = value
}
</script>

<style scoped>
/* Raio de 16px e sombra de overlay vêm da regra global de diálogo em main.css.
   Forma, cor e responsividade dos botões vêm de .btn-dialog* e .dialog-actions.
   Cabeçalho e corpo no mesmo desenho do UserDialog (REDESIGN §4.6). */

.dialogo-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4) var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.dialogo-titulo {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
}

.dialogo-fechar {
  color: var(--color-text-muted);
}

.dialogo-corpo {
  padding: var(--space-6) !important;
}

/* Status do veículo: linha neutra com borda, no lugar do card verde/vermelho
   com hex fixo. A cor de estado fica só no switch. */
.status-linha {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 52px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.status-linha__rotulo {
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: 500;
  color: var(--color-text);
}

.status-linha :deep(.v-switch) {
  flex: 0 0 auto;
}

@media (max-width: 600px) {
  .dialogo-corpo {
    padding: var(--space-5) !important;
  }
}
</style>
