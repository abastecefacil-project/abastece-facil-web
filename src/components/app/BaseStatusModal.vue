<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="updateValue"
    max-width="450px"
    persistent
  >
    <v-card :class="['status-modal', type]" rounded="lg">
      <v-card-text class="text-center pa-8">
        <div class="status-icon-wrapper">
          <v-icon :size="80" :color="iconColor">
            {{ icon }}
          </v-icon>
        </div>

        <h2 class="text-h5 font-weight-bold mb-3 mt-4">{{ title }}</h2>
        <p class="text-body-1 text-grey-darken-1">{{ message }}</p>
      </v-card-text>

      <v-card-actions class="pb-6 px-6">
        <v-spacer/>
        <v-btn
          :color="iconColor"
          variant="flat"
          size="large"
          rounded="lg"
          :class="['px-8', { 'ok-btn--warning': type === 'warning' }]"
          @click="updateValue(false)"
        >
          OK
        </v-btn>
        <v-spacer/>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  type: { type: String, default: "success" }, // success | warning | error
  title: { type: String, default: "" },
  message: { type: String, default: "" },
})

const emit = defineEmits(["update:modelValue"])

const updateValue = (val) => {
  emit("update:modelValue", val)
}

const icon = computed(() => {
  if (props.type === "success") return "mdi-check-circle"
  if (props.type === "warning") return "mdi-alert-circle"
  return "mdi-close-circle"
})

// O amarelo sai do token --color-warning do main.css, e não de um literal, para
// continuar amarrado ao design system se o valor mudar. O Vuetify aceita
// var(--...) em prop de cor: isCssColor reconhece o prefixo e aplica por style.
const iconColor = computed(() => {
  if (props.type === "success") return "#4CAF50"
  if (props.type === "warning") return "var(--color-warning)"
  return "#F44336"
})
</script>

<style scoped>
/* O Vuetify calcula a cor de texto do botão a partir do fundo, mas só quando o
   fundo é uma cor parseável — isParsableColor rejeita var(--...) de propósito.
   Como o warning usa o token, a cor do texto é declarada aqui em vez de ficar
   herdada por acaso. */
.ok-btn--warning {
  color: var(--color-surface) !important;
}
</style>
