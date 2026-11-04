import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createSSRApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

const source = readFileSync(new URL('../src/components/app/BaseSelect.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const compiled = compileScript(descriptor, {
  id: 'base-select-test', inlineTemplate: true, templateOptions: { ssr: true },
}).content.replace(/from ["'](vue(?:\/server-renderer)?)["']/g,
  (_, module) => `from ${JSON.stringify(import.meta.resolve(module))}`)
const { default: BaseSelect } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

async function render(props, valid = true) {
  let validation
  const app = createSSRApp(BaseSelect, { label: 'Regional*', ...props })
  app.component('v-input', {
    props: ['modelValue', 'rules', 'hint', 'disabled'],
    setup(props, { slots }) {
      validation = props
      return () => h('div', slots.default({ id: ref('regional'), messagesId: ref('regional-messages'), isValid: ref(valid) }))
    },
  })
  return { html: await renderToString(app), validation }
}

test('regional numérica, rótulo acessível e regras encaminhadas ao formulário', async () => {
  const required = (value) => !!value || 'Regional é obrigatória'
  const { html, validation } = await render({
    modelValue: 2, items: [{ id: 1, nome: 'Joinville' }, { id: 2, nome: 'Florianópolis' }],
    itemTitle: 'nome', itemValue: 'id', required: true, rules: [required],
  })
  assert.match(html, /<label for="regional">Regional\*<\/label>/)
  assert.match(html, /<input[^>]*aria-describedby="regional-messages"/)
  assert.match(html, /<input[^>]*required/)
  assert.match(html, /<input[^>]*value="Florianópolis"/)
  assert.equal(validation.modelValue, 2)
  assert.equal(validation.rules[0], required)
})

test('opções de perfil preservam o valor enviado à API', async () => {
  const { html } = await render({
    label: 'Perfil*', modelValue: 'GESTOR_FROTA',
    items: [{ title: 'Gestor de frota', value: 'GESTOR_FROTA' }],
  })
  assert.match(html, /<input[^>]*value="Gestor de frota"/)
})

test('perfil bloqueado, carregamento ou desabilitado impedem alterações no combobox', async () => {
  for (const flag of ['readonly', 'loading', 'disabled']) {
    const { html, validation } = await render({ [flag]: true })
    assert.match(html, /<input[^>]*disabled/, flag)
    assert.equal(validation.disabled, true, flag)
  }
})

test('carregamento e campo vazio orientam antes de abrir as opções', async () => {
  assert.match((await render({ loading: true })).html, /placeholder="Carregando opções\.\.\."/)
  assert.match((await render({ placeholder: 'Selecione uma regional' })).html, /placeholder="Selecione uma regional"/)
  const { html } = await render({})
  assert.match(html, /role="combobox"/)
  assert.match(html, /aria-expanded="false"/)
})

test('falha de validação é sinalizada no campo', async () => {
  assert.match((await render({}, false)).html, /aria-invalid="true"/)
})

const script = descriptor.scriptSetup.content.replace(/^import .*$/gm, '')
function controle(overrides = {}) {
  const props = {
    items: [{ id: 1, nome: 'Joinville' }, { id: 2, nome: 'Florianópolis' }],
    itemTitle: 'nome', itemValue: 'id', ...overrides,
  }
  const model = { value: 2 }
  const context = {
    defineProps: () => props, defineModel: () => model,
    computed: fn => ({ get value() { return fn() } }), ref: value => ({ value }),
    watch() {}, nextTick: fn => fn(),
  }
  runInNewContext(`${script}\nglobalThis.f = { abrir, fechar, alternar, aoDigitar, selecionar, mover, confirmar, aoSair, filtrados, aberto, busca, indiceAtivo, lista, tituloSelecionado }`, context)
  return { ...context.f, model, props }
}

test('busca ignora acentos e maiúsculas; texto livre não vira um valor válido', () => {
  const f = controle()
  f.abrir()
  assert.equal(f.filtrados.value.length, 2)
  f.aoDigitar({ target: { value: 'FLORIANOPOLIS' } })
  assert.equal(f.model.value, null)
  assert.equal(f.filtrados.value.length, 1)
  assert.equal(f.filtrados.value[0].id, 2)
  f.confirmar()
  assert.equal(f.model.value, 2)
  assert.equal(typeof f.model.value, 'number')
  assert.equal(f.tituloSelecionado.value, 'Florianópolis')
  assert.equal(f.aberto.value, false)
})

test('setas e Enter selecionam; Escape e saída do campo fecham a lista', () => {
  const f = controle()
  let rolou = false
  f.lista.value = { children: [{ scrollIntoView() { rolou = true } }] }
  f.mover(1)
  assert.equal(f.indiceAtivo.value, 0)
  assert.equal(rolou, true)
  f.confirmar()
  assert.equal(f.model.value, 1)
  f.mover(-1)
  assert.equal(f.indiceAtivo.value, 1)
  f.fechar()
  assert.equal(f.model.value, 1)
  f.abrir()
  f.aoSair({ currentTarget: { contains: () => false }, relatedTarget: null })
  assert.equal(f.aberto.value, false)
})

test('lista sem resultados e itens removidos não confirmam uma seleção inexistente', () => {
  const f = controle()
  f.aoDigitar({ target: { value: 'inexistente' } })
  assert.equal(f.filtrados.value.length, 0)
  f.mover(1)
  f.confirmar()
  assert.equal(f.model.value, null)
  f.indiceAtivo.value = 9
  f.confirmar()
  assert.equal(f.model.value, null)
})

test('campo bloqueado não abre nem permite trocar o valor', () => {
  for (const flag of ['readonly', 'loading', 'disabled']) {
    const f = controle({ [flag]: true })
    f.abrir()
    f.alternar()
    f.aoDigitar({ target: { value: 'Joinville' } })
    f.selecionar(f.props.items[0])
    assert.equal(f.aberto.value, false)
    assert.equal(f.model.value, 2)
  }
})

test('perfil mantém o valor da API e a lista é renderizada no fluxo do formulário', () => {
  const f = controle({ items: [{ title: 'Gestor de frota', value: 'GESTOR_FROTA' }], itemTitle: 'title', itemValue: 'value' })
  f.aoDigitar({ target: { value: 'Gestor' } })
  f.confirmar()
  assert.equal(f.model.value, 'GESTOR_FROTA')
  assert.doesNotMatch(source, /<Teleport|<v-menu|position:\s*(absolute|fixed)/i)
  assert.match(source, /@keydown.esc.prevent.stop="fechar"/)
})
