<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <!-- Cabeçalho -->
      <DashboardHeader />

      <!-- DESKTOP / TABLET -->
      <v-row class="d-none d-md-flex">
        <v-col cols="12" xl="9" lg="9">
          <!-- Cards de Estatísticas -->
          <StatsCards
            :gasStations="gasStationsDashboard"
            :vehicles="vehiclesDashboard"
            :users="usersDashboard"
            :occurrences="occurrencesDashboard"
          />

          <!-- Cards de Navegação -->
          <NavigationCards />
        </v-col>

        <!-- Sidebar de Ocorrências -->
        <v-col cols="12" xl="3" lg="3">
          <OccurrencesSidebar
            :occurrences="lastOccurrences"
            :loading="loadingOccurrences"
          />
        </v-col>
      </v-row>

      <!-- MOBILE -->
      <v-row class="d-flex d-md-none">
        <!-- NavigationCards primeiro -->
        <v-col cols="12">
          <NavigationCards />
        </v-col>

        <!-- StatsCards em seguida -->
        <v-col cols="12" class="mt-1">
          <StatsCards
          :gasStations="gasStationsDashboard"
          :vehicles="vehiclesDashboard"
          :users="usersDashboard"
          :occurrences="occurrencesDashboard"
          />
        </v-col>
        
        <!-- Ocorrências por último -->
        <v-col cols="12" class="mt-3">
          <OccurrencesSidebar
            :mobile="true"
            :occurrences="lastOccurrences"
            :loading="loadingOccurrences"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import Footer from '@/components/app/Footer.vue'
import DashboardHeader from '@/components/admin/DashboardHeader.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import NavigationCards from '@/components/admin/NavigationCards.vue'
import OccurrencesSidebar from '@/components/admin/OccurrencesSidebar.vue'
import { onMounted, ref } from 'vue'
import { getDashboardOccurrences } from '@/services/occurrenceService'
import { getStationDashboard } from '@/services/stationService'
import { getVehicleDashboard } from '@/services/vehicleService'
import { getUsersDashboard } from '@/services/userService'

const gasStationsDashboard = ref(0)
const vehiclesDashboard = ref(0)
const usersDashboard = ref(0)
const occurrencesDashboard = ref(0)
const lastOccurrences = ref([])
const loadingOccurrences = ref(false)

onMounted(async () => {
  loadingOccurrences.value = true
  try {
    const [
      responseOccurrence,
      responseStations,
      responseVehicles,
      responseUsers
    ] = await Promise.all([
      getDashboardOccurrences(),
      getStationDashboard(),
      getVehicleDashboard(),
      getUsersDashboard()
    ])

    lastOccurrences.value = responseOccurrence.data.latestIncidents
    occurrencesDashboard.value = responseOccurrence.data.total
    gasStationsDashboard.value = responseStations.data.totalElements
    vehiclesDashboard.value = responseVehicles.data.totalElements
    usersDashboard.value = responseUsers.data.totalElements
  } catch (err) {
    console.error('Erro ao carregar dashboard: ', err)
  } finally {
    loadingOccurrences.value = false
  }
})
</script>

<style scoped>
.dashboard-wrapper {
  background-color: var(--color-background);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-container {
  padding: 24px;
  flex: 1;
}

/* Responsividade */
@media (max-width: 1264px) {
  .dashboard-container {
    padding: 10px;
  }
}

@media (max-width: 600px) {
  .dashboard-container {
    padding: 10px;
  }

  .v-col {
    margin-bottom: 12px;
  }
}
</style>
