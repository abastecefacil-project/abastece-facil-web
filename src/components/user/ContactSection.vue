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

        <div class="contact-item">
          <v-icon icon="mdi-account-tie" color="#757575" size="20"></v-icon>
          <div class="contact-info">
            <span class="contact-label">Gestora de Frota</span>
            <span class="contact-value">Para questões sobre abastecimento e reembolsos</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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