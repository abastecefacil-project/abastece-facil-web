<template>
  <v-main class="ativacao-background">
    <v-container fluid class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="ativacao-card pa-6 pa-md-8" elevation="4">
            <div class="d-flex justify-center mb-6">
              <img src="@/assets/logo.png" alt="Abastece Fácil" height="65" />
            </div>

            <!-- A sonda não responde de imediato; até lá não há o que decidir. -->
            <div v-if="estado === 'carregando'" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" size="44" width="4" />
              <p class="ativacao-texto mt-4">Verificando seu link de ativação...</p>
            </div>

            <!-- Falha da consulta, não do token: dizer "expirado" aqui seria mentira. -->
            <div v-else-if="estado === 'indisponivel'" class="text-center">
              <v-icon icon="mdi-wifi-off" size="44" class="ativacao-icone" />
              <h1 class="ativacao-titulo mt-3">Não foi possível verificar o link</h1>
              <p class="ativacao-texto mt-2">
                Houve uma falha na comunicação com o sistema. Verifique sua conexão e tente
                novamente.
              </p>
              <v-btn color="primary" size="large" class="ativacao-btn mt-6" @click="validarToken">
                Tentar novamente
              </v-btn>
            </div>

            <!-- Inexistente, expirado, já usado: a API responde igual para todos, de
                 propósito, e a tela não tenta adivinhar qual foi. -->
            <div v-else-if="estado === 'invalido'" class="text-center">
              <v-icon icon="mdi-link-variant-off" size="44" class="ativacao-icone" />
              <h1 class="ativacao-titulo mt-3">Link inválido ou expirado</h1>
              <p class="ativacao-texto mt-2">
                Este link de ativação não vale mais — ele pode ter expirado ou já ter sido usado.
                Procure o gestor da sua regional para receber um novo convite.
              </p>
              <router-link to="/login" class="ativacao-link d-inline-block mt-6">
                Ir para o login
              </router-link>
            </div>

            <div v-else>
              <h1 class="ativacao-titulo text-center">{{ saudacao }}</h1>
              <p class="ativacao-texto text-center mt-2 mb-6">
                Crie uma senha para ativar sua conta no Abastece Fácil.
              </p>

              <v-alert v-if="mensagemErro" type="error" variant="tonal" class="mb-4">
                {{ mensagemErro }}
              </v-alert>

              <v-form ref="form" @submit.prevent="handleSubmit">
                <v-text-field
                  v-model="senha"
                  label="Nova senha*"
                  prepend-inner-icon="mdi-lock-outline"
                  variant="outlined"
                  autocomplete="new-password"
                  :type="mostrarSenha ? 'text' : 'password'"
                  :append-inner-icon="mostrarSenha ? 'mdi-eye' : 'mdi-eye-off'"
                  :rules="[regras.obrigatorio, regras.tamanhoMinimo, regras.letraENumero]"
                  hint="Mínimo de 10 caracteres, com pelo menos uma letra e um número."
                  persistent-hint
                  @click:append-inner="mostrarSenha = !mostrarSenha"
                />

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  class="ativacao-btn mt-8"
                  :loading="enviando"
                >
                  Ativar conta
                </v-btn>
              </v-form>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/authService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const MENSAGEM_ERRO_PADRAO = 'Não foi possível ativar sua conta. Tente novamente.'

// carregando → indisponivel | invalido | formulario
const estado = ref('carregando')
const nome = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const enviando = ref(false)
const mensagemErro = ref('')
const form = ref(null)

// Query repetida (?token=a&token=b) chega como array; nesse caso não há token
// utilizável, e o fluxo termina na mesma tela de link inválido.
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const saudacao = computed(() => (nome.value ? `Olá, ${nome.value}!` : 'Olá!'))

// A sonda responde 200 sempre, inclusive para token inválido — quem decide é o
// campo `valido`, não o status. E ela não consome o token, então recarregar a
// página não queima o convite.
async function validarToken() {
  if (!token.value) {
    estado.value = 'invalido'
    return
  }

  estado.value = 'carregando'
  try {
    const data = await authService.validarTokenAtivacao(token.value)
    if (!data?.valido) {
      estado.value = 'invalido'
      return
    }
    nome.value = data.nome ?? ''
    estado.value = 'formulario'
  } catch {
    estado.value = 'indisponivel'
  }
}

onMounted(validarToken)

// Conveniência de interface: evita o round-trip óbvio. A política em vigor é a
// do backend, que valida a mesma senha de novo e é quem tem a palavra final.
const regras = {
  obrigatorio: (v) => !!v || 'Campo obrigatório',
  tamanhoMinimo: (v) => (v || '').length >= 10 || 'A senha precisa ter no mínimo 10 caracteres',
  letraENumero: (v) =>
    (/[a-zA-Z]/.test(v || '') && /\d/.test(v || '')) ||
    'A senha precisa ter pelo menos uma letra e um número',
}

// O token não pode sobrar na barra de endereços nem na entrada do histórico
// depois de consumido — daí replaceState, que substitui a entrada atual em vez
// de empilhar outra.
function limparTokenDaUrl() {
  window.history.replaceState(window.history.state, '', window.location.pathname)
}

async function handleSubmit() {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  enviando.value = true
  mensagemErro.value = ''
  try {
    await authStore.ativarConta({ token: token.value, senha: senha.value })
    limparTokenDaUrl()
    await router.replace(authStore.homeDoPerfil)
  } catch (err) {
    const corpo = err?.response?.data

    // 410: o token morreu entre a sonda e o envio. O formulário não serve mais
    // para nada, então a tela inteira vira a mensagem de link expirado.
    if (corpo?.error === 'TOKEN_INVALIDO') {
      estado.value = 'invalido'
      return
    }

    // SENHA_FRACA (400) traz a política violada no `message`; reescrever aqui
    // trocaria a explicação por uma mensagem genérica.
    mensagemErro.value = corpo?.message || MENSAGEM_ERRO_PADRAO
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
/* A estética acompanha o Login: são as duas telas públicas, e o usuário chega
   nelas pelo mesmo caminho. O gradiente repete o de lá de propósito; o resto
   sai dos tokens do main.css. O <style> do Login.vue é global, mas o chunk dele
   só carrega em /login — por isso as classes são redefinidas aqui, escopadas. */
.ativacao-background {
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

.ativacao-card {
  border-radius: 20px !important;
  box-shadow: 0 20px 45px rgba(2, 12, 49, 0.12) !important;
}

.ativacao-titulo {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.ativacao-texto {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
}

.ativacao-icone {
  color: var(--color-warning);
}

.ativacao-btn {
  display: flex;
  margin: 0 auto;
  min-width: 180px;
  font-weight: 700 !important;
}

.ativacao-link {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
  transition: color var(--transition);
}

.ativacao-link:hover {
  text-decoration: underline;
}

:deep(.v-field) {
  border-radius: var(--radius-md) !important;
}
</style>
