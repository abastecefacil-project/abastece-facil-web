import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/components/user/OccurrenceForm.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')

function formulario(overrides = {}) {
  let enviado
  const context = {
    ref: (value) => ({ value }), reactive: (value) => value, onMounted() {}, nextTick: async () => {},
    getAvailableCars: async () => ({ data: [{ id: 1, model: 'Civic', licensePlate: 'ABC1234' }] }),
    getUsuarioAutenticado: async () => ({ name: 'Maria da Silva com nome completo' }),
    createOccurrences: async (body) => { enviado = body },
    ...overrides,
  }
  runInNewContext(`${script}\nglobalThis.f = { loadData, form, vehicles, userName, loadingData, dataError, formRef, handleSubmit, handleClear, dateValue, successDialog, titleOptions, iconesTipo }`, context)
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
  assert.equal(f.form.licensePlate, null)
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

const template = source.match(/<template>([\s\S]*)<\/template>\s*<script setup>/)[1]

function hojeFormatado() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

test('nome do colaborador é só leitura: texto informativo, nenhum campo editável ligado a ele', () => {
  assert.match(template, /Registrando como:[\s\S]{0,200}\{\{\s*userName\s*\}\}/)
  // Nenhum v-model nem :model-value com userName, em qualquer componente.
  assert.doesNotMatch(template, /v-model(?:\.[a-z]+)?="userName"/)
  assert.doesNotMatch(template, /:model-value="userName"/)
  assert.doesNotMatch(template, /:value="userName"/)
  // Nenhum input, textarea, campo de texto ou select do template tem userName em atributo.
  const campos = template.match(/<(?:input|textarea|v-text-field|v-textarea|v-select|v-autocomplete|v-combobox)\b[^>]*>/g) ?? []
  assert.ok(campos.length > 0)
  for (const campo of campos) assert.doesNotMatch(campo, /userName/)
  // A única aparição de userName no template é a interpolação de exibição.
  assert.deepEqual(template.match(/userName/g), ['userName'])
})

test('data começa com hoje e o envio a converte para LocalDate', async () => {
  const f = formulario()
  assert.equal(f.form.date, hojeFormatado())
  // O Date da VM é de outro realm: instanceof falharia.
  assert.equal(f.dateValue.value.toDateString(), new Date().toDateString())
  await f.loadData()
  Object.assign(f.form, { licensePlate: 'ABC1234', title: 'Veículo Sujo Internamente' })
  await f.handleSubmit()
  const [dia, mes, ano] = hojeFormatado().split('/')
  assert.equal(f.enviado().occurrenceDate, `${ano}-${mes}-${dia}`)
})

test('tipo comum vai como está no title; payload tem só os cinco campos de sempre', async () => {
  const f = formulario()
  await f.loadData()
  Object.assign(f.form, { licensePlate: 'ABC1234', title: 'Combustível Abaixo de Meio Tanque', customTitle: 'ignorado', description: 'Tanque vazio', date: '01/02/2026' })
  await f.handleSubmit()
  assert.deepEqual(JSON.parse(JSON.stringify(f.enviado())), {
    licensePlate: 'ABC1234',
    title: 'Combustível Abaixo de Meio Tanque',
    description: 'Tanque vazio',
    userName: 'Maria da Silva com nome completo',
    occurrenceDate: '2026-02-01',
  })
})

test('cancelar limpa o formulário, volta a data para hoje e mantém o nome', async () => {
  const f = formulario()
  await f.loadData()
  Object.assign(f.form, { licensePlate: 'ABC1234', title: 'Outro', customTitle: 'Pneu', description: 'x', date: '01/01/2026' })
  f.dateValue.value = new Date(2026, 0, 1)
  f.handleClear()
  assert.deepEqual({ ...f.form }, { licensePlate: null, title: '', customTitle: '', description: '', date: hojeFormatado() })
  assert.equal(f.dateValue.value.toDateString(), new Date().toDateString())
  assert.equal(f.userName.value, 'Maria da Silva com nome completo')
})

test('tipo em chips de seleção única validados pelas mesmas regras, com ícone para cada opção', () => {
  const f = formulario()
  assert.equal(f.titleOptions.length, 5)
  for (const opcao of f.titleOptions) assert.match(f.iconesTipo[opcao], /^mdi-/)
  assert.match(template, /<v-input :model-value="form\.title" :rules="titleRules"/)
  assert.match(template, /<v-chip-group[\s\S]*?v-model="form\.title"/)
  assert.doesNotMatch(template, /<v-chip-group[^>]*\bmultiple\b/)
  // messagesId é ref dentro do slot: sem .value o atributo sai "[object Object]".
  assert.match(template, /:aria-describedby="messagesId\.value"/)
  assert.match(template, /v-if="form\.title === 'Outro'"[\s\S]*?maxlength="40"[\s\S]*?'Informe o título'/)
})

test('itens e seleção do veículo mostram a placa em PlateBadge', () => {
  assert.match(template, /<template #item=[\s\S]*?<PlateBadge :placa="item\.raw\.licensePlate"/)
  assert.match(template, /<template #selection=[\s\S]*?<PlateBadge :placa="item\.raw\.licensePlate"/)
})

test('veículo começa null, e Cancelar só reseta a validação depois do nextTick, com o modelo já limpo', async () => {
  const eventos = []
  const f = formulario({ nextTick: async () => { eventos.push('nextTick') } })
  assert.equal(f.form.licensePlate, null)
  await f.loadData()
  Object.assign(f.form, { licensePlate: 'ABC1234', title: 'Veículo Sujo Internamente', description: 'x' })
  f.formRef.value.resetValidation = () => eventos.push({ reset: { ...f.form } })
  await f.handleClear()
  assert.deepEqual(eventos, [
    'nextTick',
    { reset: { licensePlate: null, title: '', customTitle: '', description: '', date: hojeFormatado() } },
  ])
})
