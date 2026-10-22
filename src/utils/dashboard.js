/**
 * Textos da Home de gestão (`AdminDashboard.vue`), a partir do `GET /api/dashboard`.
 *
 * Funções puras, sem import de Vue, para serem testadas com `node --test`.
 */
import { formatarNumero } from './importacaoPostos.js'
import { rotuloPerfil } from './perfil.js'

/** Card sem número: a consulta falhou e não há valor anterior para mostrar. */
export const SEM_VALOR = '—'

const formatoHorario = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

/**
 * `formatarNumero(null)` devolve "0", e um KPI nunca pode mostrar 0 por falta
 * de dado. Por isso o nulo é tratado aqui, antes de delegar.
 */
export function formatarValorKpi(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) ? formatarNumero(valor) : SEM_VALOR
}

function plural(quantidade, singular, pluralTexto) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`
}

/**
 * Variação das ocorrências do mês atual contra o anterior. A seta fica com o
 * componente, que a escolhe pela `direcao`.
 *
 * Com o mês anterior zerado não há base para percentual: vai só a diferença
 * absoluta.
 */
export function variacaoMensal(atual, anterior) {
  const diferenca = atual - anterior

  if (diferenca === 0) {
    return { direcao: 'estavel', texto: 'Igual ao mês anterior' }
  }

  const direcao = diferenca > 0 ? 'alta' : 'queda'

  if (anterior === 0) {
    return { direcao, texto: `+${formatarNumero(diferenca)} vs. mês anterior` }
  }

  const percentual = Math.round((Math.abs(diferenca) / anterior) * 100)
  return { direcao, texto: `${formatarNumero(percentual)}% vs. mês anterior` }
}

/** "12 inativos · 34 cidades". */
export function contextoPostos({ inativos, cidadesAtendidas }) {
  return `${plural(inativos, 'inativo', 'inativos')} · ${plural(cidadesAtendidas, 'cidade', 'cidades')}`
}

/** "3 inativos". */
export function contextoVeiculos({ inativos }) {
  return plural(inativos, 'inativo', 'inativos')
}

/** "2 aguardando ativação". */
export function contextoUsuarios({ aguardandoAtivacao }) {
  return aguardandoAtivacao === 0
    ? 'Nenhum aguardando ativação'
    : `${formatarNumero(aguardandoAtivacao)} aguardando ativação`
}

/**
 * `occurrenceDate` é `LocalDate` ("2026-10-01"). `new Date("2026-10-01")` lê a
 * string como meia-noite UTC, que em America/Sao_Paulo ainda é o dia anterior:
 * a data é montada pelas partes, no fuso local.
 */
export function formatarDataOcorrencia(data) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data ?? '')
  if (!partes) return ''

  const [, ano, mes, dia] = partes.map(Number)
  const local = new Date(ano, mes - 1, dia)
  if (local.getMonth() !== mes - 1 || local.getDate() !== dia) return ''

  return local.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "Gestor de Frota · Atualizado às 14:32", omitindo a parte que faltar. */
export function subtituloPainel(perfil, carregadoEm) {
  const partes = [rotuloPerfil(perfil)]
  if (carregadoEm instanceof Date && !Number.isNaN(carregadoEm.getTime())) {
    partes.push(`Atualizado às ${formatoHorario.format(carregadoEm)}`)
  }
  return partes.filter(Boolean).join(' · ')
}
