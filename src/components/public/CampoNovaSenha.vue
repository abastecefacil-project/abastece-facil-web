<template>
  <v-text-field
    :model-value="modelValue"
    :label="label"
    prepend-inner-icon="mdi-lock-outline"
    variant="outlined"
    autocomplete="new-password"
    :type="mostrarSenha ? 'text' : 'password'"
    :append-inner-icon="mostrarSenha ? 'mdi-eye' : 'mdi-eye-off'"
    :rules="[regras.obrigatorio, regras.tamanhoMinimo, regras.letraENumero]"
    hint="Mínimo de 10 caracteres, com pelo menos uma letra e um número."
    persistent-hint
    @update:model-value="emit('update:modelValue', $event)"
    @click:append-inner="mostrarSenha = !mostrarSenha"
  />
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Nova senha*' },
})

const emit = defineEmits(['update:modelValue'])

const mostrarSenha = ref(false)

// Conveniência de interface: evita o round-trip óbvio. A política em vigor é a
// do backend (UserValidator.validarSenha), que valida a mesma senha de novo e é
// quem tem a palavra final — inclusive na regra que o cliente não reproduz, a
// de a senha não conter o nome nem o e-mail da pessoa.
const regras = {
  obrigatorio: (v) => !!v || 'Campo obrigatório',
  tamanhoMinimo: (v) => (v || '').length >= 10 || 'A senha precisa ter no mínimo 10 caracteres',
  letraENumero: (v) =>
    (/[a-zA-Z]/.test(v || '') && /\d/.test(v || '')) ||
    'A senha precisa ter pelo menos uma letra e um número',
}
</script>
