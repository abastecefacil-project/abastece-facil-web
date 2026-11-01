/**
 * Linha de ocorrência pronta para exibição, usada pela tabela e pelo diálogo de
 * detalhe de Ocorrências do admin (REDESIGN §4.7 e §5.6).
 *
 * Mesmo modelo de `postoExibicao.js`: função pura, imports relativos para ser
 * testável com `node --test`. Só apresentação: a ocorrência de entrada não
 * muda, e a busca continua sendo feita pelo backend sobre o título.
 */

import { formatarDataCurta, formatarDataHora } from './formatacao.js'

// Dia local "aaaa-mm-dd" de um createdAt, no mesmo fuso em que
// formatarDataHora o exibe. Inválido devolve null.
function diaLocal(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  const dois = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
}

/**
 * Recebe a ocorrência como a API devolve (`createdAt`, `occurrenceDate`,
 * `title`, `carPlate`, `userName`, `description`).
 *
 * - `registradaEm`: createdAt em "dd/mm/aaaa HH:mm". É a data da coluna, e a
 *   ordem da tabela (created_at DESC, fixa no backend).
 * - `ocorridaEm`: occurrenceDate em "dd/mm/aaaa" **só quando cai em outro dia**
 *   que o registro; no mesmo dia (ou sem uma das duas datas) é null e a tela
 *   não mostra a segunda linha. O LocalDate é lido pelas partes, sem fuso.
 * - `dataOcorrencia`: occurrenceDate sempre formatada, para o detalhe.
 * - `descricaoLinha`: a descrição em uma linha só, para a célula truncada e o
 *   tooltip. O detalhe mostra `descricao` com as quebras originais.
 * - `colaborador`: null quando vazio, e a tela mostra "Não informado".
 */
export function apresentacaoLinhaOcorrencia(ocorrencia) {
  const occurrenceDate = ocorrencia.occurrenceDate ?? ''
  const dataOcorrencia = formatarDataCurta(occurrenceDate)
  const diaRegistro = diaLocal(ocorrencia.createdAt)
  const diaOcorrencia = dataOcorrencia ? occurrenceDate.slice(0, 10) : null
  const descricao = (ocorrencia.description ?? '').trim()
  const colaborador = (ocorrencia.userName ?? '').trim()

  return {
    tipo: ocorrencia.title ?? '',
    placa: ocorrencia.carPlate ?? '',
    colaborador: colaborador || null,
    registradaEm: formatarDataHora(ocorrencia.createdAt),
    dataOcorrencia,
    ocorridaEm:
      diaRegistro && diaOcorrencia && diaRegistro !== diaOcorrencia ? dataOcorrencia : null,
    descricao,
    descricaoLinha: descricao.replace(/\s+/g, ' '),
  }
}
