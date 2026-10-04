/**
 * Leitura e exibição de dados de posto compartilhadas entre telas.
 *
 * Funções puras. Existem porque os postos importados de planilha trazem
 * fantasyName nulo em parte dos casos e businessHours nulo na maioria, e
 * postos cadastrados pelo formulário antigo podem ter espaços extras no
 * horário ("07:00  -  21:00").
 */

/** Texto exibido quando o horário é nulo ou está fora do formato. */
export const HORARIO_NAO_INFORMADO = 'Horário não informado'

const HORARIO_PATTERN = /^\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*$/
const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Nome que identifica o posto na interface: o nome fantasia e, na falta dele,
 * a razão social. Os postos importados têm name = razão social
 * ("POSTO Z21 LTDA"), que ninguém reconhece na rua.
 */
export function nomeExibicaoPosto(posto) {
  const fantasia = posto?.fantasyName?.trim()
  return fantasia || posto?.name || ''
}

/**
 * Lê "HH:mm - HH:mm", tolerando espaços em volta do hífen e nas pontas.
 *
 * Devolve { abertura, fechamento }, ou null para valor nulo, vazio ou fora do
 * formato. Nunca lança: o horário ambíguo da planilha é desfecho esperado,
 * não erro.
 */
export function lerHorarioFuncionamento(businessHours) {
  if (typeof businessHours !== 'string') return null

  const partes = HORARIO_PATTERN.exec(businessHours)
  if (!partes) return null

  const [, abertura, fechamento] = partes
  if (!HORA_VALIDA.test(abertura) || !HORA_VALIDA.test(fechamento)) return null

  return { abertura, fechamento }
}

/** Horário normalizado para exibição ("07:00 - 21:00"), ou null se inválido. */
export function formatarHorarioFuncionamento(businessHours) {
  const horario = lerHorarioFuncionamento(businessHours)
  return horario ? `${horario.abertura} - ${horario.fechamento}` : null
}
