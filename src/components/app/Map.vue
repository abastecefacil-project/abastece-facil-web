<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { ref, onMounted, onUnmounted, watch, createApp, nextTick  } from "vue";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import PopupStation from "@/components/app/PopupStation.vue";
import vuetify from "@/plugins/vuetify";
import { apiPublic } from "@/services/apiClient";

const props = defineProps({
  user: {
    type: Object,
    required: true,
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

function createPopupContent(props = {}) {
  const container = document.createElement("div");
  const app = createApp(PopupStation, props);
  app.use(vuetify);
  app.mount(container);
  return container;
};

async function getGasStations() {
  try {
    const response = await apiPublic.get("/api/public/gas-stations/filter?page=0&size=100&active=true")
    return response.data.content
  } catch (err) {console.log("Erro ao buscar postos", err)}
}

let stationIcon = L.icon({
  iconUrl: "https://cdn-icons-png.freepik.com/512/6395/6395463.png",
  iconSize: [38, 42],
  iconAnchor: [19, 42],
  popupAnchor: [0, -42],
});

onMounted(async () => {
  const data = await getGasStations();
  initialMap.value = L.map(mapContainer.value, {
    zoomAnimation: false,
    fadeAnimation: true,
  }).setView([-26.3015486, -48.8513479], 12);

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

  data.forEach((loc, index) => {
    const marker = L.marker([loc.latitude, loc.longitude], { icon: stationIcon });

    const popupContent = createPopupContent({
      station: { id: index, lat: loc.latitude, lon: loc.longitude, name: loc.name, address: loc.address, city: loc.city, state: loc.state, phone: loc.phone, businessHours: loc.businessHours },
    });

    marker.bindPopup(popupContent, { maxWidth: 300, minWidth: 200,  className: "station-popup" });

    markersLayer.addLayer(marker);
  });

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

  // Remove marcador anterior do usuário
  markersLayer.eachLayer((layer) => {
    if (layer.getPopup?.().getContent?.() === "Você está aqui") {
      markersLayer.removeLayer(layer)
    }
  })

  const userMarker = L.marker([user.lat, user.lon], {
  }).bindPopup("Você está aqui")
  markersLayer.addLayer(userMarker)

  initialMap.value.flyTo([user.lat, user.lon], 15, { duration: 1.2 })

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
