<template>
  <v-dialog 
    :model-value="modelValue" 
    max-width="500px" 
    persistent
    @update:model-value="$emit('update:modelValue', $event)"  
  >
    <v-card class="dialog-card">
      <v-card-title class="pa-6 pb-4">
        <span class="text-h5 font-weight-bold">{{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}</span>
      </v-card-title>

      <v-card-text class="dialog-content">
        <v-form ref="form">
          <div class="form-fields">
            <!-- Campo Nome -->
            <v-text-field
              v-model="localUser.name"
              label="Nome*"
              placeholder="Ex: João Silva"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
              class="form-field"
            ></v-text-field>

            <!-- Campo Email -->
            <v-text-field
              v-model="localUser.email"
              label="Email*"
              placeholder="Ex: joao@email.com"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.email]"
              class="form-field"
            ></v-text-field>

            <!-- Campo Senha -->
            <v-text-field
              v-model="localUser.password"
              :label="isEditing ? 'Senha (deixe em branco para manter)' : 'Senha*'"
              placeholder="Ex: 123456"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.password]"
              :type="showPassword ? 'text' : 'password'"
              class="form-field"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
            ></v-text-field>

            <!-- Campo Confirmar Senha -->
            <v-text-field
              v-if="!isEditing" 
              v-model="confirmPassword"
              label="Confirmar Senha*"
              placeholder="Repita a senha"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.matchPassword]"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-field"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            ></v-text-field>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-4 d-flex justify-end">
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
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleSave" 
        >
          {{ isEditing ? 'SALVAR' : 'CADASTRAR' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

    <BaseStatusModal
    v-model="successDialog"
    type="success"
    title="Sucesso!"
    message="Usuário cadastrado com sucesso!"
  />

  <BaseStatusModal
    v-model="errorDialog"
    type="error"
    title="Erro!"
    message="Não foi possível cadastrar o Usuário. Tente novamente."
  />

</template>

<script setup>
import BaseStatusModal from '../app/BaseStatusModal.vue'
import { ref, watch } from 'vue'
import { createUser } from '@/services/userService'

const isLoading = ref(false)
const successDialog = ref(false)
const errorDialog = ref(false)

const props = defineProps({
  modelValue: Boolean,
  isEditing: Boolean,
  user: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

const form = ref(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const confirmPassword = ref('')
const localUser = ref({ ...props.user })

// === Validações ===
const rules = {
  required: (v) => !!v || 'Campo obrigatório',
  email: (v) => !v || /.+@.+\..+/.test(v) || 'E-mail inválido',
  password: (v) =>
    !v || /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(v) ||
    'A senha deve ter letras e números (mínimo 6 caracteres)',
  matchPassword: () =>
    localUser.value.password === confirmPassword.value ||
    'As senhas não coincidem',
}

// === Salvar Usuário ===
const handleSave = async () => {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  isLoading.value = true
  try {
    const body = {
      name: localUser.value.name,
      email: localUser.value.email,
      password: localUser.value.password,
    }

    const response = await createUser(body)
    emit('save', response.data)
    emit('update:modelValue', false)
    successDialog.value = true
  } catch (err) {
    errorDialog.value = true 
  } finally {
    isLoading.value = false
  }
}

// Atualiza dados locais se o usuário recebido mudar
watch(
  () => props.user,
  (newVal) => {
    localUser.value = { ...newVal }
    confirmPassword.value = ''
  },
  { deep: true },
)
</script>

<style scoped>
.dialog-card {
  border-radius: 12px;
}

.dialog-content {
  padding: 24px !important;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  margin-bottom: 0;
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

/* Responsividade */
@media (max-width: 600px) {
  .dialog-content {
    padding: 20px !important;
  }

  .dialog-actions {
    padding: 12px 20px 20px 20px;
    flex-direction: column-reverse;
  }

  .dialog-actions .v-btn {
    width: 100%;
  }
}
</style>
