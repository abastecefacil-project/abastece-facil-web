<template>
  <div class="help-center-container">
    <!-- Cabeçalho -->
    <div class="page-header">
      <h1 class="page-title">Central de Ajuda</h1>
      <p class="page-subtitle">Orientações sobre abastecimento e seguro frota</p>
    </div>

    <!-- Seção Abastecimento -->
    <div class="info-section">
      <div class="section-header">
        <v-icon icon="mdi-gas-station" size="28" color="#1976D2"></v-icon>
        <h2 class="section-title">Abastecimento</h2>
      </div>
      <AbastecimentoGuide />
    </div>

    <!-- Seção Seguro -->
    <div class="info-section">
      <div class="section-header">
        <v-icon icon="mdi-shield-check" size="28" color="#1976D2"></v-icon>
        <h2 class="section-title">Seguro Frota Própria</h2>
      </div>
      <SeguroInfo />
    </div>

    <div class="faq-section">
      <h2 class="section-title">Perguntas Frequentes</h2>

      <div class="search-section">
        <v-text-field
          v-model="searchQuery"
          placeholder="Pesquisar dúvidas..."
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          class="search-field"
        ></v-text-field>
      </div>
      <div class="faq-list">
        <FaqItem
          v-for="faq in filteredFaqs"
          :key="faq.id"
          :question="faq.question"
          :answer="faq.answer"
        />
      </div>
      <div v-if="filteredFaqs.length === 0" class="empty-state">
        <v-icon icon="mdi-help-circle-outline" size="64" color="#BDBDBD"></v-icon>
        <h3 class="empty-title">Nenhuma pergunta encontrada</h3>
        <p class="empty-subtitle">Tente ajustar sua pesquisa</p>
      </div>
    </div>
    <ContactSection />
  </div>
  <Footer />
</template>

<script setup>
import { ref, computed } from 'vue'
import AbastecimentoGuide from '@/components/user/AbastecimentoGuide.vue'
import SeguroInfo from '@/components/user/SeguroInfo.vue'
import FaqItem from '@/components/user/FaqItem.vue'
import ContactSection from '@/components/user/ContactSection.vue'
import Footer from '@/components/app/Footer.vue'

const searchQuery = ref('')

const faqs = ref([
  {
    id: 1,
    question: 'Posso usar qualquer tipo de combustível?',
    answer:
      'Sempre abasteça com etanol/álcool. Utilize gasolina somente se o posto não tiver etanol disponível.',
  },
  {
    id: 2,
    question: 'O que fazer se esquecer minha senha de abastecimento?',
    answer:
      'A senha deve ter de 4 a 6 dígitos. Recomenda-se usar o número da matrícula no verso da cracha. Entre em contato com a gestora de frota se precisar redefinir.',
  },
  {
    id: 3,
    question: 'Preciso cadastrar previamente para o primeiro abastecimento?',
    answer:
      'Não, no primeiro abastecimento basta digitar sua senha na maquininha, sem necessidade de cadastro prévio.',
  },
  {
    id: 4,
    question: 'O seguro cobre quais tipos de assistência?',
    answer:
      'O seguro oferece assistência 24h com guincho (KM ilimitado), troca de pneu, carga de bateria, transporte alternativo e chaveiro.',
  },
  {
    id: 5,
    question: 'Qual o limite de quilometragem para o guincho?',
    answer: 'O guincho é ilimitado em quilometragem, disponível 24 horas por dia.',
  },
  {
    id: 6,
    question: 'O que é necessário informar ao acionar o seguro?',
    answer:
      'Você deve registrar o sinistro, fornecer informações solicitadas pelo atendente, solicitar dados do terceiro, registrar boletim de ocorrência e abrir um Comunique informando líder, gestor, gestora de frotas e AGO.',
  },
])

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs.value

  const query = searchQuery.value.toLowerCase()
  return faqs.value.filter(
    (faq) => faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query),
  )
})
</script>

<style scoped>
.help-center-container {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #424242;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1rem;
  color: #757575;
  margin: 0;
  font-weight: 400;
}

.info-section {
  max-width: 1200px;
  margin: 0 auto 32px auto;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #424242;
  margin: 0;
}

.faq-section {
  max-width: 900px;
  margin: 32px auto;
}

.search-section {
  margin-bottom: 20px;
  margin-top: 15px;
}

.search-field :deep(.v-field) {
  background-color: #ffffff;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #616161;
  margin: 16px 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: #9e9e9e;
  margin: 0;
}

@media (max-width: 768px) {
  .help-center-container {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 1.25rem;
  }
}
</style>
