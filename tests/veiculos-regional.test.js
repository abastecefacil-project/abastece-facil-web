import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const fonte = readFileSync(new URL('../src/components/admin/VehicleDialog.vue', import.meta.url), 'utf8')
const script = fonte.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')

function formulario(perfil, regional = { id: 1, nome: 'Joinville' }, overrides = {}, veiculo = {}) {
  let enviado
  const props = { modelValue: false, isEditing: false, veiculo: { plate: 'ABC-1234', model: 'Civic', regionalId: 2, ...veiculo } }
  const contexto = {
    ref: (value) => ({ value }), computed: (fn) => ({ get value() { return fn() } }),
    watch: (origem, callback, options) => { if (options?.immediate) callback(origem()) },
    useAuthStore: () => ({ perfil }),
    defineProps: () => props, defineEmits: () => () => {},
    getUsuarioAutenticado: async () => ({ perfil, regional }),
    getRegionais: async () => ({ data: { content: [{ id: 2, nome: 'Outra', ativo: true }] } }),
    createCar: async (body) => { enviado = body; return { data: { id: 1, ...body } } },
    updateCar: async (id, body) => { enviado = body; return { data: { id, ...body } } },
    ...overrides,
  }
  runInNewContext(`${script}\nglobalThis.f = { carregarDados, handleSave, localVeiculo, form, erroDados, carregandoDados, errorDialog, mensagemErro, regionais }`, contexto)
  contexto.f.form.value = { validate: async () => ({ valid: true }) }
  return { ...contexto.f, props, enviado: () => enviado }
}

test('administrador envia a regional selecionada no cadastro e na edição', async () => {
  const f = formulario('ADMINISTRADOR', null)
  await f.carregarDados()
  await f.handleSave()
  assert.equal(f.enviado().regionalId, 2)
  assert.equal(f.enviado().licensePlate, 'ABC1234')
  f.props.isEditing = true
  await f.handleSave()
  assert.equal(f.enviado().regionalId, 2)
})

test('gestor mantém a regional sob controle da API mesmo se o modelo local for alterado', async () => {
  const f = formulario('GESTOR_FROTA')
  await f.carregarDados()
  f.localVeiculo.value.regionalId = 999
  await f.handleSave()
  assert.equal(Object.hasOwn(f.enviado(), 'regionalId'), false)
})

test('gestor sem regional não consegue enviar e pode tentar carregar novamente', async () => {
  const f = formulario('GESTOR_FROTA', null)
  await f.carregarDados()
  assert.match(f.erroDados.value, /não possui regional/)
  await f.handleSave()
  assert.equal(f.enviado(), undefined)
})

test('rota de consulta do gestor reutiliza a tela do colaborador e gestão exige administrador', () => {
  const rotas = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(rotas, /name: 'StationAdmin',\s*meta: \{ perfis: \['ADMINISTRADOR'\] \}/)
  assert.match(rotas, /name: 'StationConsultaGestor',[\s\S]*?perfis: \['GESTOR_FROTA'\][\s\S]*?import\('\.\.\/views\/user\/GasStations.vue'\)/)
})

test('falha de carregamento impede envio até tentar novamente', async () => {
  let falhar = true
  const f = formulario('ADMINISTRADOR', null, {
    getRegionais: async () => {
      if (falhar) throw new Error('Sem conexão')
      return { data: { content: [] } }
    },
  })
  await f.carregarDados()
  assert.ok(f.erroDados.value)
  await f.handleSave()
  assert.equal(f.enviado(), undefined)
  falhar = false
  await f.carregarDados()
  assert.equal(f.erroDados.value, '')
})

test('erro da API é exibido no modal e preserva os dados do formulário', async () => {
  const f = formulario('GESTOR_FROTA', undefined, {
    createCar: async () => { throw { response: { data: { message: 'Regional não permitida' } } } },
  })
  await f.carregarDados()
  await f.handleSave()
  assert.equal(f.errorDialog.value, true)
  assert.equal(f.mensagemErro.value, 'Regional não permitida')
  assert.equal(f.localVeiculo.value.model, 'Civic')
})

test('edição preserva o vínculo atual mesmo quando a regional não está na lista de ativas', async () => {
  const f = formulario('ADMINISTRADOR', null, {}, { regionalId: undefined, regional: { id: 9, nome: 'Regional atual' } })
  assert.equal(f.localVeiculo.value.regionalId, 9)
  await f.carregarDados()
  assert.equal(f.regionais.value.find((regional) => regional.id === 9)?.nome, 'Regional atual')
  assert.match(fonte, /regionalId: newVeiculo.regionalId \?\? newVeiculo.regional\?\.id \?\? null/)
  assert.match(fonte, /Nenhuma regional ativa disponível/)
  assert.match(fonte, /Este veículo ainda não possui regional/)
})

test('administrador carrega as regionais sem depender da consulta da própria conta', async () => {
  let consultouConta = false
  const f = formulario('ADMINISTRADOR', null, {
    getUsuarioAutenticado: async () => { consultouConta = true; throw new Error('Conta indisponível') },
  })
  await f.carregarDados()
  assert.equal(consultouConta, false)
  assert.equal(f.erroDados.value, '')
  assert.equal(f.regionais.value[0].nome, 'Outra')
  await f.handleSave()
  assert.equal(f.enviado().regionalId, 2)
})
