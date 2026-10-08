import assert from 'node:assert/strict'
import { test } from 'node:test'
import { iconePerfil, rotuloCurtoPerfil, rotuloPerfil } from '../src/utils/perfil.js'

test('rótulo curto do cabeçalho reflete o perfil', () => {
  assert.equal(rotuloCurtoPerfil('ADMINISTRADOR'), 'Admin')
  assert.equal(rotuloCurtoPerfil('GESTOR_FROTA'), 'Gestor')
  assert.equal(rotuloCurtoPerfil('COLABORADOR'), 'Colaborador')
})

test('rótulo completo do formulário de usuário', () => {
  assert.equal(rotuloPerfil('ADMINISTRADOR'), 'Administrador')
  assert.equal(rotuloPerfil('GESTOR_FROTA'), 'Gestor de Frota')
  assert.equal(rotuloPerfil('COLABORADOR'), 'Colaborador')
})

test('ícone por perfil', () => {
  assert.equal(iconePerfil('ADMINISTRADOR'), 'mdi-account-cog')
  assert.equal(iconePerfil('GESTOR_FROTA'), 'mdi-account-tie')
  assert.equal(iconePerfil('COLABORADOR'), 'mdi-account')
})

test('perfil nulo ou desconhecido não tem rótulo nem ícone, nunca "Admin"', () => {
  for (const perfil of [null, undefined, '', 'admin', 'SUPERUSUARIO', 'toString', '__proto__']) {
    assert.equal(rotuloCurtoPerfil(perfil), null, `rótulo curto de ${perfil}`)
    assert.equal(rotuloPerfil(perfil), null, `rótulo completo de ${perfil}`)
    assert.equal(iconePerfil(perfil), null, `ícone de ${perfil}`)
  }
})
