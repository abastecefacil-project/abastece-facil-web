<template>
  <v-main class="auth-background">
    <v-container fluid class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="auth-card pa-6 pa-md-8" elevation="4">
            <div class="d-flex justify-center mb-4">
              <img src="@/assets/logo.png" alt="Abastece Fácil Logo" height="65" />
            </div>
            <h1 class="text-h4 text-center font-weight-bold mb-1">Login</h1>

            <p class="text-center text-medium-emphasis mb-6">Bem-vindo ao Abastece Fácil!</p>

            <v-card-text class="pa-0">
              <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-3">
                {{ errorMessage.message }}
              </v-alert>

              <v-form @submit.prevent="handleLogin">
                <v-text-field
                  v-model="credentials.email"
                  label="Email*"
                  prepend-inner-icon="mdi-email-outline"
                  placeholder="Ex: fulano@gmail.com"
                  variant="outlined"
                  :rules="[rules.required]"
                  class="mb-3"
                />

                <v-text-field
                  v-model="credentials.password"
                  label="Senha*"
                  prepend-inner-icon="mdi-lock-outline"
                  placeholder="Ex: Senha123123"
                  variant="outlined"
                  :rules="[rules.required]"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showPassword = !showPassword"
                />

                <v-btn type="submit" color="primary" size="large" class="auth-btn mt-4 text-h6">
                  Entrar
                </v-btn>
              </v-form>

              <div class="text-center mt-6">
                <p class="text-body-2 text-medium-emphasis mb-2">Não é administrador?</p>
                <router-link to="/user/dashboardUser" class="user-link">
                  Acessar como Usuário
                </router-link>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const showPassword = ref(false)
const errorMessage = ref(null)

const credentials = ref({
  email: '',
  password: '',
})

const handleLogin = async () => {
  try {
    await authStore.login(credentials.value)
    router.push('/admin/dashboard')
  } catch (err) {
    errorMessage.value = err
  }
}

const rules = {
  required: (v) => !!v || 'Campo obrigatório',
}
</script>

<style>
:root {
  --card-radius: 20px;
  --input-radius: 10px;
  --primary: #2b76e5;
  --primary-hover: #265fba;
  --text: #0f172a;
  --muted: #6b7280;
  --input-bg: #f3f4f6;
  --input-border: #e5e7eb;
  --shadow: 0 20px 45px rgba(2, 12, 49, 0.12);
}

.auth-background {
  min-height: 100vh;
  background: radial-gradient(
      1200px 400px at 50% -150px,
      #95b3cf 0%,
      #7a98b3 35%,
      #5c7a96 60%,
      #476177 80%,
      #385164 100%
    )
    fixed;
}

.auth-card {
  position: relative;
  border-radius: var(--card-radius) !important;
  box-shadow: var(--shadow) !important;
  overflow: visible;
  padding-top: 36px !important;
}

.auth-card::before {
  display: none !important;
}

:deep(.text-h4) {
  font-weight: 700 !important;
  text-align: center;
}

:deep(.text-medium-emphasis) {
  color: var(--text) !important;
  opacity: 0.85 !important;
  font-weight: 600;
}

:deep(.v-field) {
  border-radius: var(--input-radius) !important;
}
:deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-width: 1px;
}
:deep(.v-field .v-field__overlay) {
  background: var(--input-bg) !important;
  border: 1px solid var(--input-border) !important;
  border-radius: var(--input-radius) !important;
}
:deep(.v-field--focused .v-field__overlay) {
  background: #fff !important;
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 4px rgba(43, 118, 229, 0.15) !important;
}
:deep(.v-label.v-field-label) {
  font-weight: 600;
  color: var(--text) !important;
}
:deep(.v-text-field input::placeholder) {
  color: var(--muted);
}

.auth-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px auto 0;
  padding: 12px 24px !important;
  min-width: 140px;
  border-radius: 10px !important;
  font-weight: 700 !important;
  box-shadow: 0 8px 18px rgba(43, 118, 229, 0.25) !important;
}
.auth-btn:hover {
  background: var(--primary-hover) !important;
}

:deep(img[alt*='Logo']) {
  filter: none;
  margin-top: 6px;
  margin-bottom: 4px;
}

/* Link para dashboard de usuário */
.user-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: inline-block;
}

.user-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}
</style>
