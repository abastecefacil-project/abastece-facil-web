import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apresentacaoLinhaOcorrencia } from '../src/utils/ocorrenciaExibicao.js'

// createdAt chega como LocalDateTime, sem fuso: o navegador o lê como hora
// local, e o resultado não depende do TZ de quem roda o teste.
const ocorrencia = {
  id: 7,
  createdAt: '2026-10-28T09:05:41.123456',
  occurrenceDate: '2026-10-28',
  title: 'Combustível abaixo de meio tanque',
  carPlate: 'ABC1D23',
  userName: 'Mariana Prado',
  description: 'Devolvido com\n\n  menos de meio tanque.',
}

test('apresentacaoLinhaOcorrencia: registro em dd/mm/aaaa HH:mm e dados da linha', () => {
  assert.deepEqual(apresentacaoLinhaOcorrencia(ocorrencia), {
    tipo: 'Combustível abaixo de meio tanque',
    placa: 'ABC1D23',
    colaborador: 'Mariana Prado',
    registradaEm: '28/10/2026 09:05',
    dataOcorrencia: '28/10/2026',
    ocorridaEm: null,
    descricao: 'Devolvido com\n\n  menos de meio tanque.',
    descricaoLinha: 'Devolvido com menos de meio tanque.',
  })
})

test('apresentacaoLinhaOcorrencia: mesmo dia do registro não mostra "Ocorrida em"', () => {
  // Registrada à noite, no mesmo dia: o LocalDate não é deslocado para o dia
  // anterior nem para o seguinte.
  const linha = apresentacaoLinhaOcorrencia({ ...ocorrencia, createdAt: '2026-10-28T23:59:00' })
  assert.equal(linha.ocorridaEm, null)
  assert.equal(linha.dataOcorrencia, '28/10/2026')

  const madrugada = apresentacaoLinhaOcorrencia({ ...ocorrencia, createdAt: '2026-10-28T00:01:00' })
  assert.equal(madrugada.ocorridaEm, null)
})

test('apresentacaoLinhaOcorrencia: dia diferente do registro mostra "Ocorrida em"', () => {
  const retroativa = apresentacaoLinhaOcorrencia({ ...ocorrencia, occurrenceDate: '2026-10-27' })
  assert.equal(retroativa.ocorridaEm, '27/10/2026')
  assert.equal(retroativa.registradaEm, '28/10/2026 09:05')

  // Um dia de diferença na virada do mês, nas duas direções.
  const viradaMes = apresentacaoLinhaOcorrencia({
    ...ocorrencia,
    createdAt: '2026-11-01T00:30:00',
    occurrenceDate: '2026-10-31',
  })
  assert.equal(viradaMes.ocorridaEm, '31/10/2026')

  const depois = apresentacaoLinhaOcorrencia({ ...ocorrencia, occurrenceDate: '2026-10-29' })
  assert.equal(depois.ocorridaEm, '29/10/2026')
})

test('apresentacaoLinhaOcorrencia: datas ausentes ou inválidas não geram "Ocorrida em"', () => {
  const semOcorrida = apresentacaoLinhaOcorrencia({ ...ocorrencia, occurrenceDate: null })
  assert.equal(semOcorrida.ocorridaEm, null)
  assert.equal(semOcorrida.dataOcorrencia, '')

  const semRegistro = apresentacaoLinhaOcorrencia({ ...ocorrencia, createdAt: null, occurrenceDate: '2026-01-02' })
  assert.equal(semRegistro.ocorridaEm, null)
  assert.equal(semRegistro.registradaEm, '')

  const invalido = apresentacaoLinhaOcorrencia({ ...ocorrencia, createdAt: 'ontem' })
  assert.equal(invalido.ocorridaEm, null)
})

test('apresentacaoLinhaOcorrencia: colaborador e descrição vazios', () => {
  const linha = apresentacaoLinhaOcorrencia({ ...ocorrencia, userName: '  ', description: null })
  assert.equal(linha.colaborador, null)
  assert.equal(linha.descricao, '')
  assert.equal(linha.descricaoLinha, '')
})

test('apresentacaoLinhaOcorrencia: não altera a ocorrência recebida', () => {
  const copia = structuredClone(ocorrencia)
  apresentacaoLinhaOcorrencia(ocorrencia)
  assert.deepEqual(ocorrencia, copia)
})
