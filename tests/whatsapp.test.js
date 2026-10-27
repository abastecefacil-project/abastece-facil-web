import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MENSAGEM_PADRAO_WHATSAPP,
  montarUrlWhatsapp,
  normalizarNumeroWhatsapp,
} from '../src/utils/whatsapp.js'

test('número válido de celular (13 dígitos) e de fixo (12 dígitos)', () => {
  assert.deepEqual(normalizarNumeroWhatsapp('5547999999999'), {
    numero: '5547999999999',
    motivo: null,
  })
  assert.deepEqual(normalizarNumeroWhatsapp('554733334444'), { numero: '554733334444', motivo: null })
})

test('número com máscara é reduzido aos dígitos', () => {
  for (const valor of ['+55 (47) 99999-9999', '55 47 99999 9999', ' 5547999999999 ']) {
    assert.deepEqual(normalizarNumeroWhatsapp(valor), { numero: '5547999999999', motivo: null }, valor)
  }
})

test('telefone cadastrado com DDD recebe o código do Brasil', () => {
  assert.deepEqual(normalizarNumeroWhatsapp('(47) 99999-9999'), { numero: '5547999999999', motivo: null })
  assert.deepEqual(normalizarNumeroWhatsapp('4733334444'), { numero: '554733334444', motivo: null })
  assert.deepEqual(normalizarNumeroWhatsapp('55999999999'), { numero: '5555999999999', motivo: null })
  assert.deepEqual(normalizarNumeroWhatsapp('0147999999999'), { numero: null, motivo: 'invalido' })
})

test('número curto ou longo demais é inválido', () => {
  for (const valor of ['479999999', '55', '55479999999999', 'abc']) {
    assert.deepEqual(normalizarNumeroWhatsapp(valor), { numero: null, motivo: 'invalido' }, valor)
  }
})

test('valor vazio ou ausente', () => {
  for (const valor of ['', '   ', null, undefined]) {
    assert.deepEqual(normalizarNumeroWhatsapp(valor), { numero: null, motivo: 'ausente' }, `${valor}`)
  }
})

test('URL com a mensagem padrão codificada', () => {
  assert.equal(
    montarUrlWhatsapp('5547999999999'),
    `https://wa.me/5547999999999?text=${encodeURIComponent(MENSAGEM_PADRAO_WHATSAPP)}`,
  )
  assert.equal(
    montarUrlWhatsapp('5547999999999'),
    'https://wa.me/5547999999999?text=Ol%C3%A1!%20Sou%20colaborador%20e%20preciso%20de%20ajuda%20com%20um%20ve%C3%ADculo%20da%20frota.',
  )
})

test('URL com mensagem personalizada escapa caracteres reservados', () => {
  assert.equal(
    montarUrlWhatsapp('554733334444', 'placa ABC-1234 & km?'),
    'https://wa.me/554733334444?text=placa%20ABC-1234%20%26%20km%3F',
  )
})
