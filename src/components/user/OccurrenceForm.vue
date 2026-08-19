<template>
  <div class="form-wrapper">
    <v-form ref="formRef">
      <div class="form-card">
        <div class="form-section-header">
          <h2 class="form-section-title">Dados da ocorrência</h2>
          <p class="form-section-hint">Campos marcados com * são obrigatórios</p>
        </div>

        <v-row>
          <!-- Placa -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.licensePlate"
              label="Placa*"
              placeholder="ABC-1234"
              variant="outlined"
              density="comfortable"
              :rules="licensePlateRules"
              hide-details="auto"
              @input="formatLicensePlate"
              prepend-inner-icon="mdi-car-info"
            />
          </v-col>

          <!--Nome -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.name"
              label="Nome*"
              placeholder="Seu nome completo"
              variant="outlined"
              density="comfortable"
              maxlength="20"
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
            class="cancel-btn"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="handleSubmit"
            class="submit-btn"
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
import { ref, reactive } from 'vue'

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
  name: '',
  date: '',
})

const licensePlateRules = [
  (v) => !!v || 'Placa é obrigatória',
  (v) => {
    if (!v) return false
    const value = v.toUpperCase().trim()

    const oldFormat = /^[A-Z]{3}-?\d{4}$/
    const newFormat = /^[A-Z]{3}-?\d[A-Z]\d{2}$/

    return (
      oldFormat.test(value) ||
      newFormat.test(value) ||
      'Formato inválido. Use "AAA-0000" ou "ABC1D23"'
    )
  },
]

const titleRules = [
  (v) => !!v || 'Título é obrigatório',
  (v) => (v && v.length >= 3) || 'Mínimo 3 caracteres',
]

const formatLicensePlate = () => {
  let value = form.licensePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (value.length > 3 && value.length <= 7 && /^[A-Z]{3}[0-9]/.test(value)) {
    value = value.slice(0, 3) + '-' + value.slice(3, 7)
  }
  form.licensePlate = value.slice(0, 8)
}

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
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const finalTitle = form.title === 'Outro' ? form.customTitle : form.title
    const body = {
      licensePlate: form.licensePlate.replace('-', ''),
      title: finalTitle,
      description: form.description,
      userName: form.name,
      occurrenceDate: formatDateToISO(form.date),
    }
    const response = await createOccurrences(body)

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
  form.name = ''
  form.date = ''
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

.cancel-btn,
.submit-btn {
  min-width: 130px;
  height: 42px;
  font-weight: 600;
  letter-spacing: 0;
}

.cancel-btn {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.cancel-btn:hover {
  border-color: var(--color-text-muted);
  background-color: rgba(31, 41, 51, 0.04);
}

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

  .cancel-btn,
  .submit-btn {
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

  .cancel-btn,
  .submit-btn {
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
