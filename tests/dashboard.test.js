import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  SEM_VALOR,
  contextoPostos,
  contextoUsuarios,
  contextoVeiculos,
  formatarDataOcorrencia,
  formatarValorKpi,
  subtituloPainel,
  variacaoMensal,
} from '../src/utils/dashboard.js'

test('KPI sem valor mostra traço, nunca 0', () => {
  for (const valor of [null, undefined, NaN, '12']) {
    assert.equal(formatarValorKpi(valor), SEM_VALOR, `valor ${valor}`)
  }
  assert.equal(formatarValorKpi(0), '0')
  assert.equal(formatarValorKpi(1234), '1.234')
})

test('variação em alta e em queda vira percentual sobre o mês anterior', () => {
  assert.deepEqual(variacaoMensal(15, 12), { direcao: 'alta', texto: '25% vs. mês anterior' })
  assert.deepEqual(variacaoMensal(6, 12), { direcao: 'queda', texto: '50% vs. mês anterior' })
})

test('percentual é arredondado para inteiro', () => {
  assert.equal(variacaoMensal(4, 3).texto, '33% vs. mês anterior')
  assert.equal(variacaoMensal(5, 3).texto, '67% vs. mês anterior')
  assert.equal(variacaoMensal(2400, 1000).texto, '140% vs. mês anterior')
})

test('mês anterior zerado mostra só a diferença absoluta', () => {
  assert.deepEqual(variacaoMensal(3, 0), { direcao: 'alta', texto: '+3 vs. mês anterior' })
})

test('meses iguais, inclusive os dois zerados, são estáveis', () => {
  const estavel = { direcao: 'estavel', texto: 'Igual ao mês anterior' }
  assert.deepEqual(variacaoMensal(7, 7), estavel)
  assert.deepEqual(variacaoMensal(0, 0), estavel)
})

test('contexto dos postos concorda em número', () => {
  assert.equal(contextoPostos({ inativos: 12, cidadesAtendidas: 34 }), '12 inativos · 34 cidades')
  assert.equal(contextoPostos({ inativos: 1, cidadesAtendidas: 1 }), '1 inativo · 1 cidade')
  assert.equal(contextoPostos({ inativos: 0, cidadesAtendidas: 1200 }), '0 inativos · 1.200 cidades')
})

test('contexto da frota concorda em número', () => {
  assert.equal(contextoVeiculos({ inativos: 3 }), '3 inativos')
  assert.equal(contextoVeiculos({ inativos: 1 }), '1 inativo')
})

test('contexto dos usuários aguardando ativação', () => {
  assert.equal(contextoUsuarios({ aguardandoAtivacao: 2 }), '2 aguardando ativação')
  assert.equal(contextoUsuarios({ aguardandoAtivacao: 0 }), 'Nenhum aguardando ativação')
})

test('data da ocorrência não recua um dia pelo fuso', () => {
  const texto = formatarDataOcorrencia('2026-10-01')
  assert.match(texto, /^01 /)
  assert.match(texto, /2026$/)
  assert.match(formatarDataOcorrencia('2026-01-31'), /^31 .*2026$/)
})

test('data vazia ou inválida não vira texto', () => {
  for (const data of [null, undefined, '', '2026-13-01', '2026-02-30', '01/10/2026', '2026-10-01T10:00:00']) {
    assert.equal(formatarDataOcorrencia(data), '', `data ${data}`)
  }
})

test('subtítulo junta perfil e horário, omitindo o que faltar', () => {
  const carga = new Date(2026, 9, 21, 14, 5)
  assert.equal(subtituloPainel('GESTOR_FROTA', carga), 'Gestor de Frota · Atualizado às 14:05')
  assert.equal(subtituloPainel('ADMINISTRADOR', null), 'Administrador')
  assert.equal(subtituloPainel(null, carga), 'Atualizado às 14:05')
  assert.equal(subtituloPainel(null, null), '')
  assert.equal(subtituloPainel('ADMINISTRADOR', new Date('inválida')), 'Administrador')
})
