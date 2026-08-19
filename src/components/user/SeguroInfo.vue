<template>
  <div class="seguro-info">
    <div class="assistencia-banner">
      <div class="banner-content">
        <h3 class="banner-title">Assistência 24 horas</h3>
        <div class="phone-number">0800 602 0088</div>
      </div>
      <div class="banner-logo">
        <v-icon icon="mdi-phone-in-talk" size="48" color="white"></v-icon>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h4 class="info-card-title">Seguro contra terceiros</h4>
        <ul class="info-list">
          <li>Cobertura para danos materiais e corporais causados a terceiros em caso de acidente.</li>
        </ul>

        <h4 class="info-card-title mt-4">Assistência 24h (exclusiva para frota própria)</h4>
        <ul class="info-list">
          <li>Guincho (KM ilimitado)</li>
          <li>Troca de pneu</li>
          <li>Carga de bateria</li>
          <li>Transporte alternativo</li>
          <li>Chaveiro</li>
        </ul>
      </div>

      <div class="info-card">
        <h4 class="info-card-title">Acionamento do Seguro</h4>
        <ul class="info-list">
          <li>Através do 0800 ou WhatsApp;</li>
          <li>Registrar o sinistro;</li>
          <li>Fornecer as informações necessárias solicitadas pelo atendente;</li>
          <li><strong>Solicitar dados do terceiro;</strong></li>
          <li><strong>Registrar boletim de ocorrência</strong></li>
          <li><strong>Abrir um Comunique e informar ao líder, gestor, gestora de frotas e AGO, sobre o acidente.</strong></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.seguro-info {
  width: 100%;
}

.assistencia-banner {
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  border-radius: 12px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.phone-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
}

.banner-logo {
  opacity: 0.9;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e0e0e0;
}

.info-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #424242;
  margin: 0 0 12px 0;
}

.mt-4 {
  margin-top: 20px;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.info-list li {
  font-size: 14px;
  color: #616161;
  line-height: 1.6;
  margin: 8px 0;
}

.info-list li strong {
  color: #424242;
  font-weight: 600;
}

@media (max-width: 768px) {
  .assistencia-banner {
    padding: 20px;
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .phone-number {
    font-size: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-card {
    padding: 20px;
  }

  .info-card-title {
    font-size: 1rem;
  }

  .info-list li {
    font-size: 13px;
  }
}
</style>