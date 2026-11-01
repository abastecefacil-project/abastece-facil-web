import assert from 'node:assert/strict'
import { test } from 'node:test'
import { postoVazio, prepararPostoParaEdicao, statusInicialPosto } from '../src/utils/posto.js'

// F2: o formulário de criação partia de status '' e o PostoDialog enviava
// isActive "". Posto criado manualmente nasce ativo.

test('postoVazio: formulário de criação nasce ativo', () => {
  assert.equal(postoVazio().status, true)
})

test('postoVazio: devolve um objeto novo a cada chamada', () => {
  const primeiro = postoVazio()
  primeiro.name = 'alterado'
  assert.equal(postoVazio().name, '')
  assert.notEqual(postoVazio(), postoVazio())
})

test('statusInicialPosto: criação abre com o switch ligado', () => {
  assert.equal(statusInicialPosto(postoVazio()), true)
})

test('statusInicialPosto: edição respeita o status do posto', () => {
  const base = { address: 'RUA X, 10', district: 'CENTRO', city: 'JOINVILLE', state: 'SC' }
  assert.equal(statusInicialPosto(prepararPostoParaEdicao({ ...base, isActive: true })), true)
  assert.equal(statusInicialPosto(prepararPostoParaEdicao({ ...base, isActive: false })), false)
})

test('statusInicialPosto: valor que não é booleano vale ativo', () => {
  for (const status of ['', null, undefined, 'false', 0]) {
    assert.equal(statusInicialPosto({ status }), true, `status ${JSON.stringify(status)}`)
  }
  assert.equal(statusInicialPosto(undefined), true)
})
