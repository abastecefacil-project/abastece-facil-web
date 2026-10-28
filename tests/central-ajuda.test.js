import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { ID_CONTATOS_AJUDA, SECOES_AJUDA, filtrarPerguntas } from '../src/utils/ajuda.js'

const ler = (caminho) => readFileSync(new URL(`../src/${caminho}`, import.meta.url), 'utf8')

const ARQUIVOS = [
  'views/user/HelpCenter.vue',
  'components/user/AbastecimentoGuide.vue',
  'components/user/SeguroInfo.vue',
  'components/user/FaqItem.vue',
]

const PERGUNTAS = [
  { id: 1, question: 'Posso usar qualquer tipo de combustível?', answer: 'Sempre abasteça com etanol/álcool.' },
  { id: 2, question: 'Qual o limite de quilometragem para o guincho?', answer: 'O guincho é ilimitado.' },
]

test('busca vazia ou limpa mostra todas as perguntas', () => {
  for (const termo of ['', null, undefined]) {
    assert.deepEqual(filtrarPerguntas(PERGUNTAS, termo), PERGUNTAS, `termo ${String(termo)}`)
  }
})

test('busca compara com a pergunta e com a resposta, sem diferenciar maiúsculas', () => {
  assert.deepEqual(filtrarPerguntas(PERGUNTAS, 'COMBUSTÍVEL').map((p) => p.id), [1])
  assert.deepEqual(filtrarPerguntas(PERGUNTAS, 'etanol').map((p) => p.id), [1])
  assert.deepEqual(filtrarPerguntas(PERGUNTAS, 'Guincho').map((p) => p.id), [2])
})

test('busca sem correspondência devolve lista vazia', () => {
  assert.deepEqual(filtrarPerguntas(PERGUNTAS, 'reembolso de pedágio'), [])
})

test('seções da Central têm ids únicos e distintos do card de contatos', () => {
  const ids = SECOES_AJUDA.map((secao) => secao.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(!ids.includes(ID_CONTATOS_AJUDA))
  assert.deepEqual(
    SECOES_AJUDA.map((secao) => secao.titulo),
    ['Abastecimento', 'Seguro frota própria', 'Perguntas frequentes'],
  )
})

test('a view usa a lista única de seções para âncoras e cabeçalhos', () => {
  const view = ler('views/user/HelpCenter.vue')
  assert.match(view, /v-for="secao in SECOES_AJUDA"/)
  assert.match(view, /const \[abastecimento, seguro, perguntas\] = SECOES_AJUDA/)
  for (const nome of ['abastecimento', 'seguro', 'perguntas']) {
    assert.match(view, new RegExp(`<section :id="${nome}\\.id"`), `seção ${nome}`)
  }
  assert.match(view, /:id="ID_CONTATOS_AJUDA"/)
})

test('nenhuma cor literal na Central de Ajuda', () => {
  for (const arquivo of ARQUIVOS) {
    const fonte = ler(arquivo)
    assert.doesNotMatch(fonte, /#[0-9a-fA-F]{3,8}\b/, `hex em ${arquivo}`)
    assert.doesNotMatch(fonte, /\brgba?\(/, `rgb em ${arquivo}`)
    assert.doesNotMatch(fonte, /gradient\(/, `gradiente em ${arquivo}`)
    assert.doesNotMatch(fonte, /box-shadow\s*:/, `sombra em ${arquivo}`)
  }
})

test('FAQ sem elevation', () => {
  const faq = ler('components/user/FaqItem.vue')
  for (const [, valor] of faq.matchAll(/elevation="([^"]*)"/g)) {
    assert.equal(valor, '0')
  }
})

test('o telefone da assistência vem de config/contatosSeguro.js', () => {
  const seguro = ler('components/user/SeguroInfo.vue')
  assert.match(seguro, /:href="ASSISTENCIA_24H\.href"/)
  assert.match(seguro, /\{\{ ASSISTENCIA_24H\.telefone \}\}/)
  assert.doesNotMatch(seguro, /0800[\s\d]{6,}/)
})

test('o atalho do mapa é um link de rota', () => {
  const guia = ler('components/user/AbastecimentoGuide.vue')
  assert.match(guia, /:to="\{ name: 'MapUser' \}"/)
})
