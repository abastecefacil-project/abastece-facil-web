// Estado da geolocalização do navegador no mapa (StationMap.vue).
//
// O mapa aparece em qualquer estado. O que depende da posição do usuário
// (marcador, "Usar minha localização", rota até o posto, origem do link de
// navegação) só fica disponível em CONCEDIDA.

export const ESTADO_LOCALIZACAO = Object.freeze({
  AGUARDANDO: 'aguardando',
  CONCEDIDA: 'concedida',
  NEGADA: 'negada',
  INDISPONIVEL: 'indisponivel',
  TEMPO_ESGOTADO: 'tempo-esgotado',
  SEM_SUPORTE: 'sem-suporte',
})

// Códigos do GeolocationPositionError.
const ERRO_PERMISSAO_NEGADA = 1
const ERRO_POSICAO_INDISPONIVEL = 2
const ERRO_TEMPO_ESGOTADO = 3

export function estadoInicialLocalizacao(temSuporte) {
  return temSuporte ? ESTADO_LOCALIZACAO.AGUARDANDO : ESTADO_LOCALIZACAO.SEM_SUPORTE
}

export function posicaoValida(posicao) {
  return Number.isFinite(posicao?.lat) && Number.isFinite(posicao?.lon)
}

// Sucesso do watchPosition. Vale também depois de um erro: o watch continua
// ativo, e uma posição que chega tarde tem o mesmo efeito de uma imediata.
export function estadoAposPosicao(estado, posicao) {
  return posicaoValida(posicao) ? ESTADO_LOCALIZACAO.CONCEDIDA : estado
}

// Erro do watchPosition. Com uma posição já obtida, só a permissão retirada
// muda o estado: falha momentânea e timeout de uma atualização mantêm a
// última posição, como antes.
export function estadoAposErro(estado, codigo) {
  if (codigo === ERRO_PERMISSAO_NEGADA) return ESTADO_LOCALIZACAO.NEGADA
  if (estado === ESTADO_LOCALIZACAO.CONCEDIDA) return estado
  if (codigo === ERRO_POSICAO_INDISPONIVEL) return ESTADO_LOCALIZACAO.INDISPONIVEL
  if (codigo === ERRO_TEMPO_ESGOTADO) return ESTADO_LOCALIZACAO.TEMPO_ESGOTADO
  return estado
}

export function localizacaoDisponivel(estado) {
  return estado === ESTADO_LOCALIZACAO.CONCEDIDA
}

const CAUSA_INDISPONIBILIDADE = {
  [ESTADO_LOCALIZACAO.NEGADA]: 'O acesso à sua localização foi negado.',
  [ESTADO_LOCALIZACAO.INDISPONIVEL]: 'Não foi possível obter sua localização.',
  [ESTADO_LOCALIZACAO.TEMPO_ESGOTADO]: 'Não foi possível obter sua localização.',
  [ESTADO_LOCALIZACAO.SEM_SUPORTE]: 'Este navegador não informa a localização.',
}

// Texto do aviso no mapa; null quando não há o que avisar.
export function avisoLocalizacao(estado) {
  const causa = CAUSA_INDISPONIBILIDADE[estado]
  if (!causa) return null
  return `${causa} A rota a partir de você fica indisponível; use o trajeto por endereço.`
}

// Dica do botão "Usar minha localização" quando desabilitado.
export function motivoLocalizacaoIndisponivel(estado) {
  if (localizacaoDisponivel(estado)) return ''
  if (estado === ESTADO_LOCALIZACAO.AGUARDANDO) return 'Obtendo sua localização…'
  return CAUSA_INDISPONIBILIDADE[estado] ?? ''
}

// Origem do link de navegação do Google Maps: "lat,lon", ou null para o
// link sair sem origem (o Google Maps usa a posição do próprio aparelho).
export function origemNavegacao(posicao) {
  return posicaoValida(posicao) ? `${posicao.lat},${posicao.lon}` : null
}
