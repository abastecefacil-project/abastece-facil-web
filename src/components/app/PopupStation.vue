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

      <div v-if="businessHours" class="info-line">
        <v-icon size="18" color="grey-darken-1" class="mr-1">mdi-clock-outline</v-icon>
        <span>{{ businessHours }}</span>
      </div>
    </div>

    <v-btn
      color="primary"
      variant="flat"
      :href="googleMapsUrl"
      target="_blank"
      prepend-icon="mdi-map-marker-path"
      class="map-button"
    >
      Ver rota
    </v-btn>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
})

const { lat, lon, name, city, state, address, phone, businessHours } = props.station

const googleMapsUrl = computed(() => {
  if (!lat || !lon) return '#'
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`
})
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
