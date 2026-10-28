<template>
  <!-- Card do posto no padrão §4.6. Montado só com o popup aberto (Map.vue). -->
  <div class="popup-posto">
    <h3 class="popup-posto__nome">{{ dados.nome }}</h3>

    <ul class="popup-posto__dados">
      <li>
        <v-icon icon="mdi-map-marker-outline" size="16" class="popup-posto__icone" />
        <span>{{ dados.endereco }}</span>
      </li>
      <li v-if="dados.cidade">
        <v-icon icon="mdi-city-variant-outline" size="16" class="popup-posto__icone" />
        <span>{{ dados.cidade }}</span>
      </li>
      <li>
        <v-icon icon="mdi-phone-outline" size="16" class="popup-posto__icone" />
        <a v-if="dados.telefone.href" :href="dados.telefone.href" class="popup-posto__telefone">{{ dados.telefone.texto }}</a>
        <span v-else :class="{ 'horario-nao-informado': !dados.telefone.informado }">{{ dados.telefone.texto }}</span>
      </li>
      <li>
        <v-icon icon="mdi-clock-outline" size="16" class="popup-posto__icone" />
        <span :class="{ 'horario-nao-informado': !dados.horario.informado }">{{ dados.horario.texto }}</span>
      </li>
    </ul>

    <div v-if="routeContext?.value" class="popup-posto__rota">
      <span><v-icon icon="mdi-map-marker-distance" size="16" />{{ formatarDistancia(routeContext.value.distance) }}</span>
      <span><v-icon icon="mdi-timer-outline" size="16" />{{ formatarDuracao(routeContext.value.duration) }}</span>
    </div>

    <div class="popup-posto__acoes">
      <!-- Sem a prop `color`: o Vuetify a converteria em .bg-primary, que é
           !important. A cor sai das classes abaixo, pelos tokens. -->
      <v-btn
        variant="flat"
        prepend-icon="mdi-navigation-variant-outline"
        class="popup-posto__botao btn-primario"
        @click="startRoute"
      >
        Iniciar navegação
      </v-btn>
      <v-btn
        v-if="onAvaliarNeo"
        variant="outlined"
        prepend-icon="mdi-credit-card-outline"
        class="popup-posto__botao btn-secundario"
        @click="onAvaliarNeo()"
      >
        Cartão Neo
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { formatarDistancia, formatarDuracao } from '@/utils/formatacao'
import { computed } from 'vue'
import { apresentacaoPopupPosto } from '@/utils/mapa'

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
  onStartRoute: {
    type: Function,
    default: null,
  },
  onAvaliarNeo: {
    type: Function,
    default: null,
  },
  routeContext: {
    type: Object,
    default: null,
  },
})

const { lat, lon } = props.station
const dados = apresentacaoPopupPosto(props.station)

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

</script>

<style scoped>
/* Borda, raio e sombra do card vêm do wrapper do popup, em Map.vue. */
.popup-posto {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  color: var(--color-text);
}

/* Espaço à direita para o X do popup. */
.popup-posto__nome {
  margin: 0;
  padding-right: var(--space-6);
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
  overflow-wrap: anywhere;
}

.popup-posto__dados {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.popup-posto__dados li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

/* Alinha o ícone de 16px à primeira linha de 20px. */
.popup-posto__icone {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-neutral-500);
}

.popup-posto__telefone {
  color: var(--color-blue-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.popup-posto__telefone:hover {
  color: var(--color-blue-800);
}

.popup-posto__rota {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-blue-50);
  color: var(--color-blue-700);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.popup-posto__rota span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.popup-posto__acoes {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.v-btn.popup-posto__botao {
  width: 100%;
}

/* Primário (§4.6): preenchido primary. */
.v-btn.btn-primario {
  background-color: var(--color-primary);
  color: var(--color-neutral-0);
}

.v-btn.btn-primario:hover {
  background-color: var(--color-blue-800);
}

/* Secundário (§4.6), o mesmo da Início e dos postos do admin. A classe dobrada
   vence o outlined do Vuetify, que herdaria a cor do texto na borda. */
.v-btn.btn-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}
</style>
