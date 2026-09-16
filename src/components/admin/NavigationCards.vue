<template>
  <div class="nav-grid">
    <v-card
      v-for="card in navCards"
      :key="card.title"
      :class="['nav-card', 'text-center', { 'map-card': card.title === 'Mapa' }]"
      elevation="1"
      rounded="lg"
      :to="card.to"
      hover
    >
      <v-card-text :class="['pa-4 pa-sm-6', { 'map-card-content': card.title === 'Mapa' }]">
        <div :class="['card-icon-container', { 'mb-3': card.title !== 'Mapa' || !$vuetify.display.mobile }]">
          <div :class="['card-icon-bg', card.bgClass]">
            <v-icon
              :icon="card.icon"
              color="white"
              :size="$vuetify.display.mobile ? 24 : 32"
            />
          </div>
        </div>
        <p :class="['card-title text-grey-darken-2', { 'mb-0': card.title === 'Mapa' && $vuetify.display.mobile }]">
          {{ card.title }}
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
const navCards = [
  {
    title: 'Postos',
    icon: 'mdi-gas-station',
    to: { name: 'StationAdmin' },
    bgClass: 'bg-red',
  },
  {
    title: 'Veículos',
    icon: 'mdi-car',
    to: { name: 'VehicleAdmin' },
    bgClass: 'bg-blue',
  },
  {
    title: 'Mapa',
    icon: 'mdi-map-marker',
    to: { name: 'MapAdmin' },
    bgClass: 'bg-green',
  },
  {
    title: 'Ocorrências',
    icon: 'mdi-alert-circle',
    to: { name: 'OccurrencesAdmin' },
    bgClass: 'bg-yellow',
  },
  {
    title: 'Usuários',
    icon: 'mdi-account-group',
    to: { name: 'UsersAdmin' },
    bgClass: 'bg-purple',
  },
]
</script>

<style scoped>
/* Grid Layout */
.nav-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}

/* Desktop: 3 colunas com Mapa ocupando 2 linhas */
@media (min-width: 961px) {
  .nav-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 140px);
  }
  
  .nav-card:nth-child(1) { grid-column: 1; grid-row: 1; }
  .nav-card:nth-child(2) { grid-column: 2; grid-row: 1; }
  .nav-card:nth-child(3) { grid-column: 3; grid-row: 1 / 3; } /* Mapa */
  .nav-card:nth-child(4) { grid-column: 1; grid-row: 2; }
  .nav-card:nth-child(5) { grid-column: 2; grid-row: 2; }
}

/* Tablet: 2 colunas */
@media (min-width: 601px) and (max-width: 960px) {
  .nav-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 120px;
  }
  
  .map-card {
    grid-column: 1 / -1; /* Ocupa largura total */
  }
  
  .map-card .map-card-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  
  .map-card .card-icon-container {
    margin-bottom: 0 !important;
  }
}

/* Mobile: 2 colunas com Mapa horizontal ocupando largura total */
@media (max-width: 600px) {
  .nav-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .nav-card:nth-child(1) { order: 2; } /* Postos */
  .nav-card:nth-child(2) { order: 3; } /* Veículos */
  .nav-card:nth-child(3) { /* Mapa */
    order: 1;
    grid-column: 1 / -1;
    min-height: 120px;
  }
  .nav-card:nth-child(4) { order: 4; } /* Ocorrências */
  .nav-card:nth-child(5) { order: 5; } /* Usuários */
  
  .nav-card {
    min-height: 100px;
  }
  
  .map-card .map-card-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 20px !important;
  }
  
  .map-card .card-icon-container {
    margin-bottom: 0 !important;
  }
  
  .map-card .card-icon-bg {
    width: 56px !important;
    height: 56px !important;
  }
  
  .map-card .card-title {
    font-size: 1.1rem !important;
  }
}

/* Card */
.nav-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px !important;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.nav-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* Estilo especial para o card do Mapa */
.map-card {
  background: white !important;
  border: 1px solid #e0e0e0 !important;
  position: relative;
  overflow: hidden;
}

.map-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(129, 199, 132, 0.03) 35px, rgba(129, 199, 132, 0.03) 36px),
    repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(129, 199, 132, 0.03) 35px, rgba(129, 199, 132, 0.03) 36px);
  pointer-events: none;
  transition: all 0.2s ease;
}

.map-card .v-card-text {
  position: relative;
  z-index: 1;
}

.map-card .card-icon-bg {
  width: 68px !important;
  height: 68px !important;
  box-shadow: 0 4px 12px rgba(129, 199, 132, 0.25);
  border: 3px solid rgba(129, 199, 132, 0.15);
}

@media (max-width: 960px) {
  .map-card .card-icon-bg {
    width: 52px !important;
    height: 52px !important;
  }
}

.map-card .card-title {
  
  font-weight: 600;
  font-size: 1.05rem;
}

.map-card:hover {
  box-shadow: 0 6px 20px rgba(129, 199, 132, 0.2) !important;
  border-color: #c8e6c9 !important;
}

.map-card:hover::before {
  background-image: 
    repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(129, 199, 132, 0.06) 35px, rgba(129, 199, 132, 0.06) 36px),
    repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(129, 199, 132, 0.06) 35px, rgba(129, 199, 132, 0.06) 36px);
}

.nav-card .v-card-text {
  padding: 16px !important;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 600px) {
  .nav-card .v-card-text {
    padding: 10px !important;
  }
}

/* Ícone */
.card-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-icon-bg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  flex-shrink: 0;
}

@media (min-width: 961px) {
  .card-icon-bg {
    width: 56px;
    height: 56px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .card-icon-bg {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 600px) {
  .card-icon-bg {
    width: 38px;
    height: 38px;
  }
}

/* Título */
.card-title {
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
  color: #424242;
}

.text-center {
  text-align: center;
}

/* Paleta de cores sutil (ajustada) */
.bg-red {
  background-color: #e57373;
}

.bg-green {
  background-color: #81c784;
}

.bg-blue {
  background-color: #64b5f6;
}

.bg-yellow {
  background-color: #ffd54f;
}

.bg-purple {
  background-color: #ba68c8;
}

.bg-pink {
  background-color: #f06292;
}
</style>