<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <!-- Seção Como Usar o Sistema -->
      <div class="onboarding-section">
        <div class="section-header mb-5 text-center">
          <v-icon icon="mdi-help-circle" color="primary" size="32" class="mb-2"></v-icon>
          <h2 class="text-h5 font-weight-bold text-grey-darken-2">O que você precisa fazer?</h2>
          <p class="text-body-2 text-grey mt-2">
            Consulte postos, registre ocorrências do veículo e encontre orientações para abastecer.
          </p>
        </div>

        <v-row>
          <v-col v-for="guide in guideSteps" :key="guide.step" cols="12" md="6">
            <DashboardCard
              :step="guide.step"
              :title="guide.title"
              :description="guide.description"
              :icon="guide.icon"
              :to="guide.to"
            />
          </v-col>
        </v-row>
      </div>
    </div>
  </div>
  <Footer />
</template>

<script setup>
import Footer from '@/components/app/Footer.vue'
import DashboardCard from '@/components/user/DashboardCard.vue'

const guideSteps = [
  {
    step: 1,
    title: 'Consultar postos',
    description:
      'Busque postos por nome ou cidade e consulte os detalhes de cada estabelecimento.',
    icon: 'mdi-gas-station',
    to: { name: 'UserGasStations' },
  },
  {
    step: 2,
    title: 'Explorar o mapa',
    description:
      'Localize postos, consulte rotas e informe se o cartão Neo passou ou não no seu abastecimento.',
    icon: 'mdi-map-marker',
    to: { name: 'MapUser' },
  },
  {
    step: 3,
    title: 'Registrar ocorrência do veículo',
    description:
      'Relate situações como veículo sujo, itens pessoais esquecidos ou devolução fora do estacionamento para a gestão da frota.',
    icon: 'mdi-alert-circle',
    to: { name: 'OccurrencesUser' },
  },
  {
    step: 4,
    title: 'Consultar orientações',
    description:
      'Veja orientações sobre abastecimento, seguro da frota e contatos de suporte na Central de Ajuda.',
    icon: 'mdi-tooltip-question',
    to: { name: 'HelpCenter' },
  },
]
</script>

<style scoped>
.dashboard-wrapper {
  background-color: var(--color-background);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.dashboard-container {
  padding: 48px 24px;
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.section-header {
  margin-bottom: 14px;
}

@media (max-width: 960px) {
  .dashboard-container {
    padding: 32px 16px;
  }

  .onboarding-section {
    margin-top: 24px;
  }
}

@media (max-width: 600px) {
  .dashboard-container {
    padding: 24px 12px;
  }

  .onboarding-section {
    margin-top: 16px;
  }
}
</style>
