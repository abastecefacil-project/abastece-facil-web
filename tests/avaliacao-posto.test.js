import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const dados = (minhaAvaliacao = null) => ({ media: minhaAvaliacao ? 4 : null, total: minhaAvaliacao ? 1 : 0,
  minhaAvaliacao, avaliacoes: { content: [], last: true, totalPages: 1 } })

function dialogo({ consultar = async () => ({ data: dados() }), salvar, remover } = {}) {
  const vue = readFileSync(new URL('../src/components/user/AvaliacaoPostoDialog.vue', import.meta.url), 'utf8')
  const script = vue.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const eventos = []
  const context = {
    defineProps: () => ({ posto: { id: 42 } }),
    defineEmits: () => (...args) => eventos.push(args),
    ref: value => ({ value }), onMounted() {},
    getAvaliacoesPosto: consultar, salvarAvaliacaoPosto: salvar, removerAvaliacaoPosto: remover,
  }
  runInNewContext(`${script}\nglobalThis.dialogo = { carregar, salvar, remover, fechar, nota, comentario, resumo, pagina, erro, sucesso, salvando }`, context)
  return { ...context.dialogo, eventos }
}

test('restaura avaliação e salva nota e comentário sem enviar identidade', async () => {
  let enviado
  const d = dialogo({ consultar: async () => ({ data: dados({ nota: 4, comentario: 'Bom' }) }),
    salvar: async (...args) => { enviado = args; return { data: dados({ nota: 5, comentario: 'Ótimo' }) } } })
  await d.carregar()
  assert.equal(d.nota.value, 4)
  assert.equal(d.comentario.value, 'Bom')
  d.nota.value = 5
  d.comentario.value = 'Ótimo'
  await d.salvar()
  assert.deepEqual(enviado, [42, 5, 'Ótimo'])
  assert.equal(d.eventos[0][0], 'atualizar')
  assert.equal(d.eventos[0][1].postoId, 42)
  assert.ok(d.sucesso.value)
})

test('paginação preserva comentário que ainda não foi salvo', async () => {
  const paginas = []
  const d = dialogo({ consultar: async (id, page) => { paginas.push(page); return { data: dados() } } })
  await d.carregar()
  d.nota.value = 3
  d.comentario.value = 'Em edição'
  await d.carregar(1)
  assert.deepEqual(paginas, [0, 1])
  assert.equal(d.comentario.value, 'Em edição')
  assert.equal(d.nota.value, 3)
})

test('falhas não apagam a avaliação ou publicam atualização no mapa', async () => {
  const d = dialogo({ consultar: async () => ({ data: dados({ nota: 4, comentario: 'Bom' }) }),
    salvar: async () => { throw Error('offline') }, remover: async () => { throw Error('offline') } })
  await d.carregar()
  await d.salvar()
  assert.ok(d.erro.value)
  assert.equal(d.sucesso.value, '')
  await d.remover()
  assert.equal(d.nota.value, 4)
  assert.equal(d.comentario.value, 'Bom')
  assert.equal(d.eventos.length, 0)
  assert.equal(d.salvando.value, false)
})

test('remover limpa nota e comentário e atualiza resumo do mapa', async () => {
  const d = dialogo({ consultar: async () => ({ data: dados({ nota: 4, comentario: 'Bom' }) }),
    remover: async () => ({ data: dados() }) })
  await d.carregar()
  await d.remover()
  assert.equal(d.nota.value, 0)
  assert.equal(d.comentario.value, '')
  assert.equal(d.eventos[0][1].total, 0)
  assert.equal(d.eventos[0][1].media, null)
})

test('não envia nota inválida nem comentário acima do limite', async () => {
  const d = dialogo({ salvar: async () => { assert.fail('Não deveria enviar') } })
  for (const nota of [0, 6, 3.5, null]) { d.nota.value = nota; await d.salvar() }
  d.nota.value = 5
  d.comentario.value = 'x'.repeat(1001)
  await d.salvar()
  assert.equal(d.eventos.length, 0)
})
