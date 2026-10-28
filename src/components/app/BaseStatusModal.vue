<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="updateValue"
    max-width="450px"
    persistent
  >
    <v-card :class="['status-modal', type]">
      <v-card-text class="text-center pa-8">
        <div class="status-icon-wrapper">
          <v-icon :size="80" :class="['status-icone', `status-icone--${tipo}`]">
            {{ icon }}
          </v-icon>
        </div>

        <h2 class="status-titulo mb-3 mt-4">{{ title }}</h2>
        <p class="status-mensagem">{{ message }}</p>
      </v-card-text>

      <v-card-actions class="pb-6 px-6">
        <v-spacer/>
        <!-- Botão sempre primário (REDESIGN §4.6): o status já está no ícone.
             Antes a cor do status pintava o botão, e o de aviso ficava com texto
             branco sobre âmbar, abaixo de 4,5:1. Sem prop `color`, que o Vuetify
             converteria em .bg-<cor> com !important. -->
        <v-btn
          variant="flat"
          class="btn-dialog btn-dialog--confirmar"
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

// Tipo desconhecido cai em erro, como antes.
const tipo = computed(() => (["success", "warning"].includes(props.type) ? props.type : "error"))

const icon = computed(() => {
  if (tipo.value === "success") return "mdi-check-circle"
  if (tipo.value === "warning") return "mdi-alert-circle"
  return "mdi-close-circle"
})
</script>

<style scoped>
/* A cor do status fica só no ícone, com as variantes -icon dos tokens: elas
   garantem 3:1 sobre o branco, o mínimo para elemento gráfico. */
.status-icone--success {
  color: var(--color-success-icon);
}

.status-icone--warning {
  color: var(--color-warning-icon);
}

.status-icone--error {
  color: var(--color-error-icon);
}

.status-titulo {
  color: var(--color-neutral-900);
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
}

.status-mensagem {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-body-lg-size);
  line-height: var(--text-body-lg-line);
}
</style>
