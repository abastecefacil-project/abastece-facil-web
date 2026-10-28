<template>
  <div ref="mapContainer" class="mapa-leaflet"></div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { ref, reactive, onMounted, onUnmounted, watch, createApp, nextTick  } from "vue";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
// Sem o MarkerCluster.Default.css: ele só pinta os grupos de verde, amarelo e
// laranja, que pareciam status. As cores dos grupos vêm do iconCreateFunction.
import "leaflet.markercluster/dist/MarkerCluster.css";
import PopupStation from "@/components/app/PopupStation.vue";
import vuetify from "@/plugins/vuetify";
import { nomeExibicaoPosto } from "@/utils/posto";
import {
  htmlCluster,
  htmlMarcadorPosto,
  htmlMarcadorUsuario,
  nivelCluster,
  PINO_POSTO,
  TAMANHO_MARCADOR_USUARIO,
} from "@/utils/mapa";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  route: {
    type: Object,
    default: null,
  },
  // Carregados pelo StationMap, já com todas as páginas. O array chega uma vez
  // só, e os marcadores são criados a partir dele de uma vez.
  stations: {
    type: Array,
    default: () => [],
  },
  // Pixels do topo do mapa encobertos por outro elemento (a barra superior,
  // no celular). O autopan do popup desconta essa faixa.
  margemSuperior: {
    type: Number,
    default: 0,
  },
});

// Ícones locais, sem rede: o pino do posto e o ponto do usuário eram PNGs do
// freepik e do unpkg. As cores ficam no <style> abaixo, pelos tokens.
const stationIcon = L.divIcon({
  className: "marcador-posto",
  html: htmlMarcadorPosto(),
  iconSize: PINO_POSTO.tamanho,
  iconAnchor: PINO_POSTO.ancora,
  popupAnchor: PINO_POSTO.ancoraPopup,
});

const userIcon = L.divIcon({
  className: "marcador-usuario",
  html: htmlMarcadorUsuario(),
  iconSize: [TAMANHO_MARCADOR_USUARIO, TAMANHO_MARCADOR_USUARIO],
  iconAnchor: [TAMANHO_MARCADOR_USUARIO / 2, TAMANHO_MARCADOR_USUARIO / 2],
  popupAnchor: [0, -TAMANHO_MARCADOR_USUARIO / 2],
});

// `marker-cluster` continua na classe: é o seletor do script de capturas.
function iconeCluster(cluster) {
  const quantidade = cluster.getChildCount();
  const { nivel, tamanho } = nivelCluster(quantidade);
  return L.divIcon({
    className: `marker-cluster cluster-posto cluster-posto--${nivel}`,
    html: htmlCluster(quantidade),
    iconSize: [tamanho, tamanho],
  });
}

// O Leaflet só aceita cor literal no estilo do GeoJSON; ela é lida do token.
function corToken(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

// Estado selecionado do pino enquanto o popup está aberto. A classe vai no
// elemento que já existe, sem setIcon: recriar o ícone trocaria o elemento
// recém-clicado e perderia o foco. Se o cluster tirar o marcador do mapa, o
// Leaflet fecha o popup, e o ícone recriado volta sem a classe.
function marcarSelecionado(marker, selecionado) {
  marker.getElement()?.classList.toggle("marcador-posto--selecionado", selecionado);
  marker.setZIndexOffset(selecionado ? 1000 : 0);
}

const pendingUserMarker = ref(null);
const mapContainer = ref(null);
const initialMap = ref(null);
let markersLayer;
let userMarkerLayer = null;
let allStations = [];
let routeLayer = null;
let hasInitialPosition = false;
const routeContext = reactive({ value: null });
// Popup montado no momento: uma aplicação Vue só enquanto o popup está aberto.
let popupMontado = null;

function createPopupContent(props = {}) {
  const container = document.createElement("div");
  const app = createApp(PopupStation, props);
  app.use(vuetify);
  app.mount(container);
  return { app, container };
};

function desmontarPopup(popup) {
  if (popup.app) popup.app.unmount();
  popup.app = null;
  if (popupMontado === popup) popupMontado = null;
}

function createRoutePopupContent(station) {
  return createPopupContent({
    station: {
      id: station.id,
      lat: station.latitude,
      lon: station.longitude,
      name: nomeExibicaoPosto(station),
      address: station.address,
      city: station.city,
      state: station.state,
      phone: station.phone,
      businessHours: station.businessHours,
    },
    onStartRoute: () => emit('start-route', station),
    onAvaliarNeo: () => emit('avaliar-neo', station),
    routeContext,
  });
}

const emit = defineEmits(['start-route', 'show-route', 'popup-open', 'popup-close', 'avaliar-neo']);

function renderStations(stations) {
  if (!markersLayer) return;

  markersLayer.clearLayers();
  stations.forEach((station) => {
    const marker = L.marker([station.latitude, station.longitude], {
      icon: stationIcon,
      // Nome acessível do role="button" que o Leaflet põe no ícone.
      title: nomeExibicaoPosto(station),
    });
    // Conteúdo como função: o Leaflet só a chama ao abrir o popup. Montar os
    // ~970 popups de antemão travava a página por mais de 2 s ao abrir o mapa.
    // O Leaflet pode chamá-la de novo com o popup aberto (update), e aí devolve
    // o mesmo conteúdo em vez de montar outra aplicação.
    let popup = null;
    marker.bindPopup(() => {
      if (!popup?.app) {
        if (popupMontado) desmontarPopup(popupMontado);
        popup = { ...createRoutePopupContent(station), marker };
        popupMontado = popup;
      }
      // Lido aqui porque o Leaflet chama esta função dentro de update(),
      // antes do autopan.
      marker.getPopup().options.autoPanPaddingTopLeft = [5, 5 + props.margemSuperior];
      return popup.container;
    }, {
      maxWidth: 300,
      minWidth: 260,
      className: 'station-popup',
    });
    marker.on('click', () => emit('show-route', station));
    marker.on('popupopen', (evento) => {
      marcarSelecionado(marker, true);
      // O Leaflet rotula o X em inglês ("Close popup").
      evento.popup.getElement()?.querySelector('.leaflet-popup-close-button')
        ?.setAttribute('aria-label', 'Fechar');
      emit('popup-open');
    });
    marker.on('popupclose', () => {
      marcarSelecionado(marker, false);
      if (popup) desmontarPopup(popup);
      popup = null;
      emit('popup-close');
    });
    markersLayer.addLayer(marker);
  });
}

function distanceToSegment(point, start, end) {
  const latitudeScale = 111.32;
  const longitudeScale = 111.32 * Math.cos((point[0] * Math.PI) / 180);
  const px = point[1] * longitudeScale;
  const py = point[0] * latitudeScale;
  const ax = start[1] * longitudeScale;
  const ay = start[0] * latitudeScale;
  const bx = end[1] * longitudeScale;
  const by = end[0] * latitudeScale;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + projection * dx), py - (ay + projection * dy));
}

function stationIsNearRoute(station, geometry) {
  const point = [Number(station.latitude), Number(station.longitude)];
  return geometry.some((coordinate, index) => (
    index > 0 && distanceToSegment(point, geometry[index - 1], coordinate) <= 5
  ));
}

function drawRoute(route) {
  if (!initialMap.value || !route?.geometry?.coordinates?.length) return;

  if (routeLayer) initialMap.value.removeLayer(routeLayer);
  routeLayer = L.geoJSON(route.geometry, {
    style: { color: corToken('--color-blue-600'), weight: 5, opacity: 0.85 },
  }).addTo(initialMap.value);

  const geometry = route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
  if (!route.preserveView) {
    renderStations(allStations.filter((station) => stationIsNearRoute(station, geometry)));
    initialMap.value.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
  }
}

watch(() => props.route, (route) => {
  routeContext.value = route;
  // A faixa de distância e duração muda a altura do popup aberto depois do
  // autopan da abertura. update() refaz o layout e o autopan, e o conteúdo
  // continua o mesmo (ver bindPopup em renderStations).
  if (popupMontado) {
    const { marker } = popupMontado;
    nextTick(() => {
      if (popupMontado?.marker === marker) marker.getPopup()?.update();
    });
  }
  if (route) {
    drawRoute(route);
    return;
  }

  if (routeLayer && initialMap.value) {
    initialMap.value.removeLayer(routeLayer);
    routeLayer = null;
    renderStations(allStations);
  }
}, { deep: true });

// Com rota traçada, os postos que chegam passam pelo filtro de trajeto em vez
// de aparecerem todos.
watch(() => props.stations, (stations) => {
  allStations = stations || [];
  if (props.route && !props.route.preserveView) {
    drawRoute(props.route);
    return;
  }
  renderStations(allStations);
});

onMounted(async () => {
  allStations = props.stations || [];
  initialMap.value = L.map(mapContainer.value, {
    zoomAnimation: false,
    fadeAnimation: true,
    zoomControl: false,
    attributionControl: false,
  }).setView([-26.3015486, -48.8513479], 12);

  L.control.attribution({ position: "bottomleft" }).addTo(initialMap.value);

  // O ponto do usuário fica abaixo dos postos (markerPane, 600): por cima, ele
  // escondia o número do cluster da cidade e bloqueava o clique no pino de um
  // posto onde a pessoa está.
  initialMap.value.createPane("usuario").style.zIndex = 590;

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
  }).addTo(initialMap.value);

  markersLayer = L.markerClusterGroup({
    maxClusterRadius: 70,
    animate: true,
    animateAddingMarkers: false,
    iconCreateFunction: iconeCluster,
  });
  initialMap.value.addLayer(markersLayer);

  renderStations(allStations);

  if (props.route) drawRoute(props.route);

  if (pendingUserMarker.value) {
    addUserMarker(pendingUserMarker.value);
    pendingUserMarker.value = null;
  }

  await nextTick();

  requestAnimationFrame(() => {
    initialMap.value.invalidateSize();
  });
});

watch(
  () => props.user,
  (user) => {
    if (user.lat && user.lon) {
      if (markersLayer && initialMap.value) {
        addUserMarker(user)
      } else {
        pendingUserMarker.value = user
      }
    }
  },
  { deep: true, immediate: true }
)


function addUserMarker(user) {
  if (!markersLayer || !initialMap.value) return

  if (userMarkerLayer) initialMap.value.removeLayer(userMarkerLayer)

  userMarkerLayer = L.marker([user.lat, user.lon], {
    icon: userIcon,
    title: "Sua localização",
    pane: "usuario",
  }).bindPopup("Você está aqui")
  userMarkerLayer.addTo(initialMap.value)

  if (!hasInitialPosition) {
    initialMap.value.flyTo([user.lat, user.lon], 15, { duration: 1.2 })
    hasInitialPosition = true
  }

}

onUnmounted(() => {
  if (popupMontado) desmontarPopup(popupMontado);
  if (initialMap.value) {
    initialMap.value.off();
    initialMap.value.remove();
    initialMap.value = null;
  }
});
</script>

<style scoped>
.mapa-leaflet {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

/* Tudo o que o Leaflet cria (panes, ícones, popups, controles) fica dentro de
   .mapa-leaflet, por isso o :deep() alcança. */

/* Basemap como fundo: menos saturação e um pouco menos de contraste, só nos
   tiles. Marcadores, rota e popups ficam em outros panes e mantêm a cor. Os
   valores deixam nomes de cidade e de rodovia legíveis. */
.mapa-leaflet :deep(.leaflet-tile-pane) {
  filter: saturate(0.3) contrast(0.92) brightness(1.03);
}

/* Clusters: escala azul por tamanho do grupo, texto branco, borda branca. */
.mapa-leaflet :deep(.cluster-posto) {
  display: grid;
  place-items: center;
  border: 2px solid var(--color-neutral-0);
  border-radius: 50%;
  box-shadow: var(--shadow-sm), 0 0 0 4px color-mix(in srgb, var(--color-neutral-0) 45%, transparent);
  color: var(--color-neutral-0);
  font-family: var(--font-sans);
  font-size: var(--text-body-sm-size);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  cursor: pointer;
}

.mapa-leaflet :deep(.cluster-posto--pequeno) { background: var(--color-blue-500); }
.mapa-leaflet :deep(.cluster-posto--medio) { background: var(--color-blue-700); }
.mapa-leaflet :deep(.cluster-posto--grande) {
  background: var(--color-blue-900);
  font-size: var(--text-body-size);
}

/* Pino do posto. A raiz do divIcon é posicionada pelo Leaflet com transform;
   quem cresce no estado selecionado é o wrapper interno, a partir da ponta. */
.mapa-leaflet :deep(.marcador-posto) {
  background: none;
  border: 0;
  cursor: pointer;
}

.mapa-leaflet :deep(.marcador-posto__pino) {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: 50% 98%;
  transition: transform var(--transition);
}

.mapa-leaflet :deep(.marcador-posto__pino svg) {
  display: block;
  overflow: visible;
}

.mapa-leaflet :deep(.marcador-posto__corpo) {
  fill: var(--color-blue-700);
  stroke: var(--color-neutral-0);
  stroke-width: 1.5;
}

.mapa-leaflet :deep(.marcador-posto__icone) {
  fill: var(--color-neutral-0);
}

.mapa-leaflet :deep(.marcador-posto:hover .marcador-posto__corpo) {
  fill: var(--color-blue-800);
}

/* Selecionado: maior e com anel blue-300 em volta do pino. */
.mapa-leaflet :deep(.marcador-posto--selecionado .marcador-posto__pino) {
  transform: scale(1.25);
}

.mapa-leaflet :deep(.marcador-posto--selecionado .marcador-posto__corpo) {
  stroke: var(--color-blue-300);
  stroke-width: 3;
}

.mapa-leaflet :deep(.marcador-posto:focus-visible) {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Localização do usuário: ponto blue-500 com halo translúcido, sem pulsar. */
.mapa-leaflet :deep(.marcador-usuario) {
  background: none;
  border: 0;
}

.mapa-leaflet :deep(.marcador-usuario__halo) {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--color-blue-500);
  opacity: 0.22;
}

.mapa-leaflet :deep(.marcador-usuario__ponto) {
  position: absolute;
  inset: 8px;
  border: 3px solid var(--color-neutral-0);
  border-radius: 50%;
  background: var(--color-blue-500);
  box-shadow: var(--shadow-sm);
}

/* Popup do posto: card de overlay. O conteúdo é o PopupStation. */
.mapa-leaflet :deep(.station-popup .leaflet-popup-content-wrapper) {
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.mapa-leaflet :deep(.station-popup .leaflet-popup-content) {
  margin: var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
}

.mapa-leaflet :deep(.station-popup .leaflet-popup-tip) {
  box-shadow: var(--shadow-sm);
}

.mapa-leaflet :deep(.leaflet-popup-close-button) {
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  color: var(--color-neutral-600);
  font: 400 20px/1 var(--font-sans);
}

.mapa-leaflet :deep(.leaflet-popup-close-button:hover) {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

.mapa-leaflet :deep(.leaflet-popup-close-button:focus-visible) {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 0;
}

/* Popup "Você está aqui": o mesmo acabamento, menor. */
.mapa-leaflet :deep(.leaflet-popup:not(.station-popup) .leaflet-popup-content-wrapper) {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-overlay);
  color: var(--color-text);
  font-size: var(--text-body-sm-size);
}

/* Atribuição: legível, com o acabamento dos elementos flutuantes. */
.mapa-leaflet :deep(.leaflet-control-attribution) {
  margin: 0 0 var(--space-2) var(--space-2);
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-neutral-600);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
}

.mapa-leaflet :deep(.leaflet-control-attribution a) {
  color: var(--color-blue-600);
}
</style>
