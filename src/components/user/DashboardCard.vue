<template>
  <v-card class="dashboard-card" rounded="lg">
    <v-card-text class="pa-5">
      <div class="d-flex align-start">
        <div class="step-number mr-4">
          <div class="step-circle">
            <span class="step-value">{{ step }}</span>
          </div>
        </div>
        <div class="flex-grow-1">
          <div class="d-flex align-center mb-2">
            <v-icon :icon="icon" size="20" class="mr-2 card-icon"></v-icon>
            <h3 class="card-title">{{ title }}</h3>
          </div>
          <p v-if="!isMobile" class="card-description">{{ description }}</p>

          <v-btn
            :color="buttonColor"
            variant="tonal"
            size="small"
            :to="to"
            append-icon="mdi-arrow-right"
          >
            Acessar
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 600)
const buttonColor = 'primary'

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

defineProps({
  step: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  to: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.dashboard-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
  height: 100%;
}

.dashboard-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
}

.card-icon {
  color: var(--color-primary);
}

.card-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin-bottom: 16px;
}

.step-number {
  flex-shrink: 0;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-value {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

@media (max-width: 600px) {
  .step-circle {
    width: 34px;
    height: 34px;
  }

  .step-value {
    font-size: 0.9375rem;
  }
}
</style>