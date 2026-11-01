/**
 * Apresentação do mapa de postos (docs/redesign/REDESIGN.md §5.12).
 *
 * Funções puras, sem Leaflet e sem Vue, testadas com `node --test`. O Map.vue
 * as entrega ao `L.divIcon`, e o PopupStation lê `apresentacaoPopupPosto`.
 *
 * Nenhum ícone depende de rede: o pino e o ponto do usuário são SVG e HTML
 * inline. As cores vêm só de classes, estilizadas no Map.vue com os tokens de
 * main.css; aqui não há hex nem URL.
 */

import { hrefTelefone, horarioExibicao, nomeProprio, telefoneExibicao, TELEFONE_NAO_INFORMADO } from './formatacao.js'
import { nomeCidadeExibicao } from './municipios.js'
import { HORARIO_NAO_INFORMADO } from './posto.js'

// ── Clusters ────────────────────────────────────────────────────────────────

// Escala azul por tamanho do grupo (blue-500, blue-700, blue-900), com texto
// branco nos três: 5,7:1, 9,3:1 e 15:1. A cor diz quantidade, não status.
const NIVEIS_CLUSTER = [
  { ate: 9, nivel: 'pequeno', tamanho: 34 },
  { ate: 99, nivel: 'medio', tamanho: 40 },
  { ate: Infinity, nivel: 'grande', tamanho: 46 },
]

/** Nível e diâmetro (px) do cluster: até 9 postos, até 99, e de 100 em diante. */
export function nivelCluster(quantidade) {
  const n = Number(quantidade) || 0
  const { nivel, tamanho } = NIVEIS_CLUSTER.find(({ ate }) => n <= ate)
  return { nivel, tamanho }
}

/** HTML de dentro do divIcon do cluster: só o número. */
export function htmlCluster(quantidade) {
  return `<span class="cluster-posto__numero">${Number(quantidade) || 0}</span>`
}

// ── Marcadores ──────────────────────────────────────────────────────────────

/** Tamanho e âncoras do pino do posto, em px: a ponta do pino é a coordenada. */
export const PINO_POSTO = Object.freeze({
  tamanho: [32, 42],
  ancora: [16, 41],
  ancoraPopup: [0, -38],
})

// Bomba de combustível do Material Design Icons (mdi-gas-station, a mesma
// família de ícones do resto do sistema), em viewBox 24.
const PATH_COMBUSTIVEL = 'M18,10A1,1 0 0,1 17,9A1,1 0 0,1 18,8A1,1 0 0,1 19,9A1,1 0 0,1 18,10M12,10H6V5H12M19.77,7.23L19.78,7.22L16.06,3.5L15,4.56L17.11,6.67C16.17,7.03 15.5,7.93 15.5,9A2.5,2.5 0 0,0 18,11.5C18.36,11.5 18.69,11.42 19,11.29V18.5A1,1 0 0,1 18,19.5A1,1 0 0,1 17,18.5V14A2,2 0 0,0 15,12H14V5A2,2 0 0,0 12,3H6A2,2 0 0,0 4,5V21H14V13.5H15.5V18.5A2.5,2.5 0 0,0 18,21A2.5,2.5 0 0,0 20.5,18.5V9C20.5,8.31 20.22,7.68 19.77,7.23Z'

const PATH_PINO = 'M16 1C7.7 1 1 7.6 1 15.8c0 10.6 13.3 24.2 13.9 24.8a1.5 1.5 0 0 0 2.2 0C17.7 40 31 26.4 31 15.8 31 7.6 24.3 1 16 1z'

/**
 * Pino do posto. O wrapper interno é quem cresce no estado selecionado: a raiz
 * do divIcon é posicionada pelo Leaflet com `transform`, e escalá-la quebraria
 * a posição do marcador.
 */
export function htmlMarcadorPosto() {
  return '<span class="marcador-posto__pino">'
    + '<svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true" focusable="false">'
    + `<path class="marcador-posto__corpo" d="${PATH_PINO}"/>`
    + `<path class="marcador-posto__icone" transform="translate(6.4 6.2) scale(0.8)" d="${PATH_COMBUSTIVEL}"/>`
    + '</svg></span>'
}

/** Tamanho do marcador do usuário (px), halo incluído; a âncora é o centro. */
export const TAMANHO_MARCADOR_USUARIO = 32

/** Ponto do usuário com halo translúcido, estático (sem animação decorativa). */
export function htmlMarcadorUsuario() {
  return '<span class="marcador-usuario__halo"></span><span class="marcador-usuario__ponto"></span>'
}

// ── Popup ───────────────────────────────────────────────────────────────────

/**
 * Textos do popup do posto, já formatados (§4.7). Telefone e horário ausentes
 * trazem o texto de fallback e `informado: false`, para a tela aplicar o
 * estilo de dado vazio. `telefone.href` é o link `tel:`, ou null sem dígitos.
 */
export function apresentacaoPopupPosto(station = {}) {
  const telefone = telefoneExibicao(station.phone)
  const horario = horarioExibicao(station.businessHours)
  const uf = typeof station.state === 'string' ? station.state.trim().toUpperCase() : ''
  const cidade = nomeCidadeExibicao(station.city, uf)

  return {
    nome: nomeProprio(station.name ?? ''),
    endereco: nomeProprio(station.address ?? ''),
    cidade: [cidade, uf].filter(Boolean).join(' - '),
    telefone: telefone
      ? { texto: telefone, href: hrefTelefone(telefone), informado: true }
      : { texto: TELEFONE_NAO_INFORMADO, href: null, informado: false },
    horario: horario
      ? { texto: horario, informado: true }
      : { texto: HORARIO_NAO_INFORMADO, informado: false },
  }
}
