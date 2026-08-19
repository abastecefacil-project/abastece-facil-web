<template>
  <div class="map-wrapper">
    <div class="map-container">
      <Map v-if="loadedMarker" :user="userMarker" />

      <div v-if="!loadedMarker && errorMarker" class="message-overlay">
        <v-icon icon="mdi-map-marker-off-outline" size="28" class="message-icon"></v-icon>
        <p>Para utilizar o recurso de Mapa verifique a permissão de localização!</p>
      </div>
      <div v-if="!loadedMarker && !errorMarker" class="message-overlay">
        <v-progress-circular indeterminate color="primary" size="26" width="3" class="mb-1" />
        <p>Carregando localização...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import Map from '@/components/app/Map.vue'
import { onMounted, reactive, ref, computed, watch, onUnmounted } from 'vue'

const userMarker = reactive({ lat: 0, lon: 0 })
const loadedMarker = ref(false)
const errorMarker = ref(false)
const isMobile = computed(() => window.innerWidth <= 768)

let isMounted = true

onMounted(() => {
  isMounted = true
  if (isMobile.value) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 30,
    })
  }
})

onUnmounted(() => {
  isMounted = false
  if (isMobile.value) {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})

function success(pos) {
  userMarker.lat = pos.coords.latitude
  userMarker.lon = pos.coords.longitude
  if (Number.isFinite(userMarker.lat) && Number.isFinite(userMarker.lon)) {
    loadedMarker.value = true
  }
}

function error(err) {
  if (err.code === 1 || err.code === 2) errorMarker.value = true
  console.warn(`ERRO(${err.code}): ${err.message}`)
}

watch(loadedMarker, (val) => {
  if (val && isMounted) {
    setTimeout(() => {
      if (isMounted) {
        window.dispatchEvent(new Event('resize'))
      }
    }, 300)
  }
})
</script>

<style scoped>
.map-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 50px);
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.message-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 320px;
  text-align: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.message-overlay p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.message-icon {
  color: var(--color-warning);
}

:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .map-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
  }

  .map-container {
    margin-top: 6%;
  }

  :deep(.leaflet-top.leaflet-right) {
    top: 80px !important;
  }
}
</style>
