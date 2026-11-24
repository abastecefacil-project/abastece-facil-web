import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  classificarErroInicioImportacao,
  desativacoesConfirmadasParaEnvio,
  exigeConfirmacaoDesativacao,
  podeConfirmarImportacao,
  textoConfirmacaoDesativacao,
} from '../src/utils/importacaoPostos.js'

const posto = (cnpj) => ({ cnpj, nome: `Posto ${cnpj}`, cidade: 'Joinville' })
const previaCom = (desativar) => ({ inserir: [posto('1')], desativar })

test('a caixa só é exigida quando a prévia desativa postos', () => {
  assert.equal(exigeConfirmacaoDesativacao(previaCom([posto('2')])), true)
  assert.equal(exigeConfirmacaoDesativacao(previaCom([])), false)
  assert.equal(exigeConfirmacaoDesativacao({ inserir: [posto('1')] }), false)
  assert.equal(exigeConfirmacaoDesativacao(null), false)
})

test('texto da caixa concorda em número', () => {
  assert.equal(
    textoConfirmacaoDesativacao(previaCom([posto('2')])),
    'Conferi a lista e confirmo a desativação de 1 posto.',
  )
  assert.equal(
    textoConfirmacaoDesativacao(previaCom([posto('2'), posto('3')])),
    'Conferi a lista e confirmo a desativação de 2 postos.',
  )
})

test('texto da caixa formata milhar em pt-BR', () => {
  const muitos = Array.from({ length: 1234 }, (_, i) => posto(String(i)))
  assert.equal(
    textoConfirmacaoDesativacao(previaCom(muitos)),
    'Conferi a lista e confirmo a desativação de 1.234 postos.',
  )
})

test('com desativações, o botão só habilita com a caixa marcada', () => {
  const previa = previaCom([posto('2')])
  assert.equal(podeConfirmarImportacao(previa, false), false)
  assert.equal(podeConfirmarImportacao(previa, true), true)
})

test('sem desativações, o botão habilita sem caixa, como antes', () => {
  assert.equal(podeConfirmarImportacao(previaCom([]), false), true)
  assert.equal(podeConfirmarImportacao(previaCom([]), true), true)
})

test('sem prévia, o botão fica desabilitado', () => {
  assert.equal(podeConfirmarImportacao(null, true), false)
})

test('envio leva a quantidade confirmada só quando há desativação e a caixa está marcada', () => {
  assert.equal(desativacoesConfirmadasParaEnvio(previaCom([posto('2'), posto('3')]), true), 2)
  assert.equal(desativacoesConfirmadasParaEnvio(previaCom([posto('2')]), false), null)
  assert.equal(desativacoesConfirmadasParaEnvio(previaCom([]), true), null)
  assert.equal(desativacoesConfirmadasParaEnvio(previaCom([]), false), null)
})

test('erros do início são classificados pelo código, não pelo status', () => {
  const erro = (status, data) => ({ response: { status, data } })

  assert.equal(
    classificarErroInicioImportacao(erro(409, { error: 'PLANO_IMPORTACAO_DIVERGENTE' })),
    'plano-divergente',
  )
  assert.equal(
    classificarErroInicioImportacao(erro(409, { error: 'IMPORTACAO_EM_ANDAMENTO' })),
    'em-andamento',
  )
  assert.equal(
    classificarErroInicioImportacao(erro(422, { error: 'DESATIVACAO_NAO_CONFIRMADA' })),
    'desativacao-nao-confirmada',
  )
})

test('409 sem corpo continua sendo importação em andamento', () => {
  assert.equal(classificarErroInicioImportacao({ response: { status: 409 } }), 'em-andamento')
})

test('demais falhas do início ficam como outro', () => {
  assert.equal(
    classificarErroInicioImportacao({ response: { status: 400, data: { error: 'PLANILHA_INVALIDA' } } }),
    'outro',
  )
  assert.equal(classificarErroInicioImportacao({ response: { status: 422, data: {} } }), 'outro')
  assert.equal(classificarErroInicioImportacao(new Error('Network Error')), 'outro')
})
