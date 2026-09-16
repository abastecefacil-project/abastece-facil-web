<template>
  <div class="dashboard-header mb-6">
    <h1 class="page-title">Bem-vindo ao Abastece Fácil!</h1>
    <p class="page-subtitle">Abastecer nunca foi tão simples.</p>
  </div>
</template>

<script setup>
// Componente do cabeçalho do dashboard
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 24px;
}

@media (max-width: 600px) {
  .dashboard-header {
    margin-bottom: 20px;
    text-align: center;
  }

  .dashboard-header p {
    display: none;
  }

  .page-title {
    padding-top: 10px;
    padding-inline: 10%;
    margin: 0;
  }
}
</style>
