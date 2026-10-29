import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  REGIONAL_NAO_INFORMADA,
  REGIONAL_NAO_SE_APLICA,
  apresentacaoLinhaUsuario,
  statusUsuario,
} from '../src/utils/usuarioExibicao.js'

const colaboradora = {
  id: 7,
  name: ' Mariana Prado ',
  email: 'mariana.prado@fiesc.org.br',
  perfil: 'COLABORADOR',
  regional: { id: 1, nome: 'Joinville', sigla: 'JOI' },
  isActive: true,
  senhaDefinida: true,
  conviteEnviado: null,
}

test('apresentacaoLinhaUsuario: dados da linha de um usuário ativo', () => {
  assert.deepEqual(apresentacaoLinhaUsuario(colaboradora), {
    nome: 'Mariana Prado',
    email: 'mariana.prado@fiesc.org.br',
    perfil: 'Colaborador',
    regional: 'Joinville (JOI)',
    regionalAusente: null,
    status: 'ativo',
  })
})

test('statusUsuario: derivado de isActive e senhaDefinida, inativo vence aguardando', () => {
  assert.equal(statusUsuario({ isActive: true, senhaDefinida: true }), 'ativo')
  assert.equal(statusUsuario({ isActive: true, senhaDefinida: false }), 'aguardando')
  assert.equal(statusUsuario({ isActive: false, senhaDefinida: true }), 'inativo')
  assert.equal(statusUsuario({ isActive: false, senhaDefinida: false }), 'inativo')
})

test('statusUsuario: conviteEnviado null (todo GET) não vira falha nem aguardando', () => {
  assert.equal(statusUsuario({ isActive: true, senhaDefinida: true, conviteEnviado: null }), 'ativo')
  assert.equal(apresentacaoLinhaUsuario({ ...colaboradora, conviteEnviado: false }).status, 'ativo')
})

test('apresentacaoLinhaUsuario: rótulo completo de cada perfil', () => {
  const perfil = (valor) => apresentacaoLinhaUsuario({ ...colaboradora, perfil: valor }).perfil
  assert.equal(perfil('COLABORADOR'), 'Colaborador')
  assert.equal(perfil('GESTOR_FROTA'), 'Gestor de Frota')
  assert.equal(perfil('ADMINISTRADOR'), 'Administrador')
})

test('apresentacaoLinhaUsuario: perfil desconhecido ou ausente não ganha rótulo padrão', () => {
  assert.equal(apresentacaoLinhaUsuario({ ...colaboradora, perfil: 'ROOT' }).perfil, null)
  assert.equal(apresentacaoLinhaUsuario({ ...colaboradora, perfil: undefined }).perfil, null)
})

test('apresentacaoLinhaUsuario: regional ausente diz o motivo conforme o perfil', () => {
  const admin = apresentacaoLinhaUsuario({ ...colaboradora, perfil: 'ADMINISTRADOR', regional: null })
  assert.equal(admin.regional, null)
  assert.equal(admin.regionalAusente, REGIONAL_NAO_SE_APLICA)

  const semVinculo = apresentacaoLinhaUsuario({ ...colaboradora, regional: null })
  assert.equal(semVinculo.regional, null)
  assert.equal(semVinculo.regionalAusente, REGIONAL_NAO_INFORMADA)

  const gestorSemCampo = apresentacaoLinhaUsuario({ ...colaboradora, perfil: 'GESTOR_FROTA', regional: undefined })
  assert.equal(gestorSemCampo.regionalAusente, REGIONAL_NAO_INFORMADA)
})

test('apresentacaoLinhaUsuario: regional sem sigla mostra só o nome', () => {
  const linha = apresentacaoLinhaUsuario({ ...colaboradora, regional: { id: 2, nome: 'Florianópolis' } })
  assert.equal(linha.regional, 'Florianópolis')
})

test('apresentacaoLinhaUsuario: não altera o usuário de entrada', () => {
  const copia = structuredClone(colaboradora)
  apresentacaoLinhaUsuario(colaboradora)
  assert.deepEqual(colaboradora, copia)
})
