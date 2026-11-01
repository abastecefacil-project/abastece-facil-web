import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ASSISTENCIA_24H,
  MENSAGEM_WHATSAPP_SEGURO,
  WHATSAPP_SEGURO,
} from '../src/config/contatosSeguro.js'
import { hrefTelefone } from '../src/utils/formatacao.js'

test('assistência 24h liga para o 0800 só com dígitos', () => {
  assert.equal(ASSISTENCIA_24H.telefone, '0800 602 0088')
  assert.equal(ASSISTENCIA_24H.href, 'tel:08006020088')
})

test('WhatsApp do seguro vira wa.me com país 55 e mensagem do seguro', () => {
  assert.equal(WHATSAPP_SEGURO.telefone, '(51) 99993-1300')
  assert.equal(
    WHATSAPP_SEGURO.href,
    `https://wa.me/5551999931300?text=${encodeURIComponent(MENSAGEM_WHATSAPP_SEGURO)}`,
  )
})

test('contatos do seguro são imutáveis', () => {
  assert.ok(Object.isFrozen(ASSISTENCIA_24H))
  assert.ok(Object.isFrozen(WHATSAPP_SEGURO))
})

test('link tel: descarta a máscara e some sem dígitos', () => {
  assert.equal(hrefTelefone('(47) 99256-4972'), 'tel:47992564972')
  assert.equal(hrefTelefone('47992564972'), 'tel:47992564972')
  for (const valor of [null, undefined, '', '   ', 'sem número']) {
    assert.equal(hrefTelefone(valor), null, `href de ${String(valor)}`)
  }
})
