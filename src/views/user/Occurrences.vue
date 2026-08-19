<template>
  <div class="occurrences-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <h1 class="page-title">Nova Ocorrência</h1>
      <p class="page-subtitle">Registre uma nova ocorrência no sistema</p>
    </div>
    <!-- Formulário -->
    <OccurrenceForm />
  </div>
  <Footer />
</template>

<script setup>
import OccurrenceForm from '@/components/user/OccurrenceForm.vue'
import Footer from '@/components/app/Footer.vue'
</script>

<style scoped>
.occurrences-container {
  padding: 28px 32px;
  background-color: var(--color-background);
  min-height: 100vh;
}

.page-header {
  max-width: 860px;
  margin: 0 auto 20px;
}

@media (max-width: 768px) {
  .occurrences-container {
    padding: 16px;
  }
}
</style>