<template>
  <div class="postos-container">
    <PageHeader titulo="Postos" subtitulo="Visualize todos os postos de combustível cadastrados" />

    <v-alert
      v-if="!loading && cargaIncompleta"
      type="warning"
      variant="tonal"
      density="compact"
      class="carga-aviso"
    >
      Não foi possível carregar todos os postos. Recarregue a página.
    </v-alert>

    <section class="lista-postos" aria-label="Lista de postos">
      <!-- No celular a toolbar fica presa no topo do .main-container, que é quem
           rola: a busca continua à mão no meio da lista. -->
      <div class="lista-toolbar">
        <v-text-field
          v-model="searchQuery"
          label="Buscar por nome ou cidade"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          hide-details
          class="lista-busca"
        />
        <!-- Com zero resultados quem fala é o EmptyState. -->
        <p v-if="!loading && filteredPostos.length" class="lista-contagem" aria-live="polite">
          {{ descreverQuantidadePostos(filteredPostos.length, Boolean(searchQuery)) }}
        </p>
      </div>

      <ul v-if="loading" class="lista" aria-busy="true">
        <li v-for="n in LINHAS_ESQUELETO" :key="n" class="posto-linha linha-esqueleto" aria-hidden="true">
          <div class="posto-principal">
            <span class="esqueleto esqueleto--titulo" />
            <span class="esqueleto esqueleto--meta" />
          </div>
          <div class="posto-telefone"><span class="esqueleto esqueleto--curto" /></div>
          <div class="posto-horario"><span class="esqueleto esqueleto--curto" /></div>
        </li>
      </ul>

      <EmptyState
        v-else-if="filteredPostos.length === 0"
        icone="mdi-gas-station-off-outline"
        :titulo="searchQuery ? 'Nenhum posto encontrado' : 'Nenhum posto disponível'"
        :texto="searchQuery ? 'Ajuste a busca ou limpe o campo para ver todos os postos.' : ''"
      />

      <ul v-else class="lista">
        <!-- A linha inteira abre o detalhe com o mouse; pelo teclado, o chevron. -->
        <li
          v-for="linha in linhasDaPagina"
          :key="linha.posto.id"
          class="posto-linha"
          @click="openModal(linha.posto)"
        >
          <div class="posto-principal">
            <span class="posto-nome">{{ linha.nome }}</span>
            <span class="posto-local">
              <span v-if="linha.cidadeUf" class="posto-cidade">{{ linha.cidadeUf }}</span>
              <span v-if="linha.endereco" class="posto-endereco">
                {{ linha.endereco }}
                <v-tooltip activator="parent" location="top" :text="linha.enderecoCompleto" />
              </span>
            </span>
          </div>

          <div class="posto-telefone">
            <v-icon icon="mdi-phone-outline" size="16" class="posto-dado-icone" />
            <a
              v-if="linha.telefone"
              :href="hrefTelefone(linha.telefone)"
              class="posto-tel tabular"
              :aria-label="`Ligar para ${linha.nome}: ${linha.telefone}`"
              @click.stop
            >{{ linha.telefone }}</a>
            <span v-else class="horario-nao-informado">{{ TELEFONE_NAO_INFORMADO }}</span>
          </div>

          <div class="posto-horario">
            <v-icon icon="mdi-clock-outline" size="16" class="posto-dado-icone" />
            <span v-if="linha.horario" class="tabular">{{ linha.horario }}</span>
            <span v-else class="horario-nao-informado">{{ HORARIO_NAO_INFORMADO }}</span>
          </div>

          <v-btn
            variant="text"
            size="small"
            density="compact"
            icon
            class="posto-detalhe"
            :aria-label="`Ver detalhes do posto ${linha.nome}`"
            @click.stop="openModal(linha.posto)"
          >
            <v-icon icon="mdi-chevron-right" size="20" />
            <v-tooltip activator="parent" location="top" text="Ver detalhes" />
          </v-btn>
        </li>
      </ul>

      <!-- Paginação no navegador: o total é o da lista já filtrada pela busca. -->
      <div v-if="!loading && filteredPostos.length > 0" class="lista-rodape">
        <PaginationBar
          v-model="paginaAtual"
          :length="totalPages"
          :total="filteredPostos.length"
          :por-pagina="POSTOS_POR_PAGINA"
        />
      </div>
    </section>

    <GasStationModal v-model="showModal" :posto="selectedPosto" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import GasStationModal from '@/components/user/GasStationModal.vue'
import PaginationBar from '@/components/app/PaginationBar.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { listarTodosPostosAtivos } from '@/services/stationService'
import { HORARIO_NAO_INFORMADO, descreverQuantidadePostos, nomeExibicaoPosto } from '@/utils/posto'
import { TELEFONE_NAO_INFORMADO, hrefTelefone } from '@/utils/formatacao'
import { apresentacaoLinhaPosto } from '@/utils/postoExibicao'

// A base inteira vem numa carga só e a paginação é feita aqui, porque a busca
// e a ordenação são no navegador: sobre uma página do servidor, a busca só
// enxergaria os 10 postos dela.
const POSTOS_POR_PAGINA = 10
const LINHAS_ESQUELETO = 6

const route = useRoute()

// Estados reativos
const loading = ref(false)
// A busca da Início chega como `?busca=` (REDESIGN §5.8) e preenche o campo. Só
// na entrada: digitar aqui não reescreve a URL.
const searchQuery = ref(typeof route.query.busca === 'string' ? route.query.busca : '')
// Sem controle na tela: o A-Z não é alcançável e continua assim (R10).
const statusFilter = ref('todos')
const postos = ref([])
const cargaIncompleta = ref(false)
const showModal = ref(false)
const selectedPosto = ref(null)
const paginaAtual = ref(1)

// GET - Busca todos os postos ativos
async function carregaPostos() {
  loading.value = true
  try {
    const { postos: carregados, completo } = await listarTodosPostosAtivos()
    cargaIncompleta.value = !completo

    postos.value = carregados.map((posto) => ({
      id: posto.id,
      name: posto.name,
      fantasyName: posto.fantasyName,
      completeAddress: `${posto.address} - ${posto.district}, ${posto.city} - ${posto.state}`,
      phone: posto.phone,
      cnpj: posto.cnpj,
      cep: posto.cep,
      district: posto.district,
      city: posto.city,
      state: posto.state,
      address: (posto.address ?? '').split(',')[0],
      number: (posto.address ?? '').split(',')[1]?.trim() || '',
      businessHours: posto.businessHours,
    }))
  } finally {
    loading.value = false
  }
}

// Computed para filtrar postos. A busca compara os dados crus; a formatação é
// só da linha exibida.
const filteredPostos = computed(() => {
  let filtered = postos.value

  // Filtro por busca
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (posto) =>
        posto.name.toLowerCase().includes(query) ||
        posto.fantasyName?.toLowerCase().includes(query) ||
        posto.completeAddress.toLowerCase().includes(query) ||
        posto.phone?.includes(query) ||
        posto.cnpj.includes(query),
    )
  }

  // Ordenação A-Z
  if (statusFilter.value === 'az') {
    filtered = [...filtered].sort((a, b) =>
      nomeExibicaoPosto(a).localeCompare(nomeExibicaoPosto(b)),
    )
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredPostos.value.length / POSTOS_POR_PAGINA))

// Formatada só a página visível: são 10 linhas, não a base inteira.
const linhasDaPagina = computed(() => {
  const inicio = (paginaAtual.value - 1) * POSTOS_POR_PAGINA
  return filteredPostos.value
    .slice(inicio, inicio + POSTOS_POR_PAGINA)
    .map((posto) => ({ posto, ...apresentacaoLinhaPosto(posto) }))
})

// Busca ou ordenação nova mudam a lista: volta para a primeira página.
watch([searchQuery, statusFilter], () => {
  paginaAtual.value = 1
})

// Abrir modal
const openModal = (posto) => {
  selectedPosto.value = posto
  showModal.value = true
}

onMounted(() => {
  carregaPostos()
})
</script>

<style scoped>
/* Fundo e rolagem são do AppShell. Largura e padding iguais aos de Postos do
   admin: 1440px, 32px no desktop e 16px abaixo de md. */
.postos-container {
  max-width: 1440px;
  padding: var(--space-8);
}

.carga-aviso {
  margin-bottom: var(--space-4);
}

/* ── container da lista (card do §4.6) ───────────────────────────────────── */

/* overflow: clip, e não hidden: hidden faria da seção o contêiner de rolagem
   do sticky, e a busca deixaria de prender no topo da página. */
.lista-postos {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: clip;
}

.lista-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.lista-busca {
  flex: 1 1 240px;
  max-width: 360px;
}

.lista-contagem {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: 500;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

/* ── linhas ──────────────────────────────────────────────────────────────── */

.lista {
  margin: 0;
  padding: 0;
  list-style: none;
}

.posto-linha {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168px 168px 32px;
  align-items: center;
  column-gap: var(--space-4);
  min-height: 64px;
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color var(--transition);
}

.posto-linha:last-child {
  border-bottom: none;
}

.posto-linha:not(.linha-esqueleto):hover {
  background: var(--color-neutral-50);
}

.linha-esqueleto {
  cursor: default;
}

.posto-principal {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.posto-nome,
.posto-endereco {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.posto-nome {
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
}

/* Cidade/UF e endereço na mesma linha em body-sm; o endereço trunca. */
.posto-local {
  display: flex;
  min-width: 0;
  gap: var(--space-2);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.posto-cidade {
  flex-shrink: 0;
  font-weight: 500;
  color: var(--color-neutral-700);
}

.posto-cidade + .posto-endereco::before {
  content: '·';
  margin-right: var(--space-2);
}

.posto-endereco {
  min-width: 0;
}

.posto-telefone,
.posto-horario {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  white-space: nowrap;
}

.posto-dado-icone {
  flex-shrink: 0;
  color: var(--color-neutral-400);
}

.posto-tel {
  color: var(--color-blue-600);
  font-weight: 500;
  text-decoration: none;
}

.posto-tel:hover {
  text-decoration: underline;
}

.tabular {
  font-variant-numeric: tabular-nums;
}

.posto-detalhe {
  color: var(--color-text-muted);
}

.posto-linha:hover .posto-detalhe {
  color: var(--color-primary);
}

/* Esqueleto de linha: blocos estáticos, sem animação (§4.4). */
.esqueleto {
  display: block;
  height: 12px;
  width: 80%;
  border-radius: var(--radius-sm);
  background: var(--color-neutral-100);
}

.esqueleto--titulo {
  height: 14px;
  width: 45%;
  margin-bottom: 6px;
}

.esqueleto--meta {
  width: 70%;
}

.esqueleto--curto {
  width: 112px;
}

.lista-rodape {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.lista-rodape :deep(.pagination-bar) {
  padding: 0;
}

/* ── responsividade ──────────────────────────────────────────────────────── */

/* Abaixo de md: a busca prende no topo, e a linha empilha com telefone e
   horário lado a lado embaixo do endereço. */
@media (max-width: 959px) {
  .postos-container {
    padding: var(--space-4);
  }

  .lista-toolbar {
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .posto-linha {
    grid-template-columns: minmax(0, 1fr) auto 32px;
    grid-template-areas:
      'principal principal detalhe'
      'telefone horario detalhe';
    column-gap: var(--space-4);
    row-gap: var(--space-2);
    padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4);
  }

  .posto-principal { grid-area: principal; }
  .posto-telefone { grid-area: telefone; }
  .posto-horario { grid-area: horario; }
  .posto-detalhe { grid-area: detalhe; }

  .posto-telefone,
  .posto-horario {
    font-size: var(--text-body-sm-size);
    line-height: var(--text-body-sm-line);
  }

  /* Cidade e endereço em linhas próprias: lado a lado, o endereço sumiria. */
  .posto-local {
    flex-direction: column;
    gap: 0;
  }

  .posto-cidade + .posto-endereco::before {
    content: none;
  }
}

@media (max-width: 599px) {
  .lista-busca {
    max-width: none;
    flex-basis: 100%;
  }

  /* Telefone e horário cada um na sua linha: os dois juntos não cabem em 390px. */
  .posto-linha {
    grid-template-columns: minmax(0, 1fr) 32px;
    grid-template-areas:
      'principal detalhe'
      'telefone detalhe'
      'horario detalhe';
    row-gap: var(--space-1);
  }

  .posto-principal {
    margin-bottom: var(--space-1);
  }
}
</style>
