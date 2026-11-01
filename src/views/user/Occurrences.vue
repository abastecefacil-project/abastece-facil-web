<template>
  <div class="ocorrencia">
    <div class="ocorrencia__conteudo">
      <PageHeader titulo="Nova ocorrência" subtitulo="Registre uma ocorrência com um veículo da frota." />
      <OccurrenceForm />
    </div>
  </div>
</template>

<script setup>
import OccurrenceForm from '@/components/user/OccurrenceForm.vue'
import PageHeader from '@/components/app/PageHeader.vue'
</script>

<style scoped>
/* Fundo e rolagem são do AppShell. Padding da §4.3, igual ao da Início: 32px
   no desktop, 16px abaixo de md. O título e o formulário dividem o mesmo
   contêiner de 720px (largura de formulário da §4.3), e por isso as bordas
   esquerdas coincidem. A partir de md o contêiner é centralizado: formulário de
   tarefa única não deixa uma faixa vazia à direita (REDESIGN §5.10). */
.ocorrencia {
  padding: var(--space-8);
}

.ocorrencia__conteudo {
  max-width: 720px;
}

@media (min-width: 960px) {
  .ocorrencia__conteudo {
    margin-inline: auto;
  }
}

@media (max-width: 959px) {
  .ocorrencia {
    padding: var(--space-4);
  }
}
</style>
