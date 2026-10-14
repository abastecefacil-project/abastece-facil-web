import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { lerTokenValido } from '../src/utils/sessao.js'

const jwt = (claims) => `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.assinatura`

test('restaura tokens válidos e limpa tokens vencidos ou malformados junto com o perfil', () => {
  const dados = new Map()
  globalThis.localStorage = {
    getItem: (key) => dados.get(key) ?? null,
    removeItem: (key) => dados.delete(key),
  }
  try {
    const valido = jwt({ exp: Math.floor(Date.now() / 1000) + 60 })
    dados.set('token', valido)
    dados.set('perfil', 'COLABORADOR')
    assert.equal(lerTokenValido(), valido)
    assert.equal(dados.get('perfil'), 'COLABORADOR')
    for (const token of [jwt({ exp: Math.floor(Date.now() / 1000) }), jwt({ exp: 1 }),
      jwt({}), jwt({ exp: '9999999999' }), 'inválido', 'e30.%%%.assinatura']) {
      dados.set('token', token)
      dados.set('perfil', 'COLABORADOR')
      assert.equal(lerTokenValido(), null)
      assert.equal(dados.has('token'), false)
      assert.equal(dados.has('perfil'), false)
    }
  } finally {
    delete globalThis.localStorage
  }
})

test('API rejeitando sessão redireciona ao login, mas falta de permissão preserva a sessão', async () => {
  let interceptarResposta
  let limpezas = 0
  const destinos = []
  const source = readFileSync(new URL('../src/services/apiClient.js', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace('import.meta.env.VITE_API_BASE_URL', "''")
    .replace('export default apiPublic', '')
    .replace(/export /g, '')
  runInNewContext(source, {
    axios: { create: () => ({ interceptors: {
      request: { use() {} },
      response: { use: (_, callback) => { interceptarResposta = callback } },
    } }) },
    limparSessao: () => { limpezas++ },
    window: { location: { replace: (url) => destinos.push(url) } },
  })
  const proibido = { response: { status: 403 } }
  await assert.rejects(interceptarResposta(proibido), (error) => error === proibido)
  assert.equal(limpezas, 0)
  const expirado = { response: { status: 401 } }
  await assert.rejects(interceptarResposta(expirado), (error) => error === expirado)
  assert.equal(limpezas, 1)
  assert.deepEqual(destinos, ['/login'])
})
