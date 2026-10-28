import assert from 'node:assert/strict'
import { test } from 'node:test'
import { iniciaisDoNome } from '../src/utils/usuario.js'

test('iniciais da primeira e da última palavra', () => {
  assert.equal(iniciaisDoNome('Mariana Prado'), 'MP')
  assert.equal(iniciaisDoNome('João Carlos da Silva'), 'JS')
  assert.equal(iniciaisDoNome('  ana   de  souza '), 'AS')
})

test('uma palavra só dá uma letra', () => {
  assert.equal(iniciaisDoNome('Administrador'), 'A')
  assert.equal(iniciaisDoNome('élio'), 'É')
})

test('nome ausente, vazio ou só com partículas devolve null', () => {
  for (const nome of [null, undefined, '', '   ', 'de da', 42, {}]) {
    assert.equal(iniciaisDoNome(nome), null, `iniciais de ${String(nome)}`)
  }
})
