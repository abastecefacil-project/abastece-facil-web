import assert from 'node:assert/strict'
import { test } from 'node:test'
import { devolverFoco, elementoDeOrigem } from '../src/utils/foco.js'

// DOM mínimo: só o que devolverFoco consulta.
function documento({ dialogoAberto = false, porChave = {} } = {}) {
  const doc = {
    body: { nome: 'body' },
    activeElement: null,
    querySelector(seletor) {
      if (seletor === '.v-dialog.v-overlay--active') return dialogoAberto ? {} : null
      const chave = seletor.match(/^\[data-origem="(.+)"\]$/)?.[1]
      return (chave && porChave[chave]) || null
    },
  }
  doc.activeElement = doc.body
  return doc
}

function botao(doc, { conectado = true, chave } = {}) {
  const el = {
    isConnected: conectado,
    dataset: chave ? { origem: chave } : {},
    closest: () => null,
    focus() { doc.activeElement = el },
  }
  return el
}

test('elementoDeOrigem: o botão do clique (currentTarget), não o ícone', () => {
  const alvo = {}
  assert.equal(elementoDeOrigem({ currentTarget: alvo, target: {} }), alvo)
  assert.equal(elementoDeOrigem(undefined), null)
})

test('devolverFoco: foco no <body> volta para a origem', () => {
  const doc = documento()
  const origem = botao(doc)
  assert.equal(devolverFoco(origem, { documento: doc }), 'devolvido')
  assert.equal(doc.activeElement, origem)
})

test('devolverFoco: foco ainda dentro do diálogo que fechou também conta como perdido', () => {
  const doc = documento()
  const origem = botao(doc)
  doc.activeElement = { closest: (s) => (s === '.v-overlay' ? {} : null) }
  assert.equal(devolverFoco(origem, { documento: doc }), 'devolvido')
  assert.equal(doc.activeElement, origem)
})

test('devolverFoco: com outro diálogo aberto, aguarda e não rouba o foco dele', () => {
  const doc = documento({ dialogoAberto: true })
  const origem = botao(doc)
  const noModal = { closest: () => ({}) }
  doc.activeElement = noModal
  assert.equal(devolverFoco(origem, { documento: doc }), 'aguardando')
  assert.equal(doc.activeElement, noModal)
})

test('devolverFoco: foco levado para outro lugar fica onde está', () => {
  const doc = documento()
  const origem = botao(doc)
  const campo = { closest: () => null }
  doc.activeElement = campo
  assert.equal(devolverFoco(origem, { documento: doc }), 'mantido')
  assert.equal(doc.activeElement, campo)
})

test('devolverFoco: linha recriada pela recarga é encontrada pelo data-origem', () => {
  const porChave = {}
  const doc = documento({ porChave })
  const antigo = botao(doc, { conectado: false, chave: 'editar-7' })
  porChave['editar-7'] = botao(doc, { chave: 'editar-7' })
  assert.equal(devolverFoco(antigo, { documento: doc }), 'devolvido')
  assert.equal(doc.activeElement, porChave['editar-7'])
})

test('devolverFoco: origem que sumiu da lista cai na primeira alternativa existente', () => {
  const doc = documento()
  const antigo = botao(doc, { conectado: false, chave: 'status-7' })
  const alerta = botao(doc)
  const busca = botao(doc)
  assert.equal(devolverFoco(antigo, { documento: doc, alternativas: [null, alerta, busca] }), 'devolvido')
  assert.equal(doc.activeElement, alerta)
})

test('devolverFoco: sem origem nem alternativa, não faz nada', () => {
  const doc = documento()
  assert.equal(devolverFoco(null, { documento: doc }), 'sem-destino')
  assert.equal(doc.activeElement, doc.body)
})
