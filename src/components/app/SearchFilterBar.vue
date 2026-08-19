<template>
  <div class="search-filter-bar">
    <div class="search-group">
      <!-- Campo de pesquisa -->
      <v-text-field
        :model-value="searchQuery"
        @update:model-value="$emit('update:searchQuery', $event)"
        :label="searchLabel"
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        clearable
        rounded="lg"
        class="search-field"
        hide-details
      ></v-text-field>

      <!-- Botão de filtro -->
      <v-menu v-if="filterOptions && filterOptions.length">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-filter-variant"
            variant="outlined"
            size="small"
            class="status-filter-btn"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item
            v-for="option in filterOptions"
            :key="option.value"
            @click="$emit('update:statusFilter', option.value)"
          >
            <v-list-item-title>{{ option.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Botão de ação -->
    <v-btn
      v-if="actionLabel"
      :color="actionColor"
      size="large"
      :prepend-icon="actionIcon"
      rounded="lg"
      @click="$emit('action')"
      class="new-item-btn"
    >
      {{ actionLabel }}
    </v-btn>
  </div>
</template>

<script setup>
// Props
defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
  statusFilter: {
    type: String,
    default: '',
  },
  searchLabel: {
    type: String,
    default: 'Pesquisar...',
  },
  filterOptions: {
    type: Array,
    default: () => [],
  },
  actionLabel: {
    type: String,
    default: '',
  },
  actionIcon: {
    type: String,
    default: 'mdi-plus',
  },
  actionColor: {
    type: String,
    default: 'primary',
  },
})

// Emits
defineEmits(['update:searchQuery', 'update:statusFilter', 'action'])
</script>

<style scoped>
.search-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.search-field {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  min-width: 280px;
  max-width: 380px;
  flex: 1;
}

/* Botão de filtro */
.status-filter-btn {
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-muted);
  flex-shrink: 0;
  height: 46px;
  width: 46px;
  transition:
    border-color var(--transition),
    color var(--transition);
}

.status-filter-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.new-item-btn {
  flex-shrink: 0;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  height: 46px;
}

/* Responsividade */
@media (max-width: 1024px) {
  .search-filter-bar {
    gap: 16px;
  }

  .search-group {
    gap: 12px;
  }

  .search-field {
    min-width: 250px;
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .search-group {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .search-field {
    min-width: 200px;
    max-width: none;
    flex: 1;
  }

  .new-item-btn {
    align-self: stretch;
  }
}

@media (max-width: 480px) {
  .search-group {
    align-items: stretch;
    gap: 12px;
  }

  .search-field {
    min-width: auto;
  }
}
</style>
