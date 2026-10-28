<template>
  <CartaoAcesso>
    <h1 class="acesso-titulo">Entrar</h1>
    <p class="acesso-texto mt-1 mb-8">Acesse com seu e-mail e senha</p>

    <v-form @submit.prevent="handleLogin">
      <!-- Sem asterisco: nesta tela todo campo é obrigatório. As regras
           continuam valendo. -->
      <v-text-field
        v-model="credentials.email"
        label="E-mail"
        type="email"
        autocomplete="username"
        prepend-inner-icon="mdi-email-outline"
        autofocus
        :rules="[rules.required]"
        class="mb-4"
      />

      <v-text-field
        v-model="credentials.password"
        label="Senha"
        autocomplete="current-password"
        prepend-inner-icon="mdi-lock-outline"
        :rules="[rules.required]"
        :type="showPassword ? 'text' : 'password'"
      >
        <template #append-inner>
          <v-btn
            :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            variant="text"
            size="small"
            density="comfortable"
            @click="showPassword = !showPassword"
          />
        </template>
      </v-text-field>

      <div class="d-flex justify-end mt-3">
        <router-link to="/esqueci-senha" class="acesso-link">Esqueci minha senha</router-link>
      </div>

      <v-alert v-if="mensagemErro" type="error" variant="tonal" density="compact" class="mt-4">
        {{ mensagemErro }}
      </v-alert>

      <v-btn type="submit" color="primary" class="acesso-btn mt-6" :loading="entrando">
        Entrar
      </v-btn>
    </v-form>
  </CartaoAcesso>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import CartaoAcesso from '@/components/public/CartaoAcesso.vue'

const authStore = useAuthStore()
const router = useRouter()

const showPassword = ref(false)
const mensagemErro = ref('')
const entrando = ref(false)

const credentials = ref({
  email: '',
  password: '',
})

const MENSAGEM_ERRO_PADRAO = 'Não foi possível entrar. Verifique sua conexão e tente novamente.'

// A store relança `error.response.data`. Só o ErrorResponse do backend traz
// `error` e `message`; sem resposta (falha de rede) o que chega é um TypeError,
// e num 5xx sem corpo chega `undefined` ou o HTML do proxy. Nesses casos a
// mensagem é a padrão, em vez do texto interno do erro.
function mensagemDeErro(err) {
  if (err && typeof err === 'object' && err.error && err.message) return err.message
  return MENSAGEM_ERRO_PADRAO
}

const handleLogin = async () => {
  entrando.value = true
  mensagemErro.value = ''
  try {
    await authStore.login(credentials.value)
    // `homeDoPerfil`, e não `/admin/dashboard` fixo: um colaborador era mandado
    // para o painel e só então ricocheteado pelo guard até a própria home. Mesmo
    // padrão de `AtivacaoConta.vue` e `RedefinirSenha.vue`. Segue `push` e não
    // `replace` — aquelas usam `replace` para tirar o token do histórico, o que
    // não se aplica aqui.
    router.push(authStore.homeDoPerfil)
  } catch (err) {
    mensagemErro.value = mensagemDeErro(err)
  } finally {
    entrando.value = false
  }
}

const rules = {
  required: (v) => !!v || 'Campo obrigatório',
}
</script>
