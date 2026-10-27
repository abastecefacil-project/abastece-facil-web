<template>
  <div class="contact-section">
    <div class="contact-card">
      <div class="card-header">
        <v-icon icon="mdi-headset" size="32" color="#1976D2"></v-icon>
        <h3 class="card-title">Precisa de mais informações?</h3>
      </div>
      
      <p class="card-description">
        Para dúvidas adicionais ou situações específicas, entre em contato:
      </p>

      <div class="contact-methods">
        <div class="contact-item">
          <v-icon icon="mdi-phone" color="#757575" size="20"></v-icon>
          <div class="contact-info">
            <span class="contact-label">Assistência 24 Horas (Seguro)</span>
            <span class="contact-value">0800 602 0088</span>
          </div>
        </div>

        <div class="contact-item">
          <v-icon icon="mdi-whatsapp" color="#25D366" size="20"></v-icon>
          <div class="contact-info">
            <span class="contact-label">WhatsApp (Seguro)</span>
            <span class="contact-value">(51) 99993-1300</span>
          </div>
        </div>

        <p v-if="carregando" role="status">Carregando contatos da gestão de frota...</p>
        <div v-else-if="erro" role="alert">
          <p>Não foi possível carregar os contatos da gestão de frota.</p>
          <v-btn variant="text" @click="carregarGestores">Tentar novamente</v-btn>
        </div>
        <template v-else>
          <component
            v-for="(gestor, index) in contatos"
            :key="index"
            :is="gestor.url ? 'a' : 'div'"
            class="contact-item"
            :class="{ 'contact-item--link': gestor.url }"
            :href="gestor.url || undefined"
            :target="gestor.url ? '_blank' : undefined"
            :rel="gestor.url ? 'noopener noreferrer' : undefined"
            :aria-label="gestor.url ? `Falar com ${gestor.nome} pelo WhatsApp (abre em nova aba)` : undefined"
          >
            <v-icon :icon="gestor.url ? 'mdi-whatsapp' : 'mdi-account-tie'" :color="gestor.url ? '#25D366' : '#757575'" size="20"></v-icon>
            <div class="contact-info">
              <span class="contact-label">Gestão de frota da sua regional</span>
              <span class="contact-value">{{ gestor.nome }}</span>
              <span v-if="gestor.url" class="contact-value">{{ gestor.telefone }}</span>
              <span class="contact-detalhe">
                {{ gestor.url ? 'Falar pelo WhatsApp sobre abastecimento, reembolsos e veículos' : 'Telefone não disponível para contato pelo WhatsApp.' }}
              </span>
            </div>
            <v-icon v-if="gestor.url" icon="mdi-open-in-new" size="18" class="contact-externo"></v-icon>
          </component>
          <div v-if="!contatos.length" class="contact-item">
            <v-icon icon="mdi-account-tie" color="#757575" size="20"></v-icon>
            <div class="contact-info">
              <span class="contact-label">Gestão de frota da sua regional</span>
              <span class="contact-value">Nenhum gestor de frota ativo vinculado à sua regional.</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getGestoresDaMinhaRegional } from '@/services/userService'
import { montarUrlWhatsapp, normalizarNumeroWhatsapp } from '@/utils/whatsapp'

const gestores = ref([])
const carregando = ref(true)
const erro = ref(false)
const contatos = computed(() => gestores.value.map((gestor) => {
  const { numero } = normalizarNumeroWhatsapp(gestor.telefone)
  return { ...gestor, url: numero ? montarUrlWhatsapp(numero) : null }
}))

const carregarGestores = async () => {
  carregando.value = true
  erro.value = false
  try {
    gestores.value = await getGestoresDaMinhaRegional()
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

onMounted(carregarGestores)
</script>

<style scoped>
.contact-section {
  max-width: 900px;
  margin: 32px auto 0 auto;
}

.contact-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #e0e0e0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #424242;
  margin: 0;
}

.card-description {
  font-size: 14px;
  color: #616161;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-label {
  font-size: 12px;
  font-weight: 600;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contact-value {
  font-size: 14px;
  color: #424242;
  text-decoration: none;
}

/* Item clicável: a margem negativa compensa o padding e mantém o ícone
   alinhado com os itens estáticos. Hover por borda, sem deslocamento (§8). */
.contact-item--link {
  margin: 0 -12px;
  padding: 11px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  transition:
    border-color var(--transition),
    background-color var(--transition);
}

.contact-item--link:hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-background);
}

.contact-item--link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.contact-item--link .contact-info {
  flex: 1;
  min-width: 0;
}

.contact-detalhe {
  font-size: 13px;
  color: var(--color-text-muted);
}

.contact-externo {
  align-self: center;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .contact-card {
    padding: 24px 20px;
  }

  .card-title {
    font-size: 1.125rem;
  }

  .contact-methods {
    gap: 16px;
  }
}
</style>