import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

function dialogo({ consultar, salvar = async () => ({ data: {} }), remover = async () => ({ data: {} }) }) {
  const vue = readFileSync(new URL('../src/components/user/AvaliacaoNeoDialog.vue', import.meta.url), 'utf8')
  const script = vue.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const context = {
    defineProps: () => ({ posto: { id: 42 } }), defineEmits: () => () => {},
    ref: (value) => ({ value }),
    onMounted() {},
    getAvaliacaoNeo: consultar, salvarAvaliacaoNeo: salvar,
    removerAvaliacaoNeo: remover,
  }
  runInNewContext(`${script}\nglobalThis.dialogo = { carregar, salvar, remover, resposta, resumo, falhaCarga, erro, sucesso, salvando }`, context)
  return context.dialogo
}

test('restaura Não passou e envia false, mantendo uma única resposta do usuário', async () => {
  const envios = []
  const d = dialogo({
    consultar: async () => ({ data: { minhaResposta: false, passaram: 1, naoPassaram: 0 } }),
    salvar: async (...args) => {
      envios.push(args)
      return { data: { minhaResposta: false, passaram: 0, naoPassaram: 1, ultimoRelatoEm: '2026-10-19T12:30:00' } }
    },
  })
  await d.carregar()
  assert.equal(d.resposta.value, false)
  await d.salvar()
  assert.deepEqual(envios, [[42, false]])
  assert.equal(d.sucesso.value, true)
  assert.equal(d.resumo.value.passaram, 0)
  assert.equal(d.resumo.value.naoPassaram, 1)
  assert.equal(d.resumo.value.ultimoRelatoEm, '2026-10-19T12:30:00')
})

test('falhas de rede são exibidas sem confirmar salvamento e permitem tentar novamente', async () => {
  const d = dialogo({
    consultar: async () => { throw new Error('offline') },
    salvar: async () => { throw new Error('offline') },
  })
  await d.carregar()
  assert.equal(d.falhaCarga.value, true)
  assert.ok(d.erro.value)
  await d.salvar()
  assert.equal(d.sucesso.value, false)
  assert.equal(d.salvando.value, false)
})

test('todos os usuários carregam os totais e a data do último relato', async () => {
  const d = dialogo({ consultar: async () => ({
    data: { minhaResposta: null, passaram: 4, naoPassaram: 2, ultimoRelatoEm: '2026-10-19T12:30:00' },
  }) })
  await d.carregar()
  assert.equal(d.resumo.value.passaram, 4)
  assert.equal(d.resumo.value.naoPassaram, 2)
  assert.equal(d.resumo.value.ultimoRelatoEm, '2026-10-19T12:30:00')
})

test('remover resposta limpa seleção e atualiza contagens e data', async () => {
  const d = dialogo({
    consultar: async () => ({ data: { minhaResposta: false, passaram: 0, naoPassaram: 1 } }),
    remover: async (id) => {
      assert.equal(id, 42)
      return { data: { minhaResposta: null, passaram: 0, naoPassaram: 0, ultimoRelatoEm: null } }
    },
  })
  await d.carregar()
  await d.remover()
  assert.equal(d.resposta.value, null)
  assert.equal(d.resumo.value.minhaResposta, null)
  assert.equal(d.resumo.value.naoPassaram, 0)
  assert.equal(d.resumo.value.ultimoRelatoEm, null)
  assert.equal(d.sucesso.value, true)
})

test('falha ao remover preserva resposta e permite tentar novamente', async () => {
  const d = dialogo({
    consultar: async () => ({ data: { minhaResposta: true, passaram: 1, naoPassaram: 0 } }),
    remover: async () => { throw new Error('offline') },
  })
  await d.carregar()
  await d.remover()
  assert.equal(d.resposta.value, true)
  assert.equal(d.resumo.value.passaram, 1)
  assert.equal(d.sucesso.value, false)
  assert.equal(d.salvando.value, false)
  assert.match(d.erro.value, /remover/)
})
