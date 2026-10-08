import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buscarTodasAsPaginas } from '../src/utils/paginacao.js'
import { descreverQuantidadePostos } from '../src/utils/posto.js'

const pagina = (ids, totalPages) => ({ content: ids.map((id) => ({ id })), totalPages })

/**
 * buscarPagina falso: responde pelas páginas recebidas, registra cada chamada e
 * acusa se uma começar com outra ainda em voo.
 */
function servidorFalso(paginas, { falharEm } = {}) {
  const chamadas = []
  let emVoo = 0
  const buscarPagina = async (page) => {
    chamadas.push(page)
    assert.equal(emVoo, 0, `página ${page} pedida com outra ainda em voo`)
    emVoo += 1
    await new Promise((resolve) => setTimeout(resolve, 1))
    emVoo -= 1
    if (page === falharEm) throw new Error('falha de rede simulada')
    return paginas[page]
  }
  return { buscarPagina, chamadas }
}

test('uma página: uma requisição e lista completa', async () => {
  const { buscarPagina, chamadas } = servidorFalso([pagina([1, 2, 3], 1)])

  const resultado = await buscarTodasAsPaginas(buscarPagina)

  assert.deepEqual(chamadas, [0])
  assert.deepEqual(resultado.itens.map((item) => item.id), [1, 2, 3])
  assert.equal(resultado.completo, true)
})

test('várias páginas: pedidas em sequência, até totalPages', async () => {
  const { buscarPagina, chamadas } = servidorFalso([
    pagina([1, 2], 3),
    pagina([3, 4], 3),
    pagina([5], 3),
  ])

  const resultado = await buscarTodasAsPaginas(buscarPagina)

  assert.deepEqual(chamadas, [0, 1, 2])
  assert.deepEqual(resultado.itens.map((item) => item.id), [1, 2, 3, 4, 5])
  assert.equal(resultado.completo, true)
})

test('falha na segunda página: devolve a primeira, marca incompleto e para', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { buscarPagina, chamadas } = servidorFalso(
    [pagina([1, 2], 3), null, pagina([5], 3)],
    { falharEm: 1 },
  )

  const resultado = await buscarTodasAsPaginas(buscarPagina)

  assert.deepEqual(chamadas, [0, 1])
  assert.deepEqual(resultado.itens.map((item) => item.id), [1, 2])
  assert.equal(resultado.completo, false)
})

test('falha na primeira página: lista vazia e incompleta', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { buscarPagina, chamadas } = servidorFalso([], { falharEm: 0 })

  const resultado = await buscarTodasAsPaginas(buscarPagina)

  assert.deepEqual(chamadas, [0])
  assert.deepEqual(resultado.itens, [])
  assert.equal(resultado.completo, false)
})

test('base vazia: uma requisição, lista vazia e completa', async () => {
  const { buscarPagina, chamadas } = servidorFalso([pagina([], 0)])

  const resultado = await buscarTodasAsPaginas(buscarPagina)

  assert.deepEqual(chamadas, [0])
  assert.deepEqual(resultado.itens, [])
  assert.equal(resultado.completo, true)
})

test('posto empurrado entre páginas não aparece duas vezes', async () => {
  // Um posto inserido entre as duas requisições desloca o 2 para a página 1.
  const { buscarPagina } = servidorFalso([pagina([1, 2], 2), pagina([2, 3], 2)])

  const resultado = await buscarTodasAsPaginas(buscarPagina)

  assert.deepEqual(resultado.itens.map((item) => item.id), [1, 2, 3])
})

test('contador da lista de postos, com e sem busca', () => {
  assert.equal(descreverQuantidadePostos(968, false), '968 postos')
  assert.equal(descreverQuantidadePostos(1128, false), '1.128 postos')
  assert.equal(descreverQuantidadePostos(1, false), '1 posto')
  assert.equal(descreverQuantidadePostos(48, true), '48 postos encontrados')
  assert.equal(descreverQuantidadePostos(1, true), '1 posto encontrado')
  assert.equal(descreverQuantidadePostos(0, true), 'Nenhum posto encontrado')
})
