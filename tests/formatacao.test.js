import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formatarDataCurta,
  formatarDataHora,
  formatarDistancia,
  formatarDuracao,
  horarioExibicao,
  nomeProprio,
  TELEFONE_NAO_INFORMADO,
  telefoneExibicao,
} from '../src/utils/formatacao.js'

// ── telefone ────────────────────────────────────────────────────────────────

test('telefone com 11 e 10 dígitos ganha máscara', () => {
  assert.equal(telefoneExibicao('47992564972'), '(47) 99256-4972')
  assert.equal(telefoneExibicao('4832588723'), '(48) 3258-8723')
  assert.equal(telefoneExibicao('(48) 3258-8723'), '(48) 3258-8723')
  assert.equal(telefoneExibicao(4832588723), '(48) 3258-8723')
})

test('telefone em outro formato é exibido como veio', () => {
  assert.equal(telefoneExibicao('+55 47 99256-4972'), '+55 47 99256-4972')
  assert.equal(telefoneExibicao('0800 602 0088'), '0800 602 0088')
  assert.equal(telefoneExibicao('3258-8723'), '3258-8723')
})

test('telefone vazio devolve null, e o texto de fallback existe', () => {
  for (const vazio of [null, undefined, '', '   ']) assert.equal(telefoneExibicao(vazio), null)
  assert.equal(TELEFONE_NAO_INFORMADO, 'Telefone não informado')
})

// ── horário ─────────────────────────────────────────────────────────────────

test('00:00 - 23:59 vira "24 horas"', () => {
  assert.equal(horarioExibicao('00:00 - 23:59'), '24 horas')
  assert.equal(horarioExibicao('00:00  -  23:59'), '24 horas')
})

test('horário comum é normalizado', () => {
  assert.equal(horarioExibicao('07:00 - 21:00'), '07:00 - 21:00')
  assert.equal(horarioExibicao(' 06:30-22:00 '), '06:30 - 22:00')
  assert.equal(horarioExibicao('00:00 - 00:00'), '00:00 - 00:00')
})

test('horário vazio ou inválido devolve null', () => {
  for (const valor of [null, undefined, '', 'seg a sex', '25:00 - 26:00']) {
    assert.equal(horarioExibicao(valor), null, String(valor))
  }
})

// ── nome próprio ────────────────────────────────────────────────────────────

test('caixa alta vira Title Case', () => {
  assert.equal(nomeProprio('POSTO MARQUINHO SERRARIA'), 'Posto Marquinho Serraria')
  assert.equal(nomeProprio('POSTO SÃO JOÃO'), 'Posto São João')
  assert.equal(nomeProprio('JOINVILLE'), 'Joinville')
})

test('siglas da §4.7 ficam em maiúsculas em qualquer posição', () => {
  assert.equal(nomeProprio('AUTO POSTO BENEDETTA LTDA'), 'Auto Posto Benedetta LTDA')
  assert.equal(nomeProprio('COMERCIO DE COMBUSTIVEIS ME'), 'Comercio de Combustiveis ME')
  assert.equal(nomeProprio('POSTO XYZ EPP'), 'Posto Xyz EPP')
  assert.equal(nomeProprio('REDE SUL S/A'), 'Rede Sul S/A')
  assert.equal(nomeProprio('REDE SUL SA'), 'Rede Sul SA')
  assert.equal(nomeProprio('POSTO DOM PEDRO II'), 'Posto Dom Pedro II')
  assert.equal(nomeProprio('POSTO KM 85'), 'Posto KM 85')
  assert.equal(nomeProprio('RODOVIA SC 401'), 'Rodovia SC 401')
})

test('S/N fica sempre em maiúsculas', () => {
  assert.equal(nomeProprio('RODOVIA BR 153, S/N - ANTA GORDA'), 'Rodovia BR 153, S/N - Anta Gorda')
  assert.equal(nomeProprio('RUA DAS FLORES S/N'), 'Rua das Flores S/N')
})

test('preposições em minúsculas, exceto abrindo o texto', () => {
  assert.equal(nomeProprio('POSTO DA PRAIA E DO CAMPO'), 'Posto da Praia e do Campo')
  assert.equal(nomeProprio('RUA DOS ANDRADAS DAS NEVES DE SOUZA'), 'Rua dos Andradas das Neves de Souza')
  assert.equal(nomeProprio('DA SILVA COMBUSTIVEIS'), 'Da Silva Combustiveis')
})

test('UF em maiúsculas no fim do texto ou depois de "-" ou "/"', () => {
  assert.equal(nomeProprio('RUA X, 10 - MAFRA - SC'), 'Rua X, 10 - Mafra - SC')
  assert.equal(nomeProprio('CENTRO - CURITIBA - PR'), 'Centro - Curitiba - PR')
  assert.equal(nomeProprio('PORTO ALEGRE/RS'), 'Porto Alegre/RS')
  assert.equal(nomeProprio('ITAJAI - SP'), 'Itajai - SP')
  assert.equal(nomeProprio('CIDADE PR'), 'Cidade PR')
})

test('palavra igual a UF no meio do nome é palavra comum', () => {
  assert.equal(nomeProprio('POSTO SE LIGA LTDA'), 'Posto Se Liga LTDA')
  assert.equal(nomeProprio('AUTO POSTO PE DE SERRA'), 'Auto Posto Pe de Serra')
  assert.equal(nomeProprio('POSTO TO GO'), 'Posto To GO')
})

test('tokens com dígito e pontuação colada ficam intactos', () => {
  assert.equal(nomeProprio('RODOVIA BR-101, KM200'), 'Rodovia BR-101, KM200')
  assert.equal(nomeProprio('RUA LUIZ GONZAGA AMORIM, 83 - VILA NOVA'), 'Rua Luiz Gonzaga Amorim, 83 - Vila Nova')
  assert.equal(nomeProprio('AV. BRASIL, 1500A (CENTRO)'), 'Av. Brasil, 1500A (Centro)')
  assert.equal(nomeProprio('POSTO DELTA - RINCAO'), 'Posto Delta - Rincao')
})

test('texto que já tem minúscula, ou sem letra, volta como veio', () => {
  assert.equal(nomeProprio('Posto Delta LTDA'), 'Posto Delta LTDA')
  assert.equal(nomeProprio('POSTO Delta'), 'POSTO Delta')
  assert.equal(nomeProprio('1500'), '1500')
  assert.equal(nomeProprio(''), '')
  assert.equal(nomeProprio(null), '')
  assert.equal(nomeProprio(undefined), '')
})

// ── datas ───────────────────────────────────────────────────────────────────

test('formatarDataHora no fuso local, dd/mm/aaaa HH:mm', () => {
  assert.equal(formatarDataHora('2026-08-18T09:05:00'), '18/08/2026 09:05')
  assert.equal(formatarDataHora('2026-01-02T23:59:59.123'), '02/01/2026 23:59')
  for (const valor of [null, undefined, '', 'ontem']) assert.equal(formatarDataHora(valor), '', String(valor))
})

test('formatarDataCurta monta o LocalDate pelas partes, sem fuso', () => {
  assert.equal(formatarDataCurta('2026-08-18'), '18/08/2026')
  assert.equal(formatarDataCurta('2026-01-01'), '01/01/2026')
  for (const valor of [null, undefined, '', '18/08/2026']) assert.equal(formatarDataCurta(valor), '', String(valor))
})

// ── rota ────────────────────────────────────────────────────────────────────

test('distância em km com vírgula decimal', () => {
  assert.equal(formatarDistancia(176600), '176,6 km')
  assert.equal(formatarDistancia(960), '1,0 km')
  assert.equal(formatarDistancia(0), '0,0 km')
  assert.equal(formatarDistancia(undefined), '')
})

test('duração em minutos abaixo de uma hora e em horas a partir dela', () => {
  assert.equal(formatarDuracao(45 * 60), '45 min')
  assert.equal(formatarDuracao(59 * 60 + 29), '59 min')
  assert.equal(formatarDuracao(2 * 3600 + 23 * 60), '2h 23min')
  assert.equal(formatarDuracao(3600), '1h 0min')
  assert.equal(formatarDuracao(null), '')
})
