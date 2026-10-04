<template>
    <h3 class="station-name">{{ name }}</h3>

    <div class="station-info">
      <div class="info-line">
        <v-icon size="18" color="grey-darken-1" class="mr-1">mdi-map-marker</v-icon>
        <span>{{ address }}</span>
      </div>

      <div class="info-line">
        <v-icon size="18" color="grey-darken-1" class="mr-1">mdi-city</v-icon>
        <span>{{ city }} - {{ state }}</span>
      </div>

      <div v-if="phone" class="info-line">
        <v-icon size="18" color="grey-darken-1" class="mr-1">mdi-phone</v-icon>
        <span>{{ phone }}</span>
      </div>
      <div v-else-if="!phone" class="info-line">
        <v-icon size="18" color="grey-darken-1" class="mr-1">mdi-phone</v-icon>
        <span> Não Informado </span>
      </div>

      <div class="info-line">
        <v-icon size="18" color="grey-darken-1" class="mr-1">mdi-clock-outline</v-icon>
        <span v-if="horario">{{ horario }}</span>
        <span v-else class="horario-nao-informado">{{ HORARIO_NAO_INFORMADO }}</span>
      </div>
    </div>

    <div v-if="routeContext?.value" class="route-info">
      <span>{{ formatDistance(routeContext.value.distance) }}</span>
      <span>{{ formatDuration(routeContext.value.duration) }}</span>
    </div>

    <v-btn
      color="primary"
      variant="flat"
      @click="startRoute"
      prepend-icon="mdi-map-marker-path"
      class="map-button"
    >
      Iniciar navegação
    </v-btn>
</template>

<script setup>
import { computed } from 'vue'
import { HORARIO_NAO_INFORMADO, formatarHorarioFuncionamento } from '@/utils/posto'

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
  onStartRoute: {
    type: Function,
    default: null,
  },
  routeContext: {
    type: Object,
    default: null,
  },
})

const { lat, lon, name, city, state, address, phone, businessHours } = props.station
const horario = formatarHorarioFuncionamento(businessHours)

const googleMapsUrl = computed(() => {
  if (!lat || !lon) return '#'
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`
})

function startRoute() {
  if (props.onStartRoute) {
    props.onStartRoute(props.station)
    return
  }

  window.open(googleMapsUrl.value, '_blank', 'noopener,noreferrer')
}

function formatDistance(meters) {
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
}
</script>

<style scoped>
.popup-station {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  box-shadow: var(--shadow-md);
  max-width: 260px;
}

.station-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.station-info {
  margin-bottom: 12px;
}

.route-info {
  display: flex;
  gap: 8px;
  margin: -4px 0 12px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.8125rem;
  font-weight: 600;
}

.info-line {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 3px 0;
}

.map-button {
  width: 100%;
  font-weight: 600;
  letter-spacing: 0;
  border-radius: var(--radius-sm);
}
</style>
