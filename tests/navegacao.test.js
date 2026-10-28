import assert from 'node:assert/strict'
import { test } from 'node:test'
import { agruparPorGrupo, itensVisiveis } from '../src/config/navegacao.js'

// Rotas visíveis por perfil antes do R3 (docs/redesign/INVENTARIO.md §5). O
// redesign reordenou e agrupou o menu, mas o conjunto não pode mudar.
const ROTAS_GESTAO = [
  'AdminDashboard',
  'MapAdmin',
  'StationAdmin',
  'VehicleAdmin',
  'OccurrencesAdmin',
  'UsersAdmin',
]
const ROTAS_COLABORADOR = [
  'UserDashboard',
  'MapUser',
  'UserGasStations',
  'OccurrencesUser',
  'HelpCenter',
]

const rotas = (itens) => itens.map((item) => item.to.name).sort()

test('administrador e gestor veem os mesmos seis itens de antes', () => {
  for (const perfil of ['ADMINISTRADOR', 'GESTOR_FROTA']) {
    assert.deepEqual(rotas(itensVisiveis('admin', perfil)), [...ROTAS_GESTAO].sort(), perfil)
  }
})

test('o menu de gestão não aparece para colaborador nem para perfil nulo', () => {
  for (const perfil of ['COLABORADOR', null]) {
    assert.deepEqual(itensVisiveis('admin', perfil), [], String(perfil))
  }
})

test('o menu do colaborador vale para qualquer sessão, inclusive perfil nulo', () => {
  for (const perfil of ['COLABORADOR', 'GESTOR_FROTA', 'ADMINISTRADOR', null]) {
    assert.deepEqual(rotas(itensVisiveis('user', perfil)), [...ROTAS_COLABORADOR].sort(), String(perfil))
  }
})

test('grupos do admin na ordem Visão geral, Operação, Cadastros', () => {
  const secoes = agruparPorGrupo(itensVisiveis('admin', 'ADMINISTRADOR'))
  assert.deepEqual(
    secoes.map((secao) => [secao.grupo, secao.itens.map((item) => item.title)]),
    [
      ['Visão geral', ['Painel', 'Mapa']],
      ['Operação', ['Ocorrências']],
      ['Cadastros', ['Postos', 'Veículos', 'Usuários']],
    ],
  )
})

test('colaborador tem uma seção só, sem rótulo, e "Início" no lugar de "Home"', () => {
  const secoes = agruparPorGrupo(itensVisiveis('user', 'COLABORADOR'))
  assert.equal(secoes.length, 1)
  assert.equal(secoes[0].grupo, null)
  assert.equal(secoes[0].itens[0].title, 'Início')
})

test('Ocorrências usa o mesmo ícone nos dois contextos, e todo ícone é outline', () => {
  const ocorrencias = ['admin', 'user'].map(
    (contexto) => itensVisiveis(contexto, 'ADMINISTRADOR').find((item) => item.value === 'ocorrencias').icon,
  )
  assert.equal(ocorrencias[0], ocorrencias[1])
  for (const contexto of ['admin', 'user']) {
    for (const item of itensVisiveis(contexto, 'ADMINISTRADOR')) {
      assert.match(item.icon, /-outline$/, `${contexto}: ${item.title}`)
    }
  }
})

test('agruparPorGrupo junta só itens consecutivos', () => {
  const secoes = agruparPorGrupo([{ grupo: 'A' }, { grupo: 'A' }, { grupo: 'B' }, {}, {}])
  assert.deepEqual(
    secoes.map((secao) => [secao.grupo, secao.itens.length]),
    [
      ['A', 2],
      ['B', 1],
      [null, 2],
    ],
  )
})
