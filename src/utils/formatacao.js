/**
 * Formatação de dados para exibição (docs/redesign/REDESIGN.md §4.7).
 *
 * Funções puras, sem import de Vue, testadas com `node --test`. Só apresentação:
 * nunca alteram o que é enviado ao backend nem o que a busca compara. Valor
 * ausente devolve null (ou '' nas datas), e quem exibe decide o texto de
 * fallback, como já acontece com o horário em `utils/posto.js`.
 */

import { formatarTelefone } from './mascaras.js'
import { lerHorarioFuncionamento } from './posto.js'

// ── Telefone ────────────────────────────────────────────────────────────────

/** Texto exibido quando o posto não tem telefone. */
export const TELEFONE_NAO_INFORMADO = 'Telefone não informado'

/**
 * Telefone nacional legível: 11 dígitos viram "(47) 99256-4972" e 10 viram
 * "(48) 3258-8723", com ou sem máscara na entrada. Qualquer outro formato
 * (com DDI, 0800, ramal, número curto) é exibido como veio, porque adivinhar a
 * máscara erraria mais do que acertaria. Vazio devolve null.
 */
export function telefoneExibicao(telefone) {
  if (telefone === null || telefone === undefined) return null
  const texto = String(telefone).trim()
  if (!texto) return null

  const digitos = texto.replace(/\D/g, '')
  // Nenhum DDD começa com 0: "0800 602 0088" tem 11 dígitos e não é celular.
  const nacional = (digitos.length === 10 || digitos.length === 11) && !digitos.startsWith('0')
  return nacional ? formatarTelefone(digitos) : texto
}

/**
 * Link `tel:` para um telefone exibido com máscara: só os dígitos, que é o que
 * o discador espera ("0800 602 0088" vira "tel:08006020088"). Sem dígitos
 * devolve null, e quem exibe mostra o número sem link.
 */
export function hrefTelefone(telefone) {
  const digitos = String(telefone ?? '').replace(/\D/g, '')
  return digitos ? `tel:${digitos}` : null
}

// ── Horário ─────────────────────────────────────────────────────────────────

/**
 * Horário de funcionamento para exibição. "00:00 - 23:59" é o jeito como o
 * cadastro grava o posto que não fecha, e vira "24 horas". Nulo, vazio ou fora
 * do formato devolve null, e a tela mostra `HORARIO_NAO_INFORMADO`.
 */
export function horarioExibicao(businessHours) {
  const horario = lerHorarioFuncionamento(businessHours)
  if (!horario) return null
  if (horario.abertura === '00:00' && horario.fechamento === '23:59') return '24 horas'
  return `${horario.abertura} - ${horario.fechamento}`
}

// ── Nome próprio ────────────────────────────────────────────────────────────

// Sempre em maiúsculas, em qualquer posição. SC fica aqui, e não só entre as
// UFs, porque a §4.7 a lista explicitamente e porque aparece no meio de nome
// de rodovia ("SC 401"), onde a regra posicional das UFs a deixaria "Sc".
const SIGLAS = new Set(['BR', 'SC', 'LTDA', 'ME', 'EPP', 'S/A', 'SA', 'KM', 'II', 'III', 'S/N'])

// UF só fica em maiúsculas quando é o último token do texto ou vem logo depois
// de "-" ou "/" ("MAFRA - SC", "JOINVILLE/SC"). No meio de um nome ela é
// palavra comum: "POSTO SE LIGA" vira "Posto Se Liga".
const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])

const PREPOSICOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

const LOCALE = 'pt-BR'

// Pontuação que pode colar na palavra sem fazer parte dela: "153," "(CENTRO)".
const BORDA = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u

function capitalizar(palavra) {
  const minuscula = palavra.toLocaleLowerCase(LOCALE)
  return minuscula.charAt(0).toLocaleUpperCase(LOCALE) + minuscula.slice(1)
}

/**
 * Texto todo em caixa alta (como vêm nome, endereço e cidade dos postos
 * importados) vira Title Case: siglas preservadas, preposições em minúsculas
 * exceto na abertura, tokens com dígito intactos ("BR-101", "1500A"). Texto que
 * já tem alguma minúscula foi escrito por alguém e é devolvido como veio.
 */
export function nomeProprio(texto) {
  if (typeof texto !== 'string') return texto ?? ''
  if (!/\p{Lu}/u.test(texto) || /\p{Ll}/u.test(texto)) return texto

  // Separa espaços, hífens e barras, mantendo-os, para remontar o texto igual.
  const pedacos = texto.split(/(\s+|[-/])/)
  const nucleo = (i) => BORDA.exec(pedacos[i] ?? '')[2].toLocaleUpperCase(LOCALE)
  const ehPalavra = (i) => /[\p{L}\p{N}]/u.test(pedacos[i] ?? '')
  const ultimaPalavra = pedacos.findLastIndex((_, i) => ehPalavra(i))

  // "-" ou "/" imediatamente antes, pulando espaços.
  const depoisDeSeparador = (i) => {
    let j = i - 1
    while (j >= 0 && /^\s*$/.test(pedacos[j])) j--
    return pedacos[j] === '-' || pedacos[j] === '/'
  }

  // S/N e S/A chegam partidos pela barra: "S", "/", "N".
  const parteDeSiglaComBarra = (i) =>
    (pedacos[i + 1] === '/' && SIGLAS.has(`${nucleo(i)}/${nucleo(i + 2)}`)) ||
    (pedacos[i - 1] === '/' && SIGLAS.has(`${nucleo(i - 2)}/${nucleo(i)}`))

  let abertura = true
  return pedacos
    .map((pedaco, i) => {
      if (!ehPalavra(i)) return pedaco

      const [, antes, miolo, depois] = BORDA.exec(pedaco)
      const maiuscula = miolo.toLocaleUpperCase(LOCALE)
      const minuscula = miolo.toLocaleLowerCase(LOCALE)
      const primeira = abertura
      abertura = false

      let resultado
      if (/\p{N}/u.test(miolo)) resultado = miolo
      else if (SIGLAS.has(maiuscula) || parteDeSiglaComBarra(i)) resultado = maiuscula
      else if (UFS.has(maiuscula) && (i === ultimaPalavra || depoisDeSeparador(i))) resultado = maiuscula
      else if (!primeira && PREPOSICOES.has(minuscula)) resultado = minuscula
      else resultado = capitalizar(miolo)

      return antes + resultado + depois
    })
    .join('')
}

// ── Datas ───────────────────────────────────────────────────────────────────

const dois = (n) => String(n).padStart(2, '0')

/**
 * Data e hora "dd/mm/aaaa HH:mm" no fuso do navegador, para `LocalDateTime` e
 * instantes ISO (o `createdAt` das ocorrências). Entrada inválida devolve ''.
 * Não corrige fuso: é a pendência B8, funcional e fora do redesign.
 */
export function formatarDataHora(valor) {
  if (valor === null || valor === undefined || valor === '') return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()} ${dois(data.getHours())}:${dois(data.getMinutes())}`
}

/**
 * Data "dd/mm/aaaa" de um `LocalDate` ("2026-08-18"), montada pelas partes.
 * `new Date("2026-08-18")` seria meia-noite UTC, e no horário de Brasília a
 * tela mostraria o dia anterior. Fora do formato devolve ''.
 */
export function formatarDataCurta(localDate) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(localDate ?? '')
  if (!partes) return ''
  const [, ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

// ── Rota ────────────────────────────────────────────────────────────────────

/** Distância da rota em quilômetros, uma casa e vírgula decimal: "176,6 km". */
export function formatarDistancia(metros) {
  if (!Number.isFinite(metros)) return ''
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`
}

/** Duração da rota: "45 min" abaixo de uma hora, "2h 23min" a partir dela. */
export function formatarDuracao(segundos) {
  if (!Number.isFinite(segundos)) return ''
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)}h ${minutos % 60}min`
}
