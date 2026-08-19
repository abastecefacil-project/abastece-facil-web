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
          class="px-8"
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
  type: { type: String, default: "success" }, // success | error
  title: { type: String, default: "" },
  message: { type: String, default: "" },
})

const emit = defineEmits(["update:modelValue"])

const updateValue = (val) => {
  emit("update:modelValue", val)
}

const icon = computed(() =>
  props.type === "success" ? "mdi-check-circle" : "mdi-close-circle"
)

const iconColor = computed(() =>
  props.type === "success" ? "#4CAF50" : "#F44336"
)
</script>
