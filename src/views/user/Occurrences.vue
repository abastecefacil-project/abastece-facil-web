<template>
  <div class="occurrences-container">
    <PageHeader titulo="Nova Ocorrência" subtitulo="Registre uma nova ocorrência no sistema" />
    <!-- Formulário -->
    <OccurrenceForm />
  </div>
</template>

<script setup>
import OccurrenceForm from '@/components/user/OccurrenceForm.vue'
import PageHeader from '@/components/app/PageHeader.vue'
</script>

<style scoped>
.occurrences-container {
  padding: 28px 32px;
  background-color: var(--color-background);
  min-height: 100vh;
}

@media (max-width: 768px) {
  .occurrences-container {
    padding: 16px;
  }
}
</style>