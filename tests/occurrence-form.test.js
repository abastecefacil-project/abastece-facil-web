import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/components/user/OccurrenceForm.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')

function formulario(overrides = {}) {
  let enviado
  const context = {
    ref: (value) => ({ value }), reactive: (value) => value, onMounted() {},
    getAvailableCars: async () => ({ data: [{ id: 1, model: 'Civic', licensePlate: 'ABC1234' }] }),
    getUsuarioAutenticado: async () => ({ name: 'Maria da Silva com nome completo' }),
    createOccurrences: async (body) => { enviado = body },
    ...overrides,
  }
  runInNewContext(`${script}\nglobalThis.f = { loadData, form, vehicles, userName, loadingData, dataError, formRef, handleSubmit, handleClear, dateValue, successDialog }`, context)
  context.f.formRef.value = { validate: async () => ({ valid: true }), resetValidation() {} }
  return { ...context.f, enviado: () => enviado }
}

test('seleção mostra modelo e placa e carrega o nome completo do usuário', async () => {
  const f = formulario()
  await f.loadData()
  assert.equal(f.vehicles.value[0].label, 'Civic — ABC1234')
  assert.equal(f.vehicles.value[0].licensePlate, 'ABC1234')
  assert.equal(f.userName.value, 'Maria da Silva com nome completo')
  assert.match(source, /<v-autocomplete/)
  assert.match(source, /:model-value="userName"\s+readonly/)
})

test('envia veículo selecionado e nome autenticado; limpar preserva o nome', async () => {
  const f = formulario()
  await f.loadData()
  Object.assign(f.form, { licensePlate: 'ABC1234', title: 'Outro', customTitle: 'Pneu furado', date: '26/10/2026' })
  await f.handleSubmit()
  assert.equal(f.enviado().licensePlate, 'ABC1234')
  assert.equal(f.enviado().userName, 'Maria da Silva com nome completo')
  assert.equal(f.enviado().occurrenceDate, '2026-10-26')
  assert.equal(f.enviado().title, 'Pneu furado')
  assert.equal(f.form.licensePlate, '')
  assert.equal(f.userName.value, 'Maria da Silva com nome completo')
  assert.equal(f.successDialog.value, true)
})

test('falha no carregamento impede envio e permite tentar novamente', async () => {
  let falhar = true
  const f = formulario({ getAvailableCars: async () => {
    if (falhar) throw new Error('Sem conexão')
    return { data: [] }
  } })
  await f.loadData()
  assert.ok(f.dataError.value)
  assert.equal(f.loadingData.value, false)
  await f.handleSubmit()
  assert.equal(f.enviado(), undefined)
  falhar = false
  await f.loadData()
  assert.equal(f.dataError.value, '')
  assert.equal(f.vehicles.value.length, 0)
})

test('não envia enquanto carrega os dados ou quando o usuário está sem nome', async () => {
  const f = formulario({ getUsuarioAutenticado: async () => null })
  await f.handleSubmit()
  assert.equal(f.enviado(), undefined)
  await f.loadData()
  assert.ok(f.dataError.value)
  await f.handleSubmit()
  assert.equal(f.enviado(), undefined)
})
