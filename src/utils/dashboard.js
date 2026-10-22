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

function textoInativos(inativos) {
  return inativos === 0 ? 'Nenhum inativo' : plural(inativos, 'inativo', 'inativos')
}

/** "12 inativos · 34 cidades". */
export function contextoPostos({ inativos, cidadesAtendidas }) {
  return `${textoInativos(inativos)} · ${plural(cidadesAtendidas, 'cidade', 'cidades')}`
}

/** "3 inativos". */
export function contextoVeiculos({ inativos }) {
  return textoInativos(inativos)
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

// Arrays fixos, e não Intl: `month: 'short'` devolve "mai." com ponto, e o texto
// varia com a versão do ICU.
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_COMPLETOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** Barra com valor acima de zero nunca fica menor que isto, em %. */
export const PROPORCAO_MINIMA = 4

/** O mesmo mínimo, com o nome que o gráfico de colunas usa. */
export const ALTURA_MINIMA_BARRA = PROPORCAO_MINIMA

function partesMes(mes) {
  const partes = /^(\d{4})-(\d{2})$/.exec(mes ?? '')
  if (!partes) return null
  const indice = Number(partes[2]) - 1
  return indice >= 0 && indice < 12 ? { ano: partes[1], indice } : null
}

/** `ocorrenciasPorMes[].mes` ("2026-05") → "mai/26". */
export function formatarMesCurto(mes) {
  const partes = partesMes(mes)
  return partes ? `${MESES_CURTOS[partes.indice]}/${partes.ano.slice(2)}` : ''
}

/** aria-label da barra: "maio de 2026: 1 ocorrência". */
export function rotuloBarraMes({ mes, total }) {
  const partes = partesMes(mes)
  const periodo = partes ? `${MESES_COMPLETOS[partes.indice]} de ${partes.ano}` : mes
  return `${periodo}: ${plural(total, 'ocorrência', 'ocorrências')}`
}

/**
 * Tamanho de cada barra, em % do maior valor. Zero fica 0 (a linha de base é
 * CSS); acima de zero, nunca menos que `PROPORCAO_MINIMA`, para um valor
 * pequeno ao lado de um pico não parecer zero. Serve às colunas do gráfico e
 * às barras horizontais dos rankings.
 */
export function proporcoesRelativas(totais) {
  const maximo = Math.max(0, ...totais)
  if (maximo === 0) return totais.map(() => 0)
  return totais.map((total) =>
    total > 0 ? Math.max(PROPORCAO_MINIMA, Math.round((total / maximo) * 100)) : 0,
  )
}

/** Altura das colunas do gráfico de ocorrências por mês. */
export function alturasBarras(totais) {
  return proporcoesRelativas(totais)
}

// Janelas definidas no backend (DashboardConstants): a resposta não as traz, e o
// texto da tela precisa delas. Mudou lá, muda aqui.
export const DIAS_RANKING_VEICULOS = 90
export const DIAS_CONVITE_ANTIGO = 7

// As três transformações abaixo devolvem null para entrada nula: é o que a
// lista usa para escolher entre skeleton e "—".

/** `veiculosComMaisOcorrencias` → itens da `ListaComBarras`. */
export function itensVeiculosComOcorrencias(lista) {
  return lista ? lista.map(({ placa, total }) => ({ rotulo: placa, total })) : null
}

/** `cidadesComMaisPostos` → itens da `ListaComBarras`, com a UF como detalhe. */
export function itensCidadesComPostos(lista) {
  return lista ? lista.map(({ cidade, uf, total }) => ({ rotulo: cidade, detalhe: uf, total })) : null
}

/**
 * `usuariosPorPerfil` → itens da `ListaComBarras`, na ordem da API. Perfil que
 * `rotuloPerfil` não conhece fica com o nome do enum, para não virar linha sem
 * rótulo.
 */
export function itensUsuariosPorPerfil(lista) {
  return lista ? lista.map(({ perfil, total }) => ({ rotulo: rotuloPerfil(perfil) ?? perfil, total })) : null
}

/** "2 usuários aguardam ativação há mais de 7 dias"; vazio quando não há. */
export function textoConvitesAntigos(quantidade) {
  if (!(quantidade > 0)) return ''
  return quantidade === 1
    ? `1 usuário aguarda ativação há mais de ${DIAS_CONVITE_ANTIGO} dias`
    : `${formatarNumero(quantidade)} usuários aguardam ativação há mais de ${DIAS_CONVITE_ANTIGO} dias`
}

export function totalOcorrenciasPeriodo(itens) {
  return (itens ?? []).reduce((soma, item) => soma + item.total, 0)
}

/** "7 nos últimos 6 meses"; vazio quando não há o que somar. */
export function subtituloOcorrenciasPorMes(itens) {
  const total = totalOcorrenciasPeriodo(itens)
  return total > 0 ? `${formatarNumero(total)} nos últimos ${itens.length} meses` : ''
}

/** "Gestor de Frota · Atualizado às 14:32", omitindo a parte que faltar. */
export function subtituloPainel(perfil, carregadoEm) {
  const partes = [rotuloPerfil(perfil)]
  if (carregadoEm instanceof Date && !Number.isNaN(carregadoEm.getTime())) {
    partes.push(`Atualizado às ${formatoHorario.format(carregadoEm)}`)
  }
  return partes.filter(Boolean).join(' · ')
}
