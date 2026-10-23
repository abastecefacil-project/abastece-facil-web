import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { prepararPostoParaEdicao } from '../src/utils/posto.js'

function sino({ ler, marcar = async () => {} }) {
  const rotas = []
  let montar, desmontar, atualizar
  const source = readFileSync(new URL('../src/components/admin/NotificacoesNeo.vue', import.meta.url), 'utf8')
    .match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const contexto = {
    ref: (value) => ({ value }), watch() {},
    onMounted: (fn) => { montar = fn }, onUnmounted: (fn) => { desmontar = fn },
    useRouter: () => ({ push: async (rota) => rotas.push(rota) }),
    getNotificacoesNeo: ler, marcarNotificacaoNeoLida: marcar,
    window: { setInterval: (fn) => { atualizar = fn; return 1 }, clearInterval() {} }, document: { hidden: false },
  }
  runInNewContext(`${source}\nglobalThis.sino = { carregar, executar, naoLidas, itens, erro, mudarPagina, pagina }`, contexto)
  return { ...contexto.sino, rotas, montar: () => montar(), desmontar: () => desmontar(), atualizar: () => atualizar() }
}

test('sino carrega não lidas e marca uma vez antes de encaminhar ao posto certo', async () => {
  const marcadas = []
  const s = sino({ ler: async () => ({ data: { naoLidas: 2, pagina: { content: [], totalPages: 1 } } }), marcar: async (id) => marcadas.push(id) })
  await s.carregar()
  assert.equal(s.naoLidas.value, 2)
  const item = { id: 10, postoId: 42, lida: false }
  await s.executar(item, true)
  await s.executar(item, true)
  assert.deepEqual(marcadas, [10])
  assert.equal(s.naoLidas.value, 1)
  assert.equal(s.rotas[0].name, 'StationAdmin')
  assert.equal(s.rotas[0].query.posto, '42')
})

test('falha ao marcar preserva não lida e não encaminha', async () => {
  const s = sino({ ler: async () => {}, marcar: async () => { throw new Error('offline') } })
  const item = { id: 10, lida: false }
  await s.executar(item, true)
  assert.equal(item.lida, false)
  assert.equal(s.rotas.length, 0)
  assert.ok(s.erro.value)
})

test('consulta periódica deixa de atualizar o estado após desmontagem', async () => {
  let concluir
  const s = sino({ ler: () => new Promise((resolve) => { concluir = resolve }) })
  const consulta = s.carregar()
  s.desmontar()
  concluir({ data: { naoLidas: 3, pagina: { content: [], totalPages: 1 } } })
  await consulta
  assert.equal(s.naoLidas.value, 0)
})

test('abrir posto para análise preserva status, endereço, horário ausente e coordenadas', () => {
  const posto = prepararPostoParaEdicao({ id: 42, name: 'Posto', isActive: true,
    address: 'Rua A, 123', district: 'Centro', city: 'Joinville', state: 'SC',
    businessHours: null, latitude: '-26.12345678', longitude: '-48.12345678' })
  assert.equal(posto.status, true)
  assert.equal(posto.address, 'Rua A')
  assert.equal(posto.number, '123')
  assert.equal(posto.openTime, '')
  assert.equal(posto.latitude, '-26.12345678')
})
