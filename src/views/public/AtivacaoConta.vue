<template>
  <CartaoAcesso>
    <!-- A sonda não responde de imediato; até lá não há o que decidir. -->
    <div v-if="estado === 'carregando'" class="text-center py-6">
      <v-progress-circular indeterminate color="primary" size="44" width="4" />
      <p class="acesso-texto mt-4">Verificando seu link de ativação...</p>
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

    <!-- Inexistente, expirado, já usado: a API responde igual para todos, de
         propósito, e a tela não tenta adivinhar qual foi. -->
    <div v-else-if="estado === 'invalido'" class="text-center">
      <v-icon icon="mdi-link-variant-off" size="44" class="acesso-icone" />
      <h1 class="acesso-titulo mt-3">Link inválido ou expirado</h1>
      <p class="acesso-texto mt-2">
        Este link de ativação não vale mais — ele pode ter expirado ou já ter sido usado. Procure o
        gestor da sua regional para receber um novo convite.
      </p>
      <router-link to="/login" class="acesso-link d-inline-block mt-6">
        Ir para o login
      </router-link>
    </div>

    <div v-else>
      <h1 class="acesso-titulo text-center">{{ saudacao }}</h1>
      <p class="acesso-texto text-center mt-2 mb-6">
        Crie uma senha para ativar sua conta no Abastece Fácil.
      </p>

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
          Ativar conta
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

const MENSAGEM_ERRO_PADRAO = 'Não foi possível ativar sua conta. Tente novamente.'

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
