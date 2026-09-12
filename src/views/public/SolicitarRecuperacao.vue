<template>
  <CartaoAcesso>
    <!-- Confirmação. É a MESMA tela e o MESMO texto para e-mail cadastrado e
         não cadastrado — a resposta do backend é um corpo único, e é ela que
         aparece aqui. -->
    <div v-if="estado === 'enviado'" class="text-center">
      <v-icon icon="mdi-email-check-outline" size="44" class="acesso-icone" />
      <h1 class="acesso-titulo mt-3">Verifique seu e-mail</h1>
      <p class="acesso-texto mt-2">{{ mensagemConfirmacao }}</p>
      <router-link to="/login" class="acesso-link d-inline-block mt-6">
        Voltar para o login
      </router-link>
    </div>

    <div v-else>
      <h1 class="acesso-titulo text-center">Esqueci minha senha</h1>
      <p class="acesso-texto text-center mt-2 mb-6">
        Informe o e-mail da sua conta e enviaremos um link para você definir uma senha nova.
      </p>

      <v-alert v-if="mensagemErro" type="error" variant="tonal" class="mb-4">
        {{ mensagemErro }}
      </v-alert>

      <v-form ref="form" @submit.prevent="handleSubmit">
        <v-text-field
          v-model="email"
          label="E-mail*"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          autocomplete="email"
          type="email"
          :rules="[regras.obrigatorio, regras.formato]"
        />

        <v-btn
          type="submit"
          color="primary"
          size="large"
          class="acesso-btn mt-8"
          :loading="enviando"
        >
          Enviar link
        </v-btn>
      </v-form>

      <div class="text-center mt-6">
        <router-link to="/login" class="acesso-link">Voltar para o login</router-link>
      </div>
    </div>
  </CartaoAcesso>
</template>

<script setup>
import { ref } from 'vue'
import authService from '@/services/authService'
import CartaoAcesso from '@/components/public/CartaoAcesso.vue'

// formulario → enviado. Não há sonda a esperar, então esta tela não tem os
// estados `carregando` e `indisponivel` da RedefinirSenha: falha de rede aqui é
// um erro do envio, não um veredito sobre um link.
const estado = ref('formulario')
const email = ref('')
const enviando = ref(false)
const mensagemErro = ref('')
const mensagemConfirmacao = ref('')
const form = ref(null)

const MENSAGEM_CONFIRMACAO_PADRAO =
  'Se houver uma conta com este e-mail, enviaremos as instruções de redefinição de senha em ' +
  'instantes. Verifique também a caixa de spam.'

const MENSAGEM_ERRO_PADRAO =
  'Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.'

// Padrão de três camadas do projeto: tabela de código → `message` do backend →
// default local. LIMITE_SOLICITACOES_EXCEDIDO entra na tabela de propósito,
// porque a mensagem do backend descreve os números do limite (quantas por
// e-mail, quantas por IP) e isso é o que serve para calibrar um ataque. O
// usuário legítimo só precisa saber que deve esperar. Tratar o 429 como sucesso
// seria pior: mentiria dizendo que o e-mail saiu, e a pessoa ficaria esperando
// algo que nunca chega.
const MENSAGENS_POR_ERRO = {
  LIMITE_SOLICITACOES_EXCEDIDO: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
}

function mensagemDeErro(err) {
  const corpo = err?.response?.data
  const codigo = corpo?.error
  if (codigo && MENSAGENS_POR_ERRO[codigo]) return MENSAGENS_POR_ERRO[codigo]
  if (corpo?.message) return corpo.message
  return MENSAGEM_ERRO_PADRAO
}

// Só formato, nunca existência. Uma checagem de "e-mail cadastrado" — mesmo
// assíncrona, mesmo só para habilitar o botão — devolveria pelo cliente o
// oráculo que o backend do S4 se deu ao trabalho de fechar: lá os casos são
// indistinguíveis pelo corpo, pelo status e pelo tempo, e o único jeito de
// desfazer isso é aqui.
const regras = {
  obrigatorio: (v) => !!v || 'Campo obrigatório',
  formato: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '') || 'Informe um e-mail válido',
}

async function handleSubmit() {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  enviando.value = true
  mensagemErro.value = ''
  try {
    const data = await authService.solicitarRecuperacao(email.value)
    // O texto vem do backend para não haver duas versões dele: é lá que a
    // formulação condicional ("se houver uma conta") foi decidida.
    mensagemConfirmacao.value = data?.message || MENSAGEM_CONFIRMACAO_PADRAO
    estado.value = 'enviado'
  } catch (err) {
    mensagemErro.value = mensagemDeErro(err)
  } finally {
    enviando.value = false
  }
}
</script>
