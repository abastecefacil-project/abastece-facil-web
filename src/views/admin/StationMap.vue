<template>
  <div class="map-wrapper">
    <div class="map-container">
      <Map
        v-if="loadedMarker"
        :user="userMarker"
        :route="route"
        :stations="postos"
        @show-route="showStationRoute"
        @start-route="navigateToStation"
        @popup-open="popupOpen = true"
        @popup-close="popupOpen = false"
      />

      <div v-if="loadedMarker && !popupOpen" :class="['route-panel', { 'route-panel--compact': route && !showRouteForm }]">
        <div class="route-panel-title">
          <v-icon icon="mdi-map-marker-path" size="20" />
          <span>Encontrar postos no trajeto</span>
          <button v-if="route && !showRouteForm" type="button" class="route-panel-toggle" @click="editRoute">
            <v-icon icon="mdi-pencil-outline" size="18" />
          </button>
        </div>

        <template v-if="!route || showRouteForm">
          <div class="autocomplete-field">
          <div class="field-heading">
            <span>Origem</span>
            <button type="button" @click="useCurrentLocation">Usar minha localização</button>
          </div>
          <v-text-field
            v-model="origin"
            placeholder="Ex.: Joinville, SC"
            prepend-inner-icon="mdi-map-marker"
            variant="outlined"
            density="compact"
            hide-details
            class="route-field"
            @keyup.enter="searchRoute"
          />
          <div v-if="suggestions.origin.length" class="suggestions-list">
            <button v-for="suggestion in suggestions.origin" :key="suggestion.place_id" type="button" @mousedown.prevent="selectSuggestion('origin', suggestion)">
              <span class="suggestion-name">{{ suggestion.display_name }}</span>
              <span class="suggestion-distance">{{ formatSuggestionDistance(suggestion) }}</span>
            </button>
          </div>
          </div>
          <div class="autocomplete-field">
          <div class="field-heading"><span>Destino</span></div>
          <v-text-field
            v-model="destination"
            placeholder="Ex.: Florianópolis, SC"
            prepend-inner-icon="mdi-flag-checkered"
            variant="outlined"
            density="compact"
            hide-details
            class="route-field"
            @keyup.enter="searchRoute"
          />
          <div v-if="suggestions.destination.length" class="suggestions-list">
            <button v-for="suggestion in suggestions.destination" :key="suggestion.place_id" type="button" @mousedown.prevent="selectSuggestion('destination', suggestion)">
              <span class="suggestion-name">{{ suggestion.display_name }}</span>
              <span class="suggestion-distance">{{ formatSuggestionDistance(suggestion) }}</span>
            </button>
          </div>
          </div>
          <v-btn color="primary" block :loading="loadingRoute" :disabled="!origin || !destination" @click="searchRoute">
            Mostrar postos no trajeto
          </v-btn>
        </template>

        <v-alert v-if="routeError" type="error" variant="tonal" density="compact" class="route-alert">
          {{ routeError }}
        </v-alert>
        <div v-if="route" class="route-summary">
          {{ formatDistance(route.distance) }} · {{ formatDuration(route.duration) }}
          <div class="route-actions">
            <button v-if="!showRouteForm" type="button" @click="editRoute">Editar</button>
            <button type="button" @click="clearRoute">Limpar</button>
          </div>
        </div>
      </div>

      <div v-if="loadedMarker && carregandoPostos" class="postos-status" role="status">
        <v-progress-circular indeterminate color="primary" size="16" width="2" />
        <span>Carregando postos…</span>
      </div>
      <div v-else-if="loadedMarker && cargaIncompleta" class="postos-status postos-status--aviso" role="alert">
        <v-icon icon="mdi-alert-outline" size="18" class="postos-status-icon" />
        <span>Não foi possível carregar todos os postos. Recarregue a página.</span>
      </div>

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
import { listarTodosPostosAtivos } from '@/services/stationService'

const userMarker = reactive({ lat: 0, lon: 0 })
const loadedMarker = ref(false)
const errorMarker = ref(false)
const origin = ref('')
const destination = ref('')
const route = ref(null)
const loadingRoute = ref(false)
const routeError = ref('')
const activeDestination = ref(null)
const followCurrentLocation = ref(false)
const showRouteForm = ref(true)
const popupOpen = ref(false)
const suggestions = reactive({ origin: [], destination: [] })
const isMobile = computed(() => window.innerWidth <= 768)
const postos = ref([])
const carregandoPostos = ref(true)
const cargaIncompleta = ref(false)

let isMounted = true
let watchPositionId = null
let lastReroutePosition = null
const suggestionTimers = { origin: null, destination: null }
const suppressSuggestions = { origin: false, destination: false }

// Todas as páginas antes de entregar ao Map, que cria os marcadores de uma vez.
// Começa junto com a geolocalização, sem esperar o mapa ser montado.
async function carregarPostos() {
  const { postos: carregados, completo } = await listarTodosPostosAtivos()
  if (!isMounted) return
  postos.value = carregados
  cargaIncompleta.value = !completo
  carregandoPostos.value = false
}

onMounted(() => {
  isMounted = true
  carregarPostos()
  if (isMobile.value) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }

  if ('geolocation' in navigator) {
    watchPositionId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5000,
    })
  }
})

onUnmounted(() => {
  isMounted = false
  if (watchPositionId !== null) navigator.geolocation.clearWatch(watchPositionId)
  Object.values(suggestionTimers).forEach(clearTimeout)
  if (isMobile.value) {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})

function success(pos) {
  const wasLoaded = loadedMarker.value
  userMarker.lat = pos.coords.latitude
  userMarker.lon = pos.coords.longitude
  if (Number.isFinite(userMarker.lat) && Number.isFinite(userMarker.lon)) {
    loadedMarker.value = true
    if (wasLoaded && followCurrentLocation.value && shouldReroute()) {
      updateCurrentRoute()
    }
  }
}

function error(err) {
  if (err.code === 1 || err.code === 2) errorMarker.value = true
  console.warn(`ERRO(${err.code}): ${err.message}`)
}

async function geocode(query) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('Não foi possível buscar o endereço.')
  const results = await response.json()
  if (!results.length) throw new Error(`Local não encontrado: ${query}`)
  return [Number(results[0].lon), Number(results[0].lat)]
}

async function getSuggestions(field, query) {
  if (query.trim().length < 3 || query.trim().toLowerCase() === 'minha localização') {
    suggestions[field] = []
    return
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'br',
    q: query,
  })

  if (Number.isFinite(userMarker.lat) && Number.isFinite(userMarker.lon)) {
    params.set('viewbox', `${userMarker.lon - 0.7},${userMarker.lat + 0.7},${userMarker.lon + 0.7},${userMarker.lat - 0.7}`)
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (response.ok) {
    const results = await response.json()
    suggestions[field] = results.sort((first, second) => distanceToUser(first) - distanceToUser(second))
  }
}

function distanceToUser(location) {
  if (!location.lat || !location.lon) return Number.MAX_SAFE_INTEGER
  return distanceBetween([userMarker.lon, userMarker.lat], [Number(location.lon), Number(location.lat)])
}

function formatSuggestionDistance(location) {
  const distance = distanceToUser(location)
  if (!Number.isFinite(distance) || distance === Number.MAX_SAFE_INTEGER) return ''
  return `${distance.toFixed(1).replace('.', ',')} km`
}

function scheduleSuggestions(field, value) {
  clearTimeout(suggestionTimers[field])
  if (suppressSuggestions[field]) {
    suppressSuggestions[field] = false
    suggestions[field] = []
    return
  }
  suggestionTimers[field] = setTimeout(async () => {
    try {
      await getSuggestions(field, value)
    } catch {
      suggestions[field] = []
    }
  }, 350)
}

function selectSuggestion(field, suggestion) {
  suppressSuggestions[field] = true
  if (field === 'origin') origin.value = suggestion.display_name
  else destination.value = suggestion.display_name
  suggestions[field] = []
}

function useCurrentLocation() {
  suppressSuggestions.origin = true
  origin.value = 'Minha localização'
  suggestions.origin = []
}

function setRouteField(field, value) {
  suppressSuggestions[field] = true
  if (field === 'origin') origin.value = value
  else destination.value = value
  suggestions[field] = []
}

function clearSuggestions() {
  Object.keys(suggestionTimers).forEach((field) => clearTimeout(suggestionTimers[field]))
  suggestions.origin = []
  suggestions.destination = []
}

function editRoute() {
  clearSuggestions()
  showRouteForm.value = true
}

watch(origin, (value) => scheduleSuggestions('origin', value))
watch(destination, (value) => scheduleSuggestions('destination', value))

async function requestRoute(start, end) {
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.join(',')};${end.join(',')}?overview=full&geometries=geojson`)
  if (!response.ok) throw new Error('Não foi possível calcular a rota.')
  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Não foi encontrada uma rota entre os locais informados.')
  return data.routes[0]
}

function distanceBetween(first, second) {
  const latitude = ((first[1] + second[1]) / 2) * Math.PI / 180
  const latitudeDistance = (second[1] - first[1]) * 111.32
  const longitudeDistance = (second[0] - first[0]) * 111.32 * Math.cos(latitude)
  return Math.hypot(latitudeDistance, longitudeDistance)
}

function shouldReroute() {
  const currentPosition = [userMarker.lon, userMarker.lat]
  return !lastReroutePosition || distanceBetween(lastReroutePosition, currentPosition) >= 0.2
}

async function updateCurrentRoute() {
  if (!activeDestination.value || loadingRoute.value) return
  lastReroutePosition = [userMarker.lon, userMarker.lat]
  loadingRoute.value = true
  try {
    route.value = await requestRoute(lastReroutePosition, activeDestination.value)
  } catch (error) {
    routeError.value = error.message || 'Não foi possível atualizar a rota.'
  } finally {
    loadingRoute.value = false
  }
}

async function searchRoute() {
  if (!origin.value || !destination.value) return
  loadingRoute.value = true
  routeError.value = ''
  try {
    const start = origin.value.trim().toLowerCase() === 'minha localização'
      ? [userMarker.lon, userMarker.lat]
      : await geocode(origin.value)
    const end = await geocode(destination.value)
    followCurrentLocation.value = origin.value.trim().toLowerCase() === 'minha localização'
    activeDestination.value = end
    lastReroutePosition = followCurrentLocation.value ? start : null
    route.value = await requestRoute(start, end)
    showRouteForm.value = false
  } catch (error) {
    route.value = null
    routeError.value = error.message || 'Não foi possível calcular a rota.'
  } finally {
    loadingRoute.value = false
  }
}

async function showStationRoute(station) {
  setRouteField('origin', 'Minha localização')
  setRouteField('destination', `${station.address || station.name}, ${station.city || ''} - ${station.state || ''}`)
  loadingRoute.value = true
  routeError.value = ''
  showRouteForm.value = false
  try {
    const start = [userMarker.lon, userMarker.lat]
    const end = [Number(station.longitude), Number(station.latitude)]
    activeDestination.value = end
    followCurrentLocation.value = true
    lastReroutePosition = start
    route.value = { ...(await requestRoute(start, end)), preserveView: true }
  } catch (error) {
    routeError.value = error.message || 'Não foi possível calcular a rota.'
    showRouteForm.value = true
  } finally {
    loadingRoute.value = false
  }
}

function navigateToStation(station) {
  const currentOrigin = Number.isFinite(userMarker.lat) && Number.isFinite(userMarker.lon)
    ? `${userMarker.lat},${userMarker.lon}`
    : ''
  const destination = `${station.latitude},${station.longitude}`
  const query = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  })
  if (currentOrigin) query.set('origin', currentOrigin)
  window.open(`https://www.google.com/maps/dir/?${query.toString()}`, '_blank', 'noopener,noreferrer')
}

function clearRoute() {
  clearSuggestions()
  route.value = null
  showRouteForm.value = true
  routeError.value = ''
  activeDestination.value = null
  followCurrentLocation.value = false
  lastReroutePosition = null
}

function formatDistance(meters) {
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
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

.route-panel {
  position: absolute;
  z-index: 600;
  top: 16px;
  left: 16px;
  width: min(360px, calc(100% - 32px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  backdrop-filter: blur(14px);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: 0 14px 40px rgb(15 23 42 / 18%);
}

.route-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.route-panel-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  padding: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
}
.route-panel-toggle:hover { background: rgb(25 118 210 / 10%); }
.route-panel--compact { width: min(330px, calc(100% - 32px)); padding: 13px 15px; }

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 2px 5px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
.field-heading button {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.75rem;
  cursor: pointer;
}
.autocomplete-field { position: relative; }
.route-field { background: rgb(255 255 255 / 72%); }
.suggestions-list {
  position: absolute;
  z-index: 1002;
  top: 56px;
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  padding: 5px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgb(15 23 42 / 16%);
}
.suggestions-list button {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  overflow: hidden;
  padding: 10px 11px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 0.82rem;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
}
.suggestion-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.suggestion-distance { color: var(--color-text-muted); font-size: 0.72rem; }
.suggestions-list button:hover { background: var(--color-background); }
.route-alert { margin-top: 2px; }
.route-summary { font-size: 0.85rem; color: var(--color-text-muted); }
.route-actions { display: flex; gap: 10px; margin-top: 8px; }
.route-actions button {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 0.78rem;
  cursor: pointer;
}
.route-actions button:hover { background: rgb(25 118 210 / 8%); }

.postos-status {
  position: absolute;
  z-index: 600;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: min(360px, calc(100% - 32px));
  padding: 8px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-muted);
}

.postos-status--aviso {
  color: var(--color-text);
}

.postos-status-icon {
  flex-shrink: 0;
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

  .route-panel {
    top: 72px;
    left: 8px;
    width: calc(100% - 16px);
  }

  :deep(.leaflet-top.leaflet-right) {
    top: 80px !important;
  }
}
</style>
