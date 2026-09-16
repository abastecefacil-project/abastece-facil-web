<template>
  <CartaoAcesso>
    <!-- A sonda não responde de imediato; até lá não há o que decidir. -->
    <div v-if="estado === 'carregando'" class="text-center py-6">
      <v-progress-circular indeterminate color="primary" size="44" width="4" />
      <p class="acesso-texto mt-4">Verificando seu link de redefinição...</p>
    </div>

    <!-- Falha da consulta, não do token: dizer "expirado" aqui seria mentira. -->
    <div v-else-if="estado === 'indisponivel'" class="text-center">
      <v-icon icon="mdi-wifi-off" size="44" class="acesso-icone" />
      <h1 class="acesso-titulo mt-3">Não foi possível verificar o link</h1>
      <p class="acesso-texto mt-2">
        Houve uma falha na comunicação com o sistema. Verifique sua conexão e tente novamente.
      </p>
      <v-btn color="primary" size="large" class="acesso-btn mt-6" @click="validarToken">
        Tentar novamente
      </v-btn>
    </div>

    <!-- Inexistente, expirado, já usado, ou de outra finalidade — um token de
         ativação colado aqui, por exemplo. A API responde igual para os quatro,
         de propósito, e a tela não tenta adivinhar qual foi. -->
    <div v-else-if="estado === 'invalido'" class="text-center">
      <v-icon icon="mdi-link-variant-off" size="44" class="acesso-icone" />
      <h1 class="acesso-titulo mt-3">Link inválido ou expirado</h1>
      <p class="acesso-texto mt-2">
        Este link de redefinição não vale mais — ele vale por pouco tempo e só pode ser usado uma
        vez. Peça um link novo para continuar.
      </p>
      <!-- Diferente da ativação, onde a saída é procurar o gestor: aqui a
           pessoa se resolve sozinha, e o caminho é a própria tela do pedido. -->
      <router-link to="/esqueci-senha" class="acesso-link d-inline-block mt-6">
        Pedir um novo link
      </router-link>
    </div>

    <div v-else>
      <h1 class="acesso-titulo text-center">{{ saudacao }}</h1>
      <p class="acesso-texto text-center mt-2 mb-6">Escolha uma nova senha para sua conta.</p>

      <v-alert v-if="mensagemErro" type="error" variant="tonal" class="mb-4">
        {{ mensagemErro }}
      </v-alert>

      <v-form ref="form" @submit.prevent="handleSubmit">
        <CampoNovaSenha v-model="senha" />

        <v-btn
          type="submit"
          color="primary"
          size="large"
          class="acesso-btn mt-8"
          :loading="enviando"
        >
          Redefinir senha
        </v-btn>
      </v-form>
    </div>
  </CartaoAcesso>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/authService'
import CartaoAcesso from '@/components/public/CartaoAcesso.vue'
import CampoNovaSenha from '@/components/public/CampoNovaSenha.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const MENSAGEM_ERRO_PADRAO = 'Não foi possível redefinir sua senha. Tente novamente.'

// carregando → indisponivel | invalido | formulario
const estado = ref('carregando')
const nome = ref('')
const senha = ref('')
const enviando = ref(false)
const mensagemErro = ref('')
const form = ref(null)

// Query repetida (?token=a&token=b) chega como array; nesse caso não há token
// utilizável, e o fluxo termina na mesma tela de link inválido.
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const saudacao = computed(() => (nome.value ? `Olá, ${nome.value}!` : 'Olá!'))

// A sonda responde 200 sempre, inclusive para token inválido — quem decide é o
// campo `valido`, não o status. E ela não consome o token, então recarregar a
// página não queima o link.
async function validarToken() {
  if (!token.value) {
    estado.value = 'invalido'
    return
  }

  estado.value = 'carregando'
  try {
    const data = await authService.validarTokenRecuperacao(token.value)
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
    await authStore.redefinirSenha({ token: token.value, senha: senha.value })
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

    // SENHA_FRACA (400) traz a política violada no `message` — inclusive a
    // regra que o cliente não reproduz, a de não conter o nome nem o e-mail.
    // Reescrever aqui trocaria a explicação por uma mensagem genérica.
    mensagemErro.value = corpo?.message || MENSAGEM_ERRO_PADRAO
  } finally {
    enviando.value = false
  }
}
</script>
