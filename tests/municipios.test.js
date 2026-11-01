import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nomeCidadeExibicao } from '../src/utils/municipios.js'

test('nomeCidadeExibicao: devolve o nome oficial do IBGE, com acentos', () => {
  assert.equal(nomeCidadeExibicao('SAO JOSE', 'SC'), 'São José')
  assert.equal(nomeCidadeExibicao('CHAPECO', 'SC'), 'Chapecó')
  assert.equal(nomeCidadeExibicao('CACADOR', 'SC'), 'Caçador')
  assert.equal(nomeCidadeExibicao('TUBARAO', 'SC'), 'Tubarão')
  assert.equal(nomeCidadeExibicao('PORTO UNIAO', 'SC'), 'Porto União')
})

test('nomeCidadeExibicao: ignora caixa, acento e espaços extras', () => {
  assert.equal(nomeCidadeExibicao('são josé', 'sc'), 'São José')
  assert.equal(nomeCidadeExibicao('  Porto   Uniao ', ' SC '), 'Porto União')
  assert.equal(nomeCidadeExibicao('Chapecó', 'SC'), 'Chapecó')
})

test('nomeCidadeExibicao: sem correspondência, usa o nomeProprio', () => {
  assert.equal(nomeCidadeExibicao('CURITIBA', 'PR'), 'Curitiba')
  assert.equal(nomeCidadeExibicao('SAO JOSE DOS PINHAIS', 'PR'), 'Sao Jose dos Pinhais')
})

test('nomeCidadeExibicao: homônimo fora de SC não usa a lista do IBGE', () => {
  // São Domingos existe em SC e em GO; só o de SC recebe a grafia oficial daqui.
  assert.equal(nomeCidadeExibicao('SAO DOMINGOS', 'SC'), 'São Domingos')
  assert.equal(nomeCidadeExibicao('SAO DOMINGOS', 'GO'), 'Sao Domingos')
})

test('nomeCidadeExibicao: sem UF, usa o nomeProprio', () => {
  assert.equal(nomeCidadeExibicao('SAO JOSE'), 'Sao Jose')
  assert.equal(nomeCidadeExibicao('SAO JOSE', null), 'Sao Jose')
})

test('nomeCidadeExibicao: valor vazio ou ausente não quebra', () => {
  assert.equal(nomeCidadeExibicao(''), '')
  assert.equal(nomeCidadeExibicao(null), '')
  assert.equal(nomeCidadeExibicao(undefined), '')
})
