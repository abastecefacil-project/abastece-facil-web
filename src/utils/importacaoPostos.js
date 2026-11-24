/**
 * Cálculos e textos da importação de postos por planilha.
 *
 * Funções puras, compartilhadas entre a prévia, a confirmação, o progresso e o
 * relatório do ImportacaoPostosDialog.
 */

/**
 * Segundos por posto enviado à geocodificação. Medido na carga real: 1.128
 * postos em ~32 min. É mais que o 1,1 s do limite de uso do Nominatim porque
 * parte dos endereços precisa de uma segunda consulta.
 */
const SEGUNDOS_POR_GEOCODIFICACAO = 1.6

/** A partir desta proporção de ativos desativados, o alerta vira erro. */
const PROPORCAO_DESATIVACAO_ALTA = 50

const formatoNumero = new Intl.NumberFormat('pt-BR')
const formatoPercentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export function formatarNumero(valor) {
  return formatoNumero.format(valor ?? 0)
}

/**
 * linha = 0 é a convenção do backend para "sem linha na planilha" — caso dos
 * postos a desativar, que existem só no banco.
 */
export function rotuloLinha(linha) {
  return linha > 0 ? `Linha ${linha}` : '—'
}

/**
 * Quantos itens da prévia vão ao serviço de geocodificação: todo posto novo,
 * mais os atualizados e reativados cujo endereço mudou.
 */
export function contarGeocodificacoes(previa) {
  const comGeocodificacao = (itens) => (itens ?? []).filter((item) => item.requerGeocodificacao).length
  return (
    (previa?.inserir?.length ?? 0) +
    comGeocodificacao(previa?.atualizar) +
    comGeocodificacao(previa?.reativar)
  )
}

/**
 * Duração aproximada em minutos, arredondada para cima: "menos de 1 minuto",
 * "cerca de 1 minuto", "cerca de 22 minutos". O corte em 30 s existe porque,
 * arredondando sempre para cima, "menos de 1 minuto" nunca apareceria.
 */
export function descreverDuracaoAproximada(segundos) {
  if (segundos < 30) return 'menos de 1 minuto'
  const minutos = Math.ceil(segundos / 60)
  return minutos === 1 ? 'cerca de 1 minuto' : `cerca de ${formatarNumero(minutos)} minutos`
}

/** "Tempo estimado: cerca de 22 minutos (1.200 postos serão localizados no mapa)". */
export function descreverTempoEstimado(itensGeocodificacao) {
  const duracao = descreverDuracaoAproximada(itensGeocodificacao * SEGUNDOS_POR_GEOCODIFICACAO)
  let detalhe
  if (itensGeocodificacao === 0) detalhe = 'nenhum posto precisa ser localizado no mapa'
  else if (itensGeocodificacao === 1) detalhe = '1 posto será localizado no mapa'
  else detalhe = `${formatarNumero(itensGeocodificacao)} postos serão localizados no mapa`
  return `Tempo estimado: ${duracao} (${detalhe})`
}

/**
 * Frase sobre os postos que deixarão o mapa, e se a proporção é alta o bastante
 * para sugerir planilha incompleta em vez de descredenciamento em massa.
 * Devolve null quando não há desativação.
 */
export function descreverDesativacao(desativar, ativos) {
  if (!desativar) return null

  const proporcao = ativos > 0 ? (desativar / ativos) * 100 : 100
  const [desativados, deixarao] = desativar === 1
    ? ['será desativado', 'deixará']
    : ['serão desativados', 'deixarão']

  return {
    texto:
      `${formatarNumero(desativar)} de ${formatarNumero(ativos)} postos ativos ${desativados} ` +
      `(${formatoPercentual.format(proporcao)}%) e ${deixarao} de aparecer no mapa.`,
    alta: proporcao >= PROPORCAO_DESATIVACAO_ALTA,
  }
}

/**
 * Quantos postos a prévia desativa. A API exige que o administrador confirme
 * exatamente essa quantidade ao iniciar a importação.
 */
function quantidadeDesativacoes(previa) {
  return previa?.desativar?.length ?? 0
}

/** A prévia só pede a caixa de confirmação quando há postos a desativar. */
export function exigeConfirmacaoDesativacao(previa) {
  return quantidadeDesativacoes(previa) > 0
}

/** "Conferi a lista e confirmo a desativação de 3 postos." (singular para 1). */
export function textoConfirmacaoDesativacao(previa) {
  const quantidade = quantidadeDesativacoes(previa)
  const postos = quantidade === 1 ? 'posto' : 'postos'
  return `Conferi a lista e confirmo a desativação de ${formatarNumero(quantidade)} ${postos}.`
}

/**
 * O botão "Confirmar importação" exige uma prévia e, quando ela desativa
 * postos, a caixa de confirmação marcada.
 */
export function podeConfirmarImportacao(previa, desativacaoConfirmada) {
  if (!previa) return false
  return !exigeConfirmacaoDesativacao(previa) || desativacaoConfirmada === true
}

/**
 * Valor de `desativacoesConfirmadas` no envio. null quando não há desativação
 * (o parâmetro é omitido, como antes) e também quando a caixa não foi marcada:
 * nunca se declara à API uma confirmação que o administrador não deu.
 */
export function desativacoesConfirmadasParaEnvio(previa, desativacaoConfirmada) {
  const quantidade = quantidadeDesativacoes(previa)
  if (quantidade === 0 || desativacaoConfirmada !== true) return null
  return quantidade
}

/**
 * Classifica a falha do POST /import pelo código do corpo (`error`), não pelo
 * status: há dois 409 com sentidos diferentes.
 * - 'plano-divergente': PLANO_IMPORTACAO_DIVERGENTE (409), a prévia ficou velha;
 * - 'desativacao-nao-confirmada': DESATIVACAO_NAO_CONFIRMADA (422);
 * - 'em-andamento': qualquer outro 409, que é o IMPORTACAO_EM_ANDAMENTO. Um 409
 *   sem corpo também cai aqui, como antes desta distinção;
 * - 'outro': o resto.
 */
export function classificarErroInicioImportacao(err) {
  const codigo = err?.response?.data?.error
  if (codigo === 'PLANO_IMPORTACAO_DIVERGENTE') return 'plano-divergente'
  if (codigo === 'DESATIVACAO_NAO_CONFIRMADA') return 'desativacao-nao-confirmada'
  if (err?.response?.status === 409) return 'em-andamento'
  return 'outro'
}

/**
 * Segundos restantes, estimados só com o relógio do navegador.
 *
 * `amostras` são { processados, instante } registradas a cada resposta do
 * polling, com instante = Date.now(). O ritmo sai da primeira e da última
 * amostra da sessão de acompanhamento, o que suaviza oscilações entre duas
 * consultas. Devolve null sem amostras suficientes ou sem avanço.
 *
 * Nunca usa iniciadaEm: ele é LocalDateTime no fuso do servidor, e em produção
 * a JVM roda em UTC — comparar com o relógio do navegador erraria por horas.
 */
export function estimarSegundosRestantes(amostras, total) {
  if (!amostras || amostras.length < 2) return null

  const primeira = amostras[0]
  const ultima = amostras[amostras.length - 1]
  const avanco = ultima.processados - primeira.processados
  const intervaloMs = ultima.instante - primeira.instante
  if (avanco <= 0 || intervaloMs <= 0) return null

  const porMs = avanco / intervaloMs
  return Math.max(0, total - ultima.processados) / porMs / 1000
}

/** Texto do tempo restante para a etapa de progresso. */
export function descreverTempoRestante(amostras, total, processados) {
  if (total > 0 && processados >= total) return 'Finalizando…'
  const segundos = estimarSegundosRestantes(amostras, total)
  if (segundos === null) return 'Calculando tempo restante…'
  return `Tempo restante estimado: ${descreverDuracaoAproximada(segundos)}`
}
