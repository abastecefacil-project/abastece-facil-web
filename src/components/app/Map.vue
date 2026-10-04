<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { ref, reactive, onMounted, onUnmounted, watch, createApp, nextTick  } from "vue";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import PopupStation from "@/components/app/PopupStation.vue";
import vuetify from "@/plugins/vuetify";
import { apiPrivate } from "@/services/apiClient";
import { nomeExibicaoPosto } from "@/utils/posto";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  route: {
    type: Object,
    default: null,
  },
});

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pendingUserMarker = ref(null);
const mapContainer = ref(null);
const initialMap = ref(null);
let markersLayer;
let userMarkerLayer = null;
let allStations = [];
let routeLayer = null;
let hasInitialPosition = false;
const routeContext = reactive({ value: null });

function createPopupContent(props = {}) {
  const container = document.createElement("div");
  const app = createApp(PopupStation, props);
  app.use(vuetify);
  app.mount(container);
  return container;
};

async function getGasStations() {
  try {
    const response = await apiPrivate.get("/api/public/gas-stations/filter?page=0&size=100&active=true")
    return response.data.content
  } catch (err) {console.log("Erro ao buscar postos", err)}
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
    routeContext,
  });
}

const emit = defineEmits(['start-route', 'show-route', 'popup-open', 'popup-close']);

function renderStations(stations) {
  if (!markersLayer) return;

  markersLayer.clearLayers();
  stations.forEach((station) => {
    const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon });
    marker.bindPopup(createRoutePopupContent(station), {
      maxWidth: 300,
      minWidth: 200,
      className: 'station-popup',
    });
    marker.on('click', () => emit('show-route', station));
    marker.on('popupopen', () => emit('popup-open'));
    marker.on('popupclose', () => emit('popup-close'));
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
    style: { color: '#1976d2', weight: 5, opacity: 0.8 },
  }).addTo(initialMap.value);

  const geometry = route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
  if (!route.preserveView) {
    renderStations(allStations.filter((station) => stationIsNearRoute(station, geometry)));
    initialMap.value.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
  }
}

watch(() => props.route, (route) => {
  routeContext.value = route;
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

let stationIcon = L.icon({
  iconUrl: "https://cdn-icons-png.freepik.com/512/6395/6395463.png",
  iconSize: [38, 42],
  iconAnchor: [19, 42],
  popupAnchor: [0, -42],
});

onMounted(async () => {
  const data = await getGasStations();
  allStations = data || [];
  initialMap.value = L.map(mapContainer.value, {
    zoomAnimation: false,
    fadeAnimation: true,
    zoomControl: false,
    attributionControl: false,
  }).setView([-26.3015486, -48.8513479], 12);

  L.control.attribution({ position: "bottomleft" }).addTo(initialMap.value);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
  }).addTo(initialMap.value);

  markersLayer = L.markerClusterGroup({
    maxClusterRadius: 70,
    animate: true,
    animateAddingMarkers: false,
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
  }).bindPopup("Você está aqui")
  userMarkerLayer.addTo(initialMap.value)

  if (!hasInitialPosition) {
    initialMap.value.flyTo([user.lat, user.lon], 15, { duration: 1.2 })
    hasInitialPosition = true
  }

}

onUnmounted(() => {
  if (initialMap.value) {
    initialMap.value.off();
    initialMap.value.remove();
    initialMap.value = null;
  }
});
</script>

<style>
.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

</style>
