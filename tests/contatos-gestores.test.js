import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { montarUrlWhatsapp, normalizarNumeroWhatsapp } from '../src/utils/whatsapp.js'

const source = readFileSync(new URL('../src/components/user/ContactSection.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')

function contatos(buscar) {
  const context = {
    ref: (value) => ({ value }), computed: (fn) => ({ get value() { return fn() } }), onMounted() {},
    getGestoresDaMinhaRegional: buscar, montarUrlWhatsapp, normalizarNumeroWhatsapp,
  }
  runInNewContext(`${script}\nglobalThis.c = { carregarGestores, contatos, carregando, erro }`, context)
  return context.c
}

test('mostra todos os gestores recebidos e monta WhatsApp pelo telefone cadastrado', async () => {
  const c = contatos(async () => [
    { nome: 'Gestora Joinville', telefone: '47999999999' },
    { nome: 'Gestor sem telefone', telefone: null },
    { nome: 'Gestor com telefone inválido', telefone: '123' },
  ])
  await c.carregarGestores()
  assert.equal(c.contatos.value.length, 3)
  assert.equal(c.contatos.value[0].nome, 'Gestora Joinville')
  assert.equal(c.contatos.value[0].url, montarUrlWhatsapp('5547999999999'))
  assert.equal(c.contatos.value[1].url, null)
  assert.equal(c.contatos.value[2].url, null)
  assert.equal(c.carregando.value, false)
  assert.equal(c.erro.value, false)
})

test('ausência de gestor mantém lista vazia sem criar contato global', async () => {
  const c = contatos(async () => [])
  await c.carregarGestores()
  assert.equal(c.contatos.value.length, 0)
  assert.equal(c.erro.value, false)
})

test('falha ao buscar permite tentar novamente', async () => {
  let falhar = true
  const c = contatos(async () => {
    if (falhar) throw new Error('Sem conexão')
    return [{ nome: 'Gestora', telefone: '47999999999' }]
  })
  await c.carregarGestores()
  assert.equal(c.erro.value, true)
  assert.equal(c.carregando.value, false)
  falhar = false
  await c.carregarGestores()
  assert.equal(c.erro.value, false)
  assert.equal(c.contatos.value.length, 1)
})
