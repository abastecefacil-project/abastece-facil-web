import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { prepararPostoParaEdicao } from '../src/utils/posto.js'
import { apresentacaoNotificacao } from '../src/utils/notificacoes.js'

function sino({ ler, marcar = async () => {} }) {
  const rotas = []
  let montar, desmontar, atualizar
  const source = readFileSync(new URL('../src/components/admin/NotificacoesSino.vue', import.meta.url), 'utf8')
    .match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const contexto = {
    ref: (value) => ({ value }), watch() {},
    onMounted: (fn) => { montar = fn }, onUnmounted: (fn) => { desmontar = fn },
    useRouter: () => ({ push: async (rota) => rotas.push(rota) }),
    getNotificacoes: ler, marcarNotificacaoLida: marcar,
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
  const item = { id: 10, tipo: 'RECUSA_NEO', postoId: 42, lida: false }
  const { acao } = apresentacaoNotificacao(item)
  await s.executar(item, acao)
  await s.executar(item, acao)
  assert.deepEqual(marcadas, [10])
  assert.equal(s.naoLidas.value, 1)
  assert.equal(s.rotas[0].name, 'StationAdmin')
  assert.equal(s.rotas[0].query.posto, '42')
})

test('falha ao marcar preserva não lida e não encaminha', async () => {
  const s = sino({ ler: async () => {}, marcar: async () => { throw new Error('offline') } })
  const item = { id: 10, tipo: 'RECUSA_NEO', postoId: 42, lida: false }
  await s.executar(item, apresentacaoNotificacao(item).acao)
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

test('ocorrência marca como lida e encaminha para Ocorrências com ?ocorrencia=', async () => {
  const marcadas = []
  const s = sino({ ler: async () => {}, marcar: async (id) => marcadas.push(id) })
  s.naoLidas.value = 1
  const item = { id: 13, tipo: 'OCORRENCIA', ocorrenciaId: 9, lida: false }
  await s.executar(item, apresentacaoNotificacao(item).acao)
  assert.deepEqual(marcadas, [13])
  assert.equal(s.naoLidas.value, 0)
  assert.deepEqual(s.rotas, [{ name: 'OccurrencesAdmin', query: { ocorrencia: '9' } }])
})

test('apresentação por tipo: textos com destaque e fallback sem ação', () => {
  const texto = (n) => apresentacaoNotificacao(n).texto(n)
  const neo = { tipo: 'RECUSA_NEO', usuarioNome: 'Colaborador', postoNome: 'POSTO TUIUTI LTDA', postoId: 44 }
  assert.equal(apresentacaoNotificacao(neo).titulo, 'Recusa do cartão Neo')
  assert.equal(apresentacaoNotificacao(neo).icone, 'mdi-credit-card-remove-outline')
  assert.equal(texto(neo).map((t) => t.texto).join(''), 'Colaborador relatou que o Neo não passou no posto POSTO TUIUTI LTDA.')
  assert.deepEqual(texto(neo).filter((t) => t.destaque).map((t) => t.texto), ['Colaborador', 'POSTO TUIUTI LTDA'])

  const oc = { tipo: 'OCORRENCIA', usuarioNome: 'Administrador', ocorrenciaTitulo: 'Pneu furado', ocorrenciaPlaca: 'MGM5H18', ocorrenciaId: 9 }
  assert.equal(apresentacaoNotificacao(oc).titulo, 'Nova ocorrência')
  assert.equal(apresentacaoNotificacao(oc).cor, 'warning')
  assert.equal(texto(oc).map((t) => t.texto).join(''), 'Administrador registrou "Pneu furado" no veículo MGM5H18.')
  assert.deepEqual(texto(oc).filter((t) => t.destaque).map((t) => t.texto), ['Administrador', 'MGM5H18'])
  assert.equal(apresentacaoNotificacao(oc).acao.rotulo, 'Analisar ocorrência')

  for (const desconhecida of [{ tipo: 'OUTRO' }, {}, null]) {
    assert.equal(apresentacaoNotificacao(desconhecida).acao, null)
    assert.equal(apresentacaoNotificacao(desconhecida).titulo, 'Notificação')
  }
})
