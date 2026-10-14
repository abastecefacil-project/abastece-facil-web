import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  contarGeocodificacoes,
  descreverDuracaoAproximada,
  descreverTempoEstimado,
} from '../src/utils/importacaoPostos.js'

test('tempo estimado usa 1,6 s por posto, medido na carga real', () => {
  // 1.128 × 1,6 s = 1.804,8 s → 30,08 min, arredondado para cima.
  assert.equal(
    descreverTempoEstimado(1128),
    'Tempo estimado: cerca de 31 minutos (1.128 postos serão localizados no mapa)',
  )
  assert.equal(
    descreverTempoEstimado(1),
    'Tempo estimado: menos de 1 minuto (1 posto será localizado no mapa)',
  )
  assert.equal(
    descreverTempoEstimado(0),
    'Tempo estimado: menos de 1 minuto (nenhum posto precisa ser localizado no mapa)',
  )
})

test('duração aproximada tem corte em 30 s e arredonda minutos para cima', () => {
  assert.equal(descreverDuracaoAproximada(29), 'menos de 1 minuto')
  assert.equal(descreverDuracaoAproximada(30), 'cerca de 1 minuto')
  assert.equal(descreverDuracaoAproximada(60), 'cerca de 1 minuto')
  assert.equal(descreverDuracaoAproximada(61), 'cerca de 2 minutos')
})

test('geocodificação conta todo novo e só os alterados com endereço mudado', () => {
  const previa = {
    inserir: [{}, {}, {}],
    atualizar: [{ requerGeocodificacao: true }, { requerGeocodificacao: false }],
    reativar: [{ requerGeocodificacao: true }],
  }
  assert.equal(contarGeocodificacoes(previa), 5)
  assert.equal(contarGeocodificacoes(null), 0)
})
