<template>
  <div class="form-wrapper">
    <v-form ref="formRef">
      <div class="form-card">
        <div class="form-section-header">
          <h2 class="form-section-title">Dados da ocorrência</h2>
          <p class="form-section-hint">Campos marcados com * são obrigatórios</p>
        </div>

        <v-alert v-if="dataError" type="error" variant="tonal" class="mb-4">
          {{ dataError }}
          <v-btn variant="text" @click="loadData" :loading="loadingData">Tentar novamente</v-btn>
        </v-alert>

        <v-row>
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="form.licensePlate"
              :items="vehicles"
              item-title="label"
              item-value="licensePlate"
              label="Veículo*"
              placeholder="Busque pelo modelo ou placa"
              variant="outlined"
              density="comfortable"
              :loading="loadingData"
              :disabled="loadingData || loading"
              :rules="[(v) => !!v || 'Veículo é obrigatório']"
              no-data-text="Nenhum veículo disponível"
              hide-details="auto"
              prepend-inner-icon="mdi-car-info"
            />
          </v-col>

          <!--Nome -->
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="userName"
              readonly
              label="Nome*"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Nome é obrigatório']"
              prepend-inner-icon="mdi-account"
            />
          </v-col>

          <!-- Título -->
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.title"
              :items="titleOptions"
              label="Título*"
              variant="outlined"
              density="comfortable"
              :rules="titleRules"
              prepend-inner-icon="mdi-book-arrow-right"
              menu-icon="mdi-chevron-down"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-menu
              v-model="dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              max-width="300px"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-model="form.date"
                  label="Data*"
                  variant="outlined"
                  density="comfortable"
                  readonly
                  v-bind="props"
                  prepend-inner-icon="mdi-calendar"
                  :rules="[(v) => !!v || 'Data é obrigatória']"
                />
              </template>

              <v-date-picker
                v-model="dateValue"
                color="primary"
                @update:model-value="onDateSelected"
              />
            </v-menu>
          </v-col>

          <v-col v-if="form.title === 'Outro'" cols="12" sm="12">
            <v-text-field
              v-model="form.customTitle"
              label="Outro título"
              placeholder="Digite o título..."
              variant="outlined"
              density="comfortable"
              maxlength="40"
              :rules="[(v) => !!v || 'Informe o título']"
              prepend-inner-icon="mdi-text-box-edit"
            />
          </v-col>

          <!-- Descrição -->
          <v-col cols="12" sm="12">
            <v-textarea
              v-model="form.description"
              label="Descrição"
              placeholder="Descreva a ocorrência com detalhes..."
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              rows="5"
              auto-grow
              counter="500"
              maxlength="500"
              prepend-inner-icon="mdi-text-long"
            />
          </v-col>
        </v-row>

        <!-- Botões -->
        <div class="form-actions">
          <v-btn
            variant="outlined"
            @click="handleClear"
            :disabled="loading"
            class="btn-dialog btn-dialog--cancelar"
          >
            Cancelar
          </v-btn>
          <v-btn
            variant="flat"
            :loading="loading"
            :disabled="loadingData || !!dataError"
            @click="handleSubmit"
            class="btn-dialog btn-dialog--confirmar"
          >
            Cadastrar
          </v-btn>
        </div>
      </div>
    </v-form>

    <BaseStatusModal
      v-model="successDialog"
      type="success"
      title="Sucesso!"
      message="Ocorrência cadastrada com sucesso!"
    />

    <BaseStatusModal
      v-model="errorDialog"
      type="error"
      title="Erro!"
      message="Não foi possível cadastrar a ocorrência. Tente novamente."
    />

  </div>
</template>

<script setup>
import BaseStatusModal from '../app/BaseStatusModal.vue'
import { createOccurrences } from '@/services/occurrenceService'
import { getAvailableCars } from '@/services/vehicleService'
import { getUsuarioAutenticado } from '@/services/userService'
import { ref, reactive, onMounted } from 'vue'

const vehicles = ref([])
const userName = ref('')
const loadingData = ref(true)
const dataError = ref('')
const dateValue = ref(null)

const loadData = async () => {
  loadingData.value = true
  dataError.value = ''
  try {
    const [response, user] = await Promise.all([getAvailableCars(), getUsuarioAutenticado()])
    if (!user?.name) throw new Error('Usuário sem nome')
    vehicles.value = response.data.map((vehicle) => ({
      ...vehicle,
      label: `${vehicle.model} — ${vehicle.licensePlate}`,
    }))
    userName.value = user.name
  } catch {
    dataError.value = 'Não foi possível carregar os veículos e o usuário. Tente novamente.'
  } finally {
    loadingData.value = false
  }
}

onMounted(loadData)

const dateMenu = ref(false)
const formRef = ref(null)
const loading = ref(false)
const successDialog = ref(false)
const errorDialog = ref(false)

const titleOptions = [
  'Combustível Abaixo de Meio Tanque',
  'Veículo com Itens Pessoais',
  'Veículo Sujo Internamente',
  'Devolução Fora do Estacionamento',
  'Outro',
]

const form = reactive({
  licensePlate: '',
  title: '',
  customTitle: '',
  description: '',
  date: '',
})

const titleRules = [
  (v) => !!v || 'Título é obrigatório',
  (v) => (v && v.length >= 3) || 'Mínimo 3 caracteres',
]

const onDateSelected = (val) => {
  if (val) {
    const date = new Date(val)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    form.date = `${day}/${month}/${year}`
    dateMenu.value = false
  }
}

const formatDateToISO = (dateStr) => {
  if (!dateStr) return null

  const [day, month, year] = dateStr.split('/')
  if (!day || !month || !year) return null

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const handleSubmit = async () => {
  if (loadingData.value || dataError.value || loading.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const finalTitle = form.title === 'Outro' ? form.customTitle : form.title
    const body = {
      licensePlate: form.licensePlate.replace('-', ''),
      title: finalTitle,
      description: form.description,
      userName: userName.value,
      occurrenceDate: formatDateToISO(form.date),
    }
    await createOccurrences(body)

    handleClear()
    successDialog.value = true
  } catch (error) {
    errorDialog.value = true 
  } finally {
    loading.value = false
  }
}

const handleClear = () => {
  form.licensePlate = ''
  form.title = ''
  form.customTitle = ''
  form.description = ''
  form.date = ''
  dateValue.value = null
  formRef.value?.resetValidation()
}
</script>

<style scoped>
.form-wrapper {
  background-color: transparent;
  max-width: 860px;
  margin: 0 auto;
}

.form-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 28px 32px 24px;
}

.form-section-header {
  padding-bottom: 16px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
}

.form-section-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 2px 0 0;
}

:deep(.v-field) {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
}

/* Erro discreto: sem cor de fundo, só a borda e a mensagem */
:deep(.v-input--error .v-field__outline) {
  --v-field-border-width: 1px;
}

:deep(.v-messages__message) {
  font-size: 0.75rem;
  line-height: 1.4;
  padding-top: 2px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}

/* Forma e cor dos botões vêm de .btn-dialog*, em assets/main.css. Só os ajustes
   de altura e tipografia por faixa de tela continuam aqui. */

@media (max-width: 768px) {
  .form-card {
    padding: 20px 16px 16px;
    border-radius: var(--radius-md);
  }

  :deep(.v-row) {
    margin: -4px !important;
  }

  :deep(.v-col) {
    padding: 4px !important;
  }

  :deep(.v-input) {
    margin-bottom: 0 !important;
  }

  :deep(.v-field__prepend-inner) {
    padding-top: 8px !important;
  }

  :deep(.v-textarea .v-field__input) {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    min-height: 60px !important;
  }

  :deep(.v-textarea textarea) {
    line-height: 1.4 !important;
  }

  .form-actions {
    justify-content: center;
    margin-top: 8px;
    margin-bottom: 0;
    gap: 8px;
  }

  .btn-dialog {
    flex: 1 1 48%;
    min-width: unset;
    font-size: 0.875rem;
    height: 42px !important;
  }
}

@media (max-width: 480px) {
  .form-card {
    padding: 16px 12px 12px;
  }

  :deep(.v-row) {
    margin: -3px !important;
  }

  :deep(.v-col) {
    padding: 3px !important;
  }

  :deep(.v-field) {
    font-size: 0.9rem;
  }

  :deep(.v-field__input) {
    padding: 8px 12px !important;
    min-height: 44px !important;
  }

  :deep(.v-textarea .v-field__input) {
    min-height: 50px !important;
  }

  .form-actions {
    margin-top: 6px;
    margin-bottom: 0;
    gap: 6px;
  }

  .btn-dialog {
    font-size: 0.8rem;
    height: 40px !important;
  }
}
.success-modal {
  overflow: hidden;
}

.success-icon-wrapper {
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

:deep(.v-dialog) {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
}
</style>
