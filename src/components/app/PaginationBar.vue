<template>
    <div class="pagination-container">
      <v-pagination
        v-model="current"
        :length="length"
        prev-icon="mdi-chevron-left"
        next-icon="mdi-chevron-right"
        total-visible="1"
        size="small"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>
</template>
  
<script setup>
  import { ref, watch } from 'vue'
  
  const props = defineProps({
    modelValue: Number,
    length: Number,
    loading: Boolean,
  })
  
  const emit = defineEmits(['update:modelValue'])
  
  const current = ref(props.modelValue)
  
  watch(() => props.modelValue, (val) => (current.value = val))
  watch(current, (val) => emit('update:modelValue', val))
</script>
  
<style>
  .pagination-container {
    display: flex;
    justify-content: center;
    padding: 8px 0 24px;
  }

  .v-pagination__item .v-btn,
  .v-pagination__prev .v-btn,
  .v-pagination__next .v-btn {
    background-color: var(--color-surface);
    color: var(--color-text) !important;
    border: 1px solid var(--color-border);
    font-weight: 600;
    box-shadow: none;
    border-radius: var(--radius-sm) !important;
    transition:
      border-color var(--transition),
      background-color var(--transition);
  }

  .v-pagination__item .v-btn:hover,
  .v-pagination__prev .v-btn:hover,
  .v-pagination__next .v-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary) !important;
  }

  /* Vuetify 3 usa --is-active; o seletor antigo (--active) nunca chegava a aplicar */
  .v-pagination__item--is-active .v-btn {
    background-color: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
    color: #ffffff !important;
  }
</style>
  