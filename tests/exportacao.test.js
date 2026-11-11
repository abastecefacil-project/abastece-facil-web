import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MENSAGEM_ERRO_EXPORTACAO,
  mensagemErroExportacao,
  nomeArquivoExportacao,
} from '../src/utils/exportacao.js'

test('nome do arquivo vem do Content-Disposition', () => {
  assert.equal(
    nomeArquivoExportacao('attachment; filename="veiculos-2026-11-11.xlsx"', 'veiculos'),
    'veiculos-2026-11-11.xlsx',
  )
  assert.equal(nomeArquivoExportacao('attachment; filename=postos-2026-11-11.xlsx', 'postos'), 'postos-2026-11-11.xlsx')
})

test('filename* tem precedência e é decodificado', () => {
  assert.equal(
    nomeArquivoExportacao(
      'attachment; filename="ocorrencias.xlsx"; filename*=UTF-8\'\'ocorr%C3%AAncias-2026-11-11.xlsx',
      'ocorrencias',
    ),
    'ocorrências-2026-11-11.xlsx',
  )
})

test('sem header, fallback <entidade>-AAAA-MM-DD.xlsx na data local', () => {
  const data = new Date(2026, 0, 5, 23, 30)
  assert.equal(nomeArquivoExportacao(undefined, 'usuarios', data), 'usuarios-2026-01-05.xlsx')
  assert.equal(nomeArquivoExportacao('attachment', 'usuarios', data), 'usuarios-2026-01-05.xlsx')
})

test('erro em Blob com JSON devolve a message do backend', async () => {
  const data = new Blob([JSON.stringify({ status: 403, error: 'PERFIL_NAO_PERMITIDO', message: 'Sem permissão.' })], {
    type: 'application/json',
  })
  assert.equal(await mensagemErroExportacao({ response: { status: 403, data } }), 'Sem permissão.')
})

test('erro sem corpo, com corpo que não é JSON ou sem resposta usa a mensagem padrão', async () => {
  assert.equal(await mensagemErroExportacao({ response: { status: 403, data: new Blob([]) } }), MENSAGEM_ERRO_EXPORTACAO)
  assert.equal(
    await mensagemErroExportacao({ response: { status: 502, data: new Blob(['<html>Bad Gateway</html>']) } }),
    MENSAGEM_ERRO_EXPORTACAO,
  )
  assert.equal(await mensagemErroExportacao(new Error('Network Error')), MENSAGEM_ERRO_EXPORTACAO)
})
