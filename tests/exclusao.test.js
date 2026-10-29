import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MENSAGEM_ERRO_EXCLUSAO, mensagemErroExclusao } from '../src/utils/exclusao.js'

test('usa a mensagem do backend quando ela vem no ErrorResponse', () => {
  const erro = { response: { status: 409, data: { error: 'CONFLICT', message: 'Posto em uso.' } } }
  assert.equal(mensagemErroExclusao(erro), 'Posto em uso.')
})

test('sem mensagem do backend, o texto padrão', () => {
  assert.equal(MENSAGEM_ERRO_EXCLUSAO, 'Não foi possível excluir. Tente novamente.')
  // 500 cru do BasicErrorController: sem `message`.
  assert.equal(mensagemErroExclusao({ response: { status: 500, data: { error: 'Internal Server Error' } } }), MENSAGEM_ERRO_EXCLUSAO)
  // 403 do Spring Security: sem corpo.
  assert.equal(mensagemErroExclusao({ response: { status: 403, data: '' } }), MENSAGEM_ERRO_EXCLUSAO)
  // Conexão perdida: sem resposta.
  assert.equal(mensagemErroExclusao({ message: 'Network Error' }), MENSAGEM_ERRO_EXCLUSAO)
  assert.equal(mensagemErroExclusao(undefined), MENSAGEM_ERRO_EXCLUSAO)
})

test('mensagem em branco ou que não é texto cai no padrão', () => {
  assert.equal(mensagemErroExclusao({ response: { data: { message: '   ' } } }), MENSAGEM_ERRO_EXCLUSAO)
  assert.equal(mensagemErroExclusao({ response: { data: { message: 42 } } }), MENSAGEM_ERRO_EXCLUSAO)
})
