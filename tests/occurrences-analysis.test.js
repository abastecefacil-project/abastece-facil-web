import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { apresentacaoLinhaOcorrencia } from '../src/utils/ocorrenciaExibicao.js'

function telaOcorrencias({ query, buscar }) {
  const route = { query: { ...query } }
  const substituicoes = []
  let observarQuery
  const source = readFileSync(new URL('../src/views/admin/OccurrencesAnalysis.vue', import.meta.url), 'utf8')
    .match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const contexto = {
    ref: (value) => ({ value }), computed: (fn) => ({ get value() { return fn() } }), onMounted() {},
    watch: (fonte, fn) => { if (typeof fonte === 'function') observarQuery = () => fn(fonte()) },
    watchDebounced() {}, apresentacaoLinhaOcorrencia, getOccurrences: async () => {}, getOccurrenceById: buscar,
    devolverFoco: () => 'sem-destino', useRoute: () => route,
    useRouter: () => ({ replace: (rota) => { substituicoes.push(rota); route.query = rota.query } }),
  }
  runInNewContext(`${source}
globalThis.tela = { dialogOpen, selectedOccurrence, erroNotificacao, aoFecharDialogo }`, contexto)
  return { ...contexto.tela, route, substituicoes, observarQuery }
}

test('?ocorrencia= abre o detalhe da ocorrência e fechar limpa a query', async () => {
  const pedidos = []
  const t = telaOcorrencias({ query: { ocorrencia: '9' }, buscar: async (id) => {
    pedidos.push(id)
    return { data: { id: 9, title: 'Pneu furado', carPlate: 'MGM5H18', createdAt: '2026-11-10T10:00:00' } }
  } })
  await t.observarQuery()
  assert.deepEqual(pedidos, ['9'])
  assert.equal(t.dialogOpen.value, true)
  assert.equal(t.selectedOccurrence.value.placa, 'MGM5H18')
  t.aoFecharDialogo()
  assert.equal(t.substituicoes.length, 1)
  assert.equal(t.route.query.ocorrencia, undefined)
})

test('?ocorrencia= inexistente mostra o alerta, e resposta de query antiga é descartada', async () => {
  const falha = telaOcorrencias({ query: { ocorrencia: '999999' }, buscar: async () => { throw new Error('404') } })
  await falha.observarQuery()
  assert.equal(falha.dialogOpen.value, false)
  assert.ok(falha.erroNotificacao.value)

  let responder
  const antiga = telaOcorrencias({ query: { ocorrencia: '9' }, buscar: () => new Promise((r) => { responder = r }) })
  const consulta = antiga.observarQuery()
  antiga.route.query = {}
  responder({ data: { id: 9, title: 'Pneu furado' } })
  await consulta
  assert.equal(antiga.dialogOpen.value, false)
})
