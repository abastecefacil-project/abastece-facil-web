<template>
  <v-main class="acesso-background">
    <v-container fluid class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="acesso-card pa-6 pa-md-8" elevation="4">
            <div class="d-flex justify-center mb-6">
              <img src="@/assets/logo.png" alt="Abastece Fácil" height="65" />
            </div>
            <slot />
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
// Casca das telas públicas de acesso: login por link de e-mail, ativação de
// conta e recuperação de senha. Nasceu no S6a dentro de AtivacaoConta.vue e foi
// extraída no S6b, quando duas telas passaram a precisar dela — antes disso
// seria especulação.
</script>

<style scoped>
/* A estética acompanha o Login: são as telas públicas, e o usuário chega nelas
   pelo mesmo caminho. O gradiente repete o de lá de propósito; o resto sai dos
   tokens do main.css. O <style> do Login.vue é global, mas o chunk dele só
   carrega em /login — por isso as classes são redefinidas aqui, escopadas.

   As classes de tipografia usam :deep() porque o conteúdo de <slot> é compilado
   com o data-v do PAI, não com o deste componente: um seletor escopado normal
   não alcançaria nada do que as views passam para dentro do card. Já
   .acesso-background e .acesso-card estão em elementos do próprio template e
   dispensam o :deep(). */
.acesso-background {
  min-height: 100vh;
  background: radial-gradient(
      1200px 400px at 50% -150px,
      #95b3cf 0%,
      #7a98b3 35%,
      #5c7a96 60%,
      #476177 80%,
      #385164 100%
    )
    fixed;
}

.acesso-card {
  border-radius: 20px !important;
  box-shadow: 0 20px 45px rgba(2, 12, 49, 0.12) !important;
}

:deep(.acesso-titulo) {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

:deep(.acesso-texto) {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
}

:deep(.acesso-icone) {
  color: var(--color-warning);
}

:deep(.acesso-btn) {
  display: flex;
  margin: 0 auto;
  min-width: 180px;
  font-weight: 700 !important;
}

:deep(.acesso-link) {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
  transition: color var(--transition);
}

:deep(.acesso-link:hover) {
  text-decoration: underline;
}

:deep(.v-field) {
  border-radius: var(--radius-md) !important;
}
</style>
