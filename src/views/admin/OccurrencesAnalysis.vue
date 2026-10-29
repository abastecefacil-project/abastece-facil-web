<template>
  <div class="ocorrencias-container">
    <PageHeader titulo="Ocorrências" subtitulo="Acompanhe as ocorrências registradas no sistema" />

    <section class="tabela-ocorrencias" aria-label="Lista de ocorrências">
      <div class="tabela-toolbar">
        <v-text-field
          v-model="searchQuery"
          label="Buscar ocorrências"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          hide-details
          class="tabela-busca"
        />

        <!-- A ordem é fixa no backend (created_at DESC). O antigo "Mais
             recentes / Mais antigas" não tinha efeito e saiu (REDESIGN §5.6). -->
        <p class="tabela-ordem">
          <v-icon icon="mdi-sort-clock-descending-outline" size="16" aria-hidden="true" />
          Mais recentes primeiro
        </p>
      </div>

      <div v-if="erroCarregamento && !loading" class="tabela-erro" role="alert">
        <v-icon icon="mdi-alert-circle-outline" size="40" class="tabela-erro__icone" />
        <p class="tabela-erro__titulo">Não foi possível carregar as ocorrências</p>
        <p class="tabela-erro__texto">Verifique a conexão e tente novamente.</p>
        <v-btn variant="outlined" class="btn-secundario mt-4" @click="loadingOccurrences(currentPage)">
          Tentar novamente
        </v-btn>
      </div>

      <EmptyState
        v-else-if="!loading && occurrences.length === 0"
        icone="mdi-clipboard-text-off-outline"
        :titulo="searchQuery ? 'Nenhuma ocorrência encontrada' : 'Nenhuma ocorrência registrada'"
        :texto="searchQuery ? 'Ajuste a busca e tente de novo.' : 'As ocorrências registradas pelos colaboradores aparecerão aqui.'"
      />

      <table v-else class="tabela" :aria-busy="loading">
        <thead>
          <tr>
            <th scope="col" class="col-data">Registrada em</th>
            <th scope="col" class="col-tipo">Tipo</th>
            <th scope="col" class="col-veiculo">Veículo</th>
            <th scope="col" class="col-colaborador">Colaborador</th>
            <th scope="col" class="col-descricao">Descrição</th>
            <th scope="col" class="col-acoes"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr v-for="n in LINHAS_ESQUELETO" :key="n" class="linha-esqueleto" aria-hidden="true">
            <td class="col-data"><span class="esqueleto esqueleto--curto" /></td>
            <td class="col-tipo"><span class="esqueleto esqueleto--titulo" /></td>
            <td class="col-veiculo"><span class="esqueleto esqueleto--chip" /></td>
            <td class="col-colaborador"><span class="esqueleto esqueleto--meta" /></td>
            <td class="col-descricao"><span class="esqueleto" /></td>
            <td class="col-acoes" />
          </tr>
        </tbody>

        <!-- A linha inteira abre o detalhe com o mouse; pelo teclado, o botão
             de ação (mesmo padrão da lista de postos do colaborador). -->
        <tbody v-else>
          <tr
            v-for="linha in linhas"
            :key="linha.ocorrencia.id"
            class="linha-clicavel"
            @click="openOccurrence(linha, $event)"
          >
            <td class="col-data">
              <!-- No celular o cabeçalho some; o rótulo vai junto da data. -->
              <span class="rotulo-movel">Registrada em </span>
              <span class="tabular">{{ linha.registradaEm }}</span>
              <span v-if="linha.ocorridaEm" class="data-ocorrida">
                Ocorrida em <span class="tabular">{{ linha.ocorridaEm }}</span>
              </span>
            </td>
            <td class="col-tipo">
              <span class="ocorrencia-tipo">{{ linha.tipo }}</span>
              <!-- Abaixo de 1280px a coluna Descrição some e a descrição vem para cá. -->
              <span v-if="linha.descricaoLinha" class="descricao-compacta">
                {{ linha.descricaoLinha }}
                <v-tooltip activator="parent" location="top" max-width="480" :text="linha.descricaoLinha" />
              </span>
            </td>
            <td class="col-veiculo">
              <PlateBadge v-if="linha.placa" :placa="linha.placa" />
            </td>
            <td class="col-colaborador">
              <span v-if="linha.colaborador" class="truncado">{{ linha.colaborador }}</span>
              <span v-else class="horario-nao-informado">{{ NAO_INFORMADO }}</span>
            </td>
            <td class="col-descricao">
              <span v-if="linha.descricaoLinha" class="truncado">
                {{ linha.descricaoLinha }}
                <v-tooltip activator="parent" location="top" max-width="480" :text="linha.descricaoLinha" />
              </span>
            </td>
            <td class="col-acoes">
              <v-btn
                variant="text"
                size="small"
                density="compact"
                icon
                class="acao"
                :data-origem="`detalhe-${linha.ocorrencia.id}`"
                :aria-label="rotuloDetalhe(linha)"
                @click.stop="openOccurrence(linha, $event)"
              >
                <v-icon icon="mdi-chevron-right" size="20" />
                <v-tooltip activator="parent" location="top" text="Ver detalhes" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!erroCarregamento && occurrences.length > 0" class="tabela-rodape">
        <PaginationBar
          v-model="currentPageUi"
          :length="totalPages"
          :total="totalElements"
          :por-pagina="pageSize"
          @update:modelValue="(page) => loadingOccurrences(page - 1)"
        />
      </div>
    </section>

    <!-- Detalhe da ocorrência (REDESIGN §4.6) -->
    <v-dialog v-model="dialogOpen" max-width="560px" scrollable @after-leave="aoFecharDialogo">
      <v-card v-if="selectedOccurrence">
        <v-card-title class="dialogo-cabecalho">
          <h2 class="dialogo-titulo">{{ selectedOccurrence.tipo }}</h2>
          <v-btn
            icon
            variant="text"
            size="small"
            density="comfortable"
            aria-label="Fechar"
            class="dialogo-fechar"
            @click="dialogOpen = false"
          >
            <v-icon icon="mdi-close" size="20" />
          </v-btn>
        </v-card-title>

        <v-card-text class="dialogo-corpo">
          <dl class="ficha">
            <div class="ficha__item">
              <dt>Veículo</dt>
              <dd>
                <PlateBadge v-if="selectedOccurrence.placa" :placa="selectedOccurrence.placa" />
                <span v-else class="horario-nao-informado">{{ NAO_INFORMADO }}</span>
              </dd>
            </div>
            <div class="ficha__item">
              <dt>Colaborador</dt>
              <dd v-if="selectedOccurrence.colaborador">{{ selectedOccurrence.colaborador }}</dd>
              <dd v-else class="horario-nao-informado">{{ NAO_INFORMADO }}</dd>
            </div>
            <div class="ficha__item">
              <dt>Data da ocorrência</dt>
              <dd v-if="selectedOccurrence.dataOcorrencia" class="tabular">{{ selectedOccurrence.dataOcorrencia }}</dd>
              <dd v-else class="horario-nao-informado">{{ NAO_INFORMADO }}</dd>
            </div>
            <div class="ficha__item">
              <dt>Registrada em</dt>
              <dd v-if="selectedOccurrence.registradaEm" class="tabular">{{ selectedOccurrence.registradaEm }}</dd>
              <dd v-else class="horario-nao-informado">{{ NAO_INFORMADO }}</dd>
            </div>
          </dl>

          <div class="descricao">
            <p class="descricao__rotulo">Descrição</p>
            <p v-if="selectedOccurrence.descricao" class="descricao__texto">{{ selectedOccurrence.descricao }}</p>
            <p v-else class="descricao__texto horario-nao-informado">Sem descrição</p>
          </div>
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-btn
            class="btn-dialog btn-dialog--cancelar"
            variant="outlined"
            @click="dialogOpen = false"
          >
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import PaginationBar from '@/components/app/PaginationBar.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import PlateBadge from '@/components/app/PlateBadge.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { apresentacaoLinhaOcorrencia } from '@/utils/ocorrenciaExibicao'
import { getOccurrences } from '@/services/occurrenceService.js'
import { devolverFoco } from '@/utils/foco'

const NAO_INFORMADO = 'Não informado'

// Mesma quantidade da página do backend (size 10), para a tabela não mudar de
// altura quando os dados chegam.
const LINHAS_ESQUELETO = 10

// Estados reativos
const searchQuery = ref('')
const dialogOpen = ref(false)
const occurrences = ref([])
const loading = ref(false)
const erroCarregamento = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(null)
const pageSize = ref(null)
const currentPageUi = ref(1)
const selectedOccurrence = ref(null)

// Só apresentação (utils/ocorrenciaExibicao.js): a ocorrência da API segue
// intacta em `ocorrencia`.
const linhas = computed(() =>
  occurrences.value.map((ocorrencia) => ({ ocorrencia, ...apresentacaoLinhaOcorrencia(ocorrencia) })),
)

const rotuloDetalhe = (linha) =>
  [`Ver detalhes da ocorrência ${linha.tipo}`, linha.placa && `do veículo ${linha.placa}`, linha.registradaEm && `registrada em ${linha.registradaEm}`]
    .filter(Boolean)
    .join(' ')

watch(currentPage, (newVal) => {
  currentPageUi.value = newVal + 1
})

watchDebounced(
  searchQuery,
  () => {
    loadingOccurrences(0)
  },
  { debounce: 400 },
)

async function loadingOccurrences(page = 0) {
  loading.value = true
  erroCarregamento.value = false
  try {
    const title = searchQuery.value || undefined

    const response = await getOccurrences(page, title)
    const data = response.data

    occurrences.value = data.content
    currentPage.value = data.number
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    pageSize.value = data.size
  } catch (error) {
    console.error('Erro ao carregar ocorrências:', error)
    erroCarregamento.value = true
  } finally {
    loading.value = false
  }
}

// Botão "Ver detalhes" da linha que abriu o diálogo, mesmo quando o clique foi
// na linha: é o elemento focável dela. O diálogo não tem activator, e sem isso
// o foco cairia no <body> ao fechar. Não é `elementoDeOrigem`, porque o
// currentTarget do clique na linha é o <tr>.
let origemFoco = null

const openOccurrence = (linha, evento) => {
  origemFoco = evento?.currentTarget?.closest('tr')?.querySelector('.acao') ?? null
  selectedOccurrence.value = linha
  dialogOpen.value = true
}

// utils/foco.js: devolve se o foco ficou no diálogo ou caiu no <body>, e o
// mantém se alguém o levou para outro lugar. A tela tem um diálogo só, então o
// resultado 'aguardando' não ocorre e a origem é sempre descartada.
function aoFecharDialogo() {
  devolverFoco(origemFoco)
  origemFoco = null
}

onMounted(() => {
  loadingOccurrences()
})
</script>

<style scoped>
.ocorrencias-container {
  max-width: 1440px;
  padding: var(--space-8);
}

/* Botão secundário (REDESIGN §4.6), igual ao de Postos. */
.v-btn.btn-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ── container da tabela ─────────────────────────────────────────────────── */

.tabela-ocorrencias {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tabela-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.tabela-busca {
  flex: 1 1 240px;
  max-width: 360px;
}

.tabela-ordem {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── tabela ──────────────────────────────────────────────────────────────── */

.tabela {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.tabela th {
  height: 40px;
  padding: 0 var(--space-4);
  background: var(--color-neutral-50);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.tabela td {
  height: 52px;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  vertical-align: middle;
}

.tabela tbody tr:last-child td {
  border-bottom: none;
}

.tabela tbody tr:not(.linha-esqueleto):hover td {
  background: var(--color-neutral-50);
}

.linha-clicavel {
  cursor: pointer;
}

.tabela th.col-data { width: 168px; }
.tabela th.col-tipo { width: 26%; }
.tabela th.col-veiculo { width: 120px; }
.tabela th.col-colaborador { width: 18%; }
.tabela th.col-acoes { width: 64px; }

.col-acoes {
  text-align: right !important;
  white-space: nowrap;
}

.col-data > .tabular {
  display: block;
}

.data-ocorrida {
  display: block;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.ocorrencia-tipo,
.descricao-compacta,
.truncado {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocorrencia-tipo {
  font-weight: 600;
  color: var(--color-neutral-900);
}

.descricao-compacta {
  display: none;
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.tabela td.col-descricao {
  color: var(--color-text-muted);
}

.rotulo-movel {
  display: none;
}

.tabular {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Botão de ícone de 32px (size small + density compact). */
.acao {
  color: var(--color-text-muted);
}

.acao:hover,
.linha-clicavel:hover .acao {
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
  width: 70%;
}

.esqueleto--meta {
  width: 60%;
}

.esqueleto--curto {
  width: 112px;
}

.esqueleto--chip {
  width: 72px;
  height: 22px;
}

/* ── estados e rodapé ────────────────────────────────────────────────────── */

.tabela-erro {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.tabela-erro p {
  margin: 0;
}

.tabela-erro__icone {
  color: var(--color-error-icon);
  margin-bottom: var(--space-3);
}

.tabela-erro__titulo {
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-text);
}

.tabela-erro__texto {
  margin-top: var(--space-1) !important;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

.tabela-rodape {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.tabela-rodape :deep(.pagination-bar) {
  padding: 0;
}

/* ── diálogo de detalhe (padrão do GasStationModal) ──────────────────────── */
/* Raio de 16px e sombra de overlay vêm da regra global de diálogo em main.css.
   Forma e cor do "Fechar" vêm de .btn-dialog* e .dialog-actions. */

.dialogo-cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4) var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  white-space: normal;
}

.dialogo-titulo {
  min-width: 0;
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
  overflow-wrap: anywhere;
}

.dialogo-fechar {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.dialogo-corpo {
  padding: var(--space-6) !important;
}

/* Ficha: rótulo em caption neutral-600, sentence case; valor em body. */
.ficha {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4) var(--space-6);
  margin: 0;
}

.ficha dt,
.descricao__rotulo {
  margin: 0 0 2px;
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 600;
  color: var(--color-text-muted);
}

.ficha dd {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.ficha dd.horario-nao-informado {
  color: var(--color-neutral-500);
}

/* Descrição em bloco neutro, com as quebras de linha originais. */
.descricao {
  margin-top: var(--space-5);
  padding: var(--space-3) var(--space-4);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.descricao p {
  margin: 0;
}

.descricao__texto {
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.descricao__texto.horario-nao-informado {
  color: var(--color-neutral-500);
}

/* ── responsividade ──────────────────────────────────────────────────────── */

/* Com o menu aberto, 1024px deixa ~700px de conteúdo: a coluna Descrição sai e
   a descrição vira a segunda linha da célula Tipo, como o Endereço em Postos. */
@media (max-width: 1279px) {
  .col-descricao {
    display: none;
  }

  .tabela th,
  .tabela td {
    padding-inline: var(--space-3);
  }

  .tabela th.col-tipo { width: auto; }
  .tabela th.col-data { width: 156px; }
  .tabela th.col-veiculo { width: 104px; }
  .tabela th.col-colaborador { width: 18%; }
  .tabela th.col-acoes { width: 56px; }

  .descricao-compacta {
    display: block;
  }
}

@media (max-width: 959px) {
  .ocorrencias-container {
    padding: var(--space-4);
  }
}

/* Celular: cada linha vira um bloco empilhado, sem rolagem horizontal. */
@media (max-width: 599px) {
  .tabela-busca {
    max-width: none;
    flex-basis: 100%;
  }

  .tabela,
  .tabela tbody {
    display: block;
  }

  .tabela thead {
    display: none;
  }

  .tabela tr {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'tipo tipo acoes'
      'placa colaborador acoes'
      'data data acoes';
    align-items: center;
    column-gap: var(--space-3);
    row-gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .tabela tbody tr:last-child {
    border-bottom: none;
  }

  .tabela td {
    height: auto;
    padding: 0;
    border-bottom: none;
    background: none !important;
  }

  .tabela .col-tipo { grid-area: tipo; }
  .tabela .col-veiculo { grid-area: placa; }
  .tabela .col-colaborador { grid-area: colaborador; min-width: 0; }
  .tabela .col-acoes { grid-area: acoes; }

  .tabela .col-data {
    grid-area: data;
    font-size: var(--text-body-sm-size);
    line-height: var(--text-body-sm-line);
    color: var(--color-text-muted);
  }

  /* "Registrada em …" numa linha e, se houver, "Ocorrida em …" na de baixo,
     como no desktop. */
  .tabela .col-data .rotulo-movel,
  .tabela .col-data > .tabular {
    display: inline;
  }

  .tabela tbody tr.linha-esqueleto .col-acoes {
    display: none;
  }
}
</style>
