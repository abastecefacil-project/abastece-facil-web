<template>
  <div class="map-wrapper">
    <div ref="areaMapa" class="map-container" :style="{ '--folha-altura': `${alturaFolha}px` }">
      <Map
        :user="userMarker"
        :margem-superior="margemSuperiorMapa"
        :route="route"
        :stations="postos"
        @show-route="showStationRoute"
        @start-route="navigateToStation"
        @popup-open="popupOpen = true"
        @popup-close="popupOpen = false"
        @avaliar-neo="postoNeo = $event"
      />

      <!-- Painel flutuante no desktop; abaixo de 960px, folha inferior
           recolhível (o recolhimento só vale nessa faixa, pelo CSS). -->
      <section
        v-if="!popupOpen"
        ref="painelTrajeto"
        aria-labelledby="titulo-trajeto"
        :class="[
          'route-panel',
          {
            'route-panel--compact': route && !showRouteForm,
            'route-panel--recolhido': folhaRecolhida,
          },
        ]"
      >
        <div class="route-panel-title">
          <v-icon icon="mdi-map-marker-path" size="20" class="route-panel-icon" />
          <div class="route-panel-heading">
            <h2 id="titulo-trajeto">Encontrar postos no trajeto</h2>
            <p v-if="route" class="route-panel-resumo-recolhido">
              {{ formatarDistancia(route.distance) }} · {{ formatarDuracao(route.duration) }}
            </p>
          </div>
          <!-- Editar o trajeto é só o "Editar" do resumo (R10): o lápis aqui no
               cabeçalho repetia a mesma ação. -->
          <v-tooltip :text="folhaRecolhida ? 'Expandir painel' : 'Recolher painel'" location="top">
            <template #activator="{ props: tooltip }">
              <button
                v-bind="tooltip"
                type="button"
                class="route-panel-icon-btn route-panel-alternar"
                :aria-label="folhaRecolhida ? 'Expandir painel' : 'Recolher painel'"
                :aria-expanded="!folhaRecolhida"
                aria-controls="corpo-trajeto"
                @click="folhaRecolhida = !folhaRecolhida"
              >
                <v-icon :icon="folhaRecolhida ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20" />
              </button>
            </template>
          </v-tooltip>
        </div>

        <div id="corpo-trajeto" class="route-panel-corpo">
          <template v-if="!route || showRouteForm">
            <div class="autocomplete-field">
              <div class="field-heading">
                <span>Origem</span>
                <button
                  type="button"
                  :disabled="!temLocalizacao"
                  :title="motivoSemLocalizacao || undefined"
                  @click="useCurrentLocation"
                >Usar minha localização</button>
              </div>
              <v-text-field
                v-model="origin"
                placeholder="Ex.: Joinville, SC"
                prepend-inner-icon="mdi-map-marker-outline"
                variant="outlined"
                density="compact"
                hide-details
                @keyup.enter="searchRoute"
              />
              <!-- No fluxo do painel, e não sobreposta: a lista empurra o
                   botão para baixo em vez de cobri-lo. -->
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
                @keyup.enter="searchRoute"
              />
              <div v-if="suggestions.destination.length" class="suggestions-list">
                <button v-for="suggestion in suggestions.destination" :key="suggestion.place_id" type="button" @mousedown.prevent="selectSuggestion('destination', suggestion)">
                  <span class="suggestion-name">{{ suggestion.display_name }}</span>
                  <span class="suggestion-distance">{{ formatSuggestionDistance(suggestion) }}</span>
                </button>
              </div>
            </div>
            <!-- Sem a prop `color`: o .bg-primary do Vuetify é !important e
                 não deixaria o estado desabilitado mudar de fundo. -->
            <v-btn
              block
              variant="flat"
              class="btn-trajeto"
              :loading="loadingRoute"
              :disabled="!origin || !destination"
              @click="searchRoute"
            >
              Mostrar postos no trajeto
            </v-btn>
          </template>

          <v-alert v-if="routeError" type="error" variant="tonal" density="compact" class="route-alert">
            {{ routeError }}
          </v-alert>
          <div v-if="route" class="route-summary">
            <p class="route-summary-numeros">
              <strong>{{ formatarDistancia(route.distance) }}</strong>
              <span aria-hidden="true">·</span>
              <span>{{ formatarDuracao(route.duration) }}</span>
            </p>
            <div class="route-actions">
              <button v-if="!showRouteForm" type="button" @click="editRoute">Editar</button>
              <button type="button" @click="clearRoute">Limpar</button>
            </div>
          </div>
        </div>
      </section>

      <div class="mapa-avisos">
        <div v-if="avisoSemLocalizacao" class="postos-status postos-status--aviso" role="status">
          <v-icon icon="mdi-crosshairs-off" size="18" class="postos-status-icon" />
          <span>{{ avisoSemLocalizacao }}</span>
        </div>
        <div v-if="carregandoPostos" class="postos-status" role="status">
          <v-progress-circular indeterminate color="primary" size="16" width="2" />
          <span>Carregando postos…</span>
        </div>
        <div v-else-if="cargaIncompleta" class="postos-status postos-status--aviso" role="alert">
          <v-icon icon="mdi-alert-outline" size="18" class="postos-status-icon" />
          <span>Não foi possível carregar todos os postos. Recarregue a página.</span>
        </div>
      </div>
    </div>
    <AvaliacaoNeoDialog
      v-if="postoNeo"
      :posto="postoNeo"
      @fechar="postoNeo = null"
    />
  </div>
</template>

<script setup>
import { formatarDistancia, formatarDuracao } from '@/utils/formatacao'
import Map from '@/components/app/Map.vue'
import AvaliacaoNeoDialog from '@/components/user/AvaliacaoNeoDialog.vue'
import { onMounted, reactive, ref, computed, watch, onUnmounted } from 'vue'
import { listarTodosPostosAtivos } from '@/services/stationService'
import {
  avisoLocalizacao,
  estadoAposErro,
  estadoAposPosicao,
  estadoInicialLocalizacao,
  localizacaoDisponivel,
  motivoLocalizacaoIndisponivel,
  origemNavegacao,
} from '@/utils/geolocalizacao'

// null até a primeira posição: 0,0 passaria por coordenada válida.
const userMarker = reactive({ lat: null, lon: null })
const postoNeo = ref(null)
const estadoLocalizacao = ref(estadoInicialLocalizacao('geolocation' in navigator))
const temLocalizacao = computed(() => localizacaoDisponivel(estadoLocalizacao.value))
const avisoSemLocalizacao = computed(() => avisoLocalizacao(estadoLocalizacao.value))
const motivoSemLocalizacao = computed(() => motivoLocalizacaoIndisponivel(estadoLocalizacao.value))
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
const areaMapa = ref(null)
const margemSuperiorMapa = ref(0)
const carregandoPostos = ref(true)
const cargaIncompleta = ref(false)
// Folha inferior (abaixo de 960px): recolhida ou não, e a altura que ela
// ocupa, publicada em --folha-altura para os avisos e a atribuição do Leaflet
// ficarem acima dela.
const painelTrajeto = ref(null)
const folhaRecolhida = ref(false)
const alturaFolha = ref(0)
let observadorFolha = null

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

// No celular o .map-wrapper é fixed a partir do topo da janela, e a barra
// superior cobre o começo do mapa. O Map desconta essa faixa no autopan do
// popup, que de outro modo o deixaria embaixo da barra.
function medirMargemSuperiorMapa() {
  const topoMapa = areaMapa.value?.getBoundingClientRect().top ?? 0
  const alturaBarra = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-bar-height')) || 0
  margemSuperiorMapa.value = Math.max(0, Math.round(alturaBarra - topoMapa))
}

onMounted(() => {
  isMounted = true
  carregarPostos()
  medirMargemSuperiorMapa()
  window.addEventListener('resize', medirMargemSuperiorMapa)
  if (isMobile.value) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }

  // O Map já nasce montado na visão inicial; a geolocalização só acrescenta
  // o marcador do usuário e o flyTo quando chega.
  setTimeout(() => {
    if (isMounted) window.dispatchEvent(new Event('resize'))
  }, 300)

  if ('geolocation' in navigator) {
    watchPositionId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5000,
    })
  }
})

// O painel sai do DOM com o popup aberto (v-if), e aí a folha não ocupa nada.
watch(painelTrajeto, (painel) => {
  observadorFolha?.disconnect()
  if (!painel || typeof ResizeObserver === 'undefined') {
    alturaFolha.value = 0
    return
  }
  observadorFolha ??= new ResizeObserver(([entrada]) => {
    alturaFolha.value = Math.round(entrada.target.getBoundingClientRect().height)
  })
  observadorFolha.observe(painel)
})

onUnmounted(() => {
  isMounted = false
  observadorFolha?.disconnect()
  window.removeEventListener('resize', medirMargemSuperiorMapa)
  if (watchPositionId !== null) navigator.geolocation.clearWatch(watchPositionId)
  Object.values(suggestionTimers).forEach(clearTimeout)
  if (isMobile.value) {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})

function success(pos) {
  const posicao = { lat: pos.coords.latitude, lon: pos.coords.longitude }
  const tinhaLocalizacao = temLocalizacao.value
  estadoLocalizacao.value = estadoAposPosicao(estadoLocalizacao.value, posicao)
  if (!temLocalizacao.value) return
  userMarker.lat = posicao.lat
  userMarker.lon = posicao.lon
  if (tinhaLocalizacao && followCurrentLocation.value && shouldReroute()) {
    updateCurrentRoute()
  }
}

function error(err) {
  estadoLocalizacao.value = estadoAposErro(estadoLocalizacao.value, err.code)
  console.warn(`ERRO(${err.code}): ${err.message}`)
}

function origemEhMinhaLocalizacao() {
  return origin.value.trim().toLowerCase() === 'minha localização'
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

  if (temLocalizacao.value) {
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
  if (!temLocalizacao.value || !location.lat || !location.lon) return Number.MAX_SAFE_INTEGER
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
  if (!temLocalizacao.value) return
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
  if (origemEhMinhaLocalizacao() && !temLocalizacao.value) {
    routeError.value = 'Sua localização não está disponível. Digite o endereço de origem.'
    return
  }
  loadingRoute.value = true
  routeError.value = ''
  try {
    const start = origemEhMinhaLocalizacao()
      ? [userMarker.lon, userMarker.lat]
      : await geocode(origin.value)
    const end = await geocode(destination.value)
    followCurrentLocation.value = origemEhMinhaLocalizacao()
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

// Sem a posição do usuário não há de onde partir: o popup abre, sem rota.
async function showStationRoute(station) {
  if (!temLocalizacao.value) return
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
  const currentOrigin = origemNavegacao(userMarker)
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

</script>

<style scoped>
.map-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--app-bar-height));
  height: calc(100dvh - var(--app-bar-height));
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

/* Painéis flutuantes (REDESIGN §5.12): fundo surface sólido, borda, sombra de
   overlay. Sem backdrop-filter, que seria o glassmorphism vetado. */
.route-panel {
  position: absolute;
  z-index: 600;
  top: var(--space-4);
  left: var(--space-4);
  width: min(360px, calc(100% - 32px));
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay);
}

.route-panel--compact {
  padding-bottom: var(--space-4);
}

.route-panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
}

.route-panel-icon {
  flex-shrink: 0;
  color: var(--color-primary);
}

.route-panel-heading {
  flex: 1;
  min-width: 0;
}

.route-panel-heading h2 {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
}

/* Resumo da rota no cabeçalho: só com a folha recolhida (ver o @media). */
.route-panel-resumo-recolhido {
  display: none;
  margin: 0;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.route-panel-corpo {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Botões de ícone de 32px (§4.6), com tooltip e aria-label no template. */
.route-panel-icon-btn {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-neutral-600);
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition);
}

.route-panel-icon-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

/* O recolher só existe na folha inferior. */
.route-panel-alternar {
  display: none;
}

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin: 0 2px var(--space-1);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: var(--text-caption-weight);
  color: var(--color-text-muted);
}

/* "Usar minha localização": botão terciário (§4.6), texto blue-600. */
.field-heading button {
  padding: 2px var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-blue-600);
  font-size: var(--text-caption-size);
  font-weight: 500;
  cursor: pointer;
}

.field-heading button:hover:not(:disabled) {
  color: var(--color-blue-800);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.field-heading button:disabled {
  color: var(--color-neutral-500);
  cursor: not-allowed;
}

/* Foco visível nos botões nativos do painel: a regra global de main.css cobre
   .v-btn, links e [role=button], não <button> puro. */
.route-panel button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 1px;
}

.autocomplete-field {
  display: flex;
  flex-direction: column;
}

/* No fluxo do painel, logo abaixo do campo. */
.suggestions-list {
  max-height: 200px;
  margin-top: var(--space-1);
  overflow-y: auto;
  padding: var(--space-1);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.suggestions-list button {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  overflow: hidden;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  text-align: left;
  cursor: pointer;
}

.suggestions-list button:hover {
  background: var(--color-blue-50);
}

.suggestion-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.suggestion-distance { color: var(--color-text-muted); font-size: var(--text-caption-size); }

/* Primário do painel. Desabilitado, inequívoco: fundo neutral-100 e texto
   neutral-500, sem a opacidade do Vuetify, que deixava o botão "azul apagado". */
.v-btn.btn-trajeto {
  background-color: var(--color-primary);
  color: var(--color-neutral-0);
}

.v-btn.btn-trajeto:hover {
  background-color: var(--color-blue-800);
}

.v-btn.btn-trajeto.v-btn--disabled {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-500);
  opacity: 1;
}

.v-btn.btn-trajeto.v-btn--disabled :deep(.v-btn__overlay) {
  opacity: 0;
}

.route-alert { margin: 0; }

.route-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.route-summary-numeros {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.route-summary-numeros strong {
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: 600;
  color: var(--color-neutral-900);
}

/* "Editar" e "Limpar": secundários pequenos (§4.6). */
.route-actions {
  display: flex;
  gap: var(--space-2);
}

.route-actions button {
  height: 32px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-body-sm-size);
  font-weight: 500;
  cursor: pointer;
  transition: border-color var(--transition), background-color var(--transition);
}

.route-actions button:hover {
  border-color: var(--color-neutral-400);
  background: var(--color-neutral-50);
}

.mapa-avisos {
  position: absolute;
  z-index: 600;
  right: var(--space-4);
  bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  max-width: min(360px, calc(100% - 32px));
  pointer-events: none;
}

.postos-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-overlay);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.postos-status--aviso {
  color: var(--color-text);
}

.postos-status-icon {
  flex-shrink: 0;
  color: var(--color-warning-icon);
}

:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
}

/* Folha inferior abaixo de md (960px). */
@media (max-width: 959.98px) {
  .route-panel,
  .route-panel--compact {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: min(70%, 520px);
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
    border-width: 1px 0 0;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  /* Alça da folha: só indicação visual; quem recolhe é o botão do cabeçalho. */
  .route-panel::before {
    content: '';
    align-self: center;
    flex-shrink: 0;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--color-neutral-300);
  }

  .route-panel-alternar {
    display: inline-grid;
  }

  .route-panel-corpo {
    min-height: 0;
    overflow-y: auto;
    padding-top: var(--space-1);
  }

  .route-panel--recolhido .route-panel-corpo {
    display: none;
  }

  .route-panel--recolhido .route-panel-resumo-recolhido {
    display: block;
  }

  /* A atribuição sobe acima da folha; os avisos vão para o topo do mapa, para
     não disputar com ela o espaço logo acima da folha. */
  .mapa-avisos {
    top: var(--space-2);
    right: var(--space-2);
    bottom: auto;
    max-width: calc(100% - 16px);
  }

  .map-container :deep(.leaflet-bottom) {
    bottom: var(--folha-altura, 0px);
  }
}

/* No celular o wrapper é fixed, abaixo da barra superior. Antes ele começava
   no topo da janela e a barra cobria 33px do mapa. */
@media (max-width: 768px) {
  .map-wrapper {
    position: fixed;
    top: var(--app-bar-height);
    left: 0;
    width: 100%;
    height: calc(100vh - var(--app-bar-height));
    height: calc(100dvh - var(--app-bar-height));
  }
}
</style>
