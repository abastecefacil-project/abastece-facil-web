import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const ref = (value) => ({ value })
const computed = (fn) => ({ get value() { return fn() } })

function script(caminho) {
  return readFileSync(new URL(caminho, import.meta.url), 'utf8')
    .match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
}

function formulario({ autenticado = { id: 1, regional: { id: 1, nome: 'Joinville' } }, perfil = 'ADMINISTRADOR', user = null, atualizar = async () => ({ data: {} }), cadastrar = async () => ({ data: {} }) } = {}) {
  const eventos = []
  let aoAbrir
  const context = {
    ref, computed,
    defineProps: () => ({ modelValue: true, user }),
    defineEmits: () => (...args) => eventos.push(args),
    useAuthStore: () => ({ perfil }),
    watch: (_, callback) => { aoAbrir = callback },
    createUser: cadastrar, updateUser: atualizar,
    getRegionais: async () => ({ data: { content: [{ id: 1, nome: 'Joinville', ativo: true }, { id: 2, nome: 'Florianópolis', ativo: true }] } }),
    getUsuarioAutenticado: async () => autenticado,
  }
  runInNewContext(`${script('../src/components/admin/UserDialog.vue')}
    globalThis.formulario = { handleSave, form, localUser, successDialog, errorDialog, mensagemErro, isLoading, camposDePerfilObrigatorios, regionalTravada, regionaisDisponiveis, carregarDados, perfilTravado }`, context)
  aoAbrir(true)
  context.formulario.form.value = { validate: async () => ({ valid: true }) }
  return { ...context.formulario, eventos }
}

test('administrador edita todos os campos do cadastro sem enviar senha', async () => {
  let enviado
  const f = formulario({
    user: { id: 7, name: ' Antigo ', email: 'antigo@fiesc.org.br', perfil: 'COLABORADOR', regional: { id: 1, nome: 'Joinville' }, telefone: '47999998888', matricula: '1234' },
    atualizar: async (id, body) => { enviado = { id, ...body }; return { data: { id, ...body } } },
    cadastrar: () => { throw new Error('Edição não pode cadastrar') },
  })
  assert.equal(f.localUser.value.regionalId, 1)
  f.localUser.value.name = ' Nome corrigido '
  f.localUser.value.regionalId = 2
  assert.equal(f.localUser.value.telefone, '47999998888')
  assert.equal(f.localUser.value.matricula, '1234')
  f.localUser.value.telefone = '(48) 99999-8888'
  f.localUser.value.matricula = '5678'
  f.localUser.value.perfil = 'GESTOR_FROTA'
  await f.handleSave()
  assert.equal(JSON.stringify(enviado), JSON.stringify({ id: 7, name: 'Nome corrigido', email: 'antigo@fiesc.org.br', telefone: '(48) 99999-8888', matricula: '5678', perfil: 'GESTOR_FROTA', regionalId: 2 }))
  assert.equal(f.successDialog.value, true)
  assert.equal(f.eventos[0][0], 'save')
})

test('gestor visualiza regional travada e não a envia na edição', async () => {
  let enviado
  const f = formulario({ perfil: 'GESTOR_FROTA',
    user: { id: 7, name: 'Nome', email: 'nome@fiesc.org.br', perfil: 'COLABORADOR', regional: { id: 1, nome: 'Joinville' } },
    atualizar: async (_, body) => { enviado = body; return { data: body } },
  })
  assert.equal(f.regionalTravada.value, true)
  assert.equal(f.regionaisDisponiveis.value[0].title, 'Joinville')
  Object.assign(f.localUser.value, { regionalId: 2, perfil: 'ADMINISTRADOR', telefone: '47999998888', matricula: '1234' })
  await f.handleSave()
  for (const campo of ['regionalId', 'perfil', 'telefone', 'matricula']) assert.equal(campo in enviado, false)
})

test('administrador não exibe campo de regional nem envia vínculo no cadastro', async () => {
  let enviado
  const f = formulario({ cadastrar: async (body) => { enviado = body; return { data: body } } })
  Object.assign(f.localUser.value, { name: 'Admin', email: 'admin@fiesc.org.br', perfil: 'ADMINISTRADOR', regionalId: 1 })
  assert.equal(f.camposDePerfilObrigatorios.value, false)
  await f.handleSave()
  assert.equal(enviado.regionalId, null)
})

test('editar administrador não envia regional', async () => {
  let enviado
  const f = formulario({ user: { id: 7, name: 'Admin', email: 'admin@fiesc.org.br', perfil: 'ADMINISTRADOR' },
    atualizar: async (_, body) => { enviado = body; return { data: body } },
  })
  await f.handleSave()
  assert.equal('regionalId' in enviado, false)
  assert.equal(f.camposDePerfilObrigatorios.value, false)
})

test('promoção a administrador omite a regional anterior', async () => {
  let enviado
  const f = formulario({ user: { id: 7, name: 'Nome', email: 'nome@fiesc.org.br', perfil: 'GESTOR_FROTA', regional: { id: 1 } },
    atualizar: async (_, body) => { enviado = body; return { data: body } },
  })
  f.localUser.value.perfil = 'ADMINISTRADOR'
  await f.handleSave()
  assert.equal(enviado.perfil, 'ADMINISTRADOR')
  assert.equal('regionalId' in enviado, false)
})

test('próprio perfil do administrador fica travado e regionais são carregadas ao editar admin', async () => {
  const f = formulario({ user: { id: 1, name: 'Admin', email: 'admin@fiesc.org.br', perfil: 'ADMINISTRADOR' } })
  await f.carregarDados()
  assert.equal(f.perfilTravado.value, true)
  assert.equal(f.regionaisDisponiveis.value.length, 2)
})

test('cadastro continua enviando dados de perfil e regional', async () => {
  let enviado
  const f = formulario({ cadastrar: async (body) => { enviado = body; return { data: { id: 8 } } } })
  Object.assign(f.localUser.value, { name: 'Novo', email: 'novo@fiesc.org.br', regionalId: 1, matricula: '1234' })
  await f.handleSave()
  assert.equal(enviado.perfil, 'COLABORADOR')
  assert.equal(enviado.regionalId, 1)
  assert.equal(enviado.matricula, '1234')
})

test('falha na edição preserva formulário aberto e exibe mensagem da API', async () => {
  const f = formulario({ user: { id: 7, name: 'Nome', email: 'nome@fiesc.org.br' },
    atualizar: async () => { throw { response: { data: { message: 'E-mail já cadastrado' } } } },
  })
  await f.handleSave()
  assert.equal(f.mensagemErro.value, 'E-mail já cadastrado')
  assert.equal(f.errorDialog.value, true)
  assert.equal(f.isLoading.value, false)
  assert.equal(f.eventos.length, 0)
})

function pagina(overrides = {}) {
  let logouts = 0
  const context = {
    ref, computed, watch() {}, watchDebounced() {}, onMounted() {},
    useAuthStore: () => ({ logout: async () => { logouts++ } }), useRouter: () => ({}),
    getUsers: async () => ({ data: { content: [], number: 0, totalPages: 0 } }),
    ...overrides,
  }
  runInNewContext(`${script('../src/views/admin/UserManagement.vue')}
    globalThis.pagina = { users, usuarioLogado, podeEditarUsuario, salvarUsuario, podeAlterarStatus,
      abrirModalStatus, confirmarStatus, modalStatus, alterandoStatus, feedbackDialog, avisoStatus,
      statusFilter, loadingUsers }`, context)
  return { ...context.pagina, logouts: () => logouts }
}

test('listagem preserva telefone e matrícula ao reabrir edição e salvar novamente', async () => {
  const usuario = { id: 7, name: 'Gestora', email: 'gestora@fiesc.org.br',
    telefone: '47999998888', matricula: '1234', perfil: 'GESTOR_FROTA',
    regional: { id: 1, nome: 'Joinville' }, isActive: true, senhaDefinida: true }
  const p = pagina({ getUsers: async () => ({ data: { content: [usuario], number: 0, totalPages: 1 } }) })
  await p.loadingUsers()
  assert.equal(p.users.value[0].telefone, usuario.telefone)
  assert.equal(p.users.value[0].matricula, usuario.matricula)
  let enviado
  const f = formulario({ user: p.users.value[0],
    atualizar: async (_, body) => { enviado = body; return { data: body } },
  })
  assert.equal(f.localUser.value.telefone, usuario.telefone)
  assert.equal(f.localUser.value.matricula, usuario.matricula)
  await f.handleSave()
  assert.equal(enviado.telefone, usuario.telefone)
  assert.equal(enviado.matricula, usuario.matricula)
})

test('botão de edição acompanha permissões existentes e não aparece para inativos', () => {
  const p = pagina()
  const colaborador = { id: 7, perfil: 'COLABORADOR', regional: { id: 1 }, isActive: true }
  p.usuarioLogado.value = { id: 1, perfil: 'ADMINISTRADOR' }
  assert.equal(p.podeEditarUsuario(colaborador), true)
  assert.equal(p.podeEditarUsuario({ ...colaborador, isActive: false }), false)
  p.usuarioLogado.value = { id: 2, perfil: 'GESTOR_FROTA', regional: { id: 1 } }
  assert.equal(p.podeEditarUsuario(colaborador), true)
  assert.equal(p.podeEditarUsuario({ ...colaborador, regional: { id: 2 } }), false)
  assert.equal(p.podeEditarUsuario({ ...colaborador, perfil: 'GESTOR_FROTA' }), false)
  assert.equal(p.podeEditarUsuario({ ...colaborador, id: 2, perfil: 'GESTOR_FROTA' }), true)
  p.usuarioLogado.value = null
  assert.equal(p.podeEditarUsuario(colaborador), false)
})

test('alterar o próprio e-mail encerra sessão para não continuar usando JWT com e-mail antigo', async () => {
  const p = pagina()
  p.usuarioLogado.value = { id: 1, email: 'antigo@fiesc.org.br', perfil: 'ADMINISTRADOR' }
  await p.salvarUsuario({ id: 1, email: 'novo@fiesc.org.br' })
  assert.equal(p.logouts(), 1)
})

test('somente administrador altera status e não pode alterar a própria conta', () => {
  const p = pagina()
  const alvo = { id: 7, isActive: true }
  p.usuarioLogado.value = { id: 1, perfil: 'ADMINISTRADOR' }
  assert.equal(p.podeAlterarStatus(alvo), true)
  assert.equal(p.podeAlterarStatus({ id: 1 }), false)
  p.usuarioLogado.value = { id: 2, perfil: 'GESTOR_FROTA' }
  assert.equal(p.podeAlterarStatus(alvo), false)
  p.abrirModalStatus(alvo)
  assert.equal(p.modalStatus.value, false)
})

test('confirmação inativa ativos e reativa inativos com atualização da lista', async () => {
  const chamadas = []
  const p = pagina({
    inativarUser: async (id) => chamadas.push(['inativar', id]),
    reativarUser: async (id) => chamadas.push(['reativar', id]),
  })
  p.usuarioLogado.value = { id: 1, perfil: 'ADMINISTRADOR' }
  p.abrirModalStatus({ id: 7, name: 'Maria', isActive: true })
  await p.confirmarStatus()
  assert.equal(p.modalStatus.value, false)
  assert.equal(p.avisoStatus.value.nome, 'Maria')
  assert.equal(p.avisoStatus.value.ativo, false)
  p.abrirModalStatus({ id: 7, name: 'Maria', isActive: false })
  await p.confirmarStatus()
  assert.equal(p.avisoStatus.value.ativo, true)
  assert.deepEqual(chamadas, [['inativar', 7], ['reativar', 7]])
  assert.equal(p.alterandoStatus.value, false)
})

test('filtro de status consulta a lista correta sem misturar ativos e inativos', async () => {
  const filtros = []
  const p = pagina({ getUsers: async (page, name, active) => {
    filtros.push(active)
    return { data: { content: [], number: page, totalPages: 0 } }
  } })
  assert.equal(p.statusFilter.value, 'ativo')
  await p.loadingUsers()
  p.statusFilter.value = 'inativo'
  await p.loadingUsers()
  assert.deepEqual(filtros, [true, false])
})

test('falha na alteração de status mantém confirmação aberta e exibe feedback', async () => {
  const p = pagina({ inativarUser: async () => { throw new Error('offline') } })
  p.usuarioLogado.value = { id: 1, perfil: 'ADMINISTRADOR' }
  p.abrirModalStatus({ id: 7, isActive: true })
  await p.confirmarStatus()
  assert.equal(p.feedbackDialog.value, true)
  assert.equal(p.modalStatus.value, true)
  assert.equal(p.alterandoStatus.value, false)
})
