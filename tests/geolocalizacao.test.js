import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ESTADO_LOCALIZACAO as E,
  avisoLocalizacao,
  estadoAposErro,
  estadoAposPosicao,
  estadoInicialLocalizacao,
  localizacaoDisponivel,
  motivoLocalizacaoIndisponivel,
  origemNavegacao,
  posicaoValida,
} from '../src/utils/geolocalizacao.js'

const JOINVILLE = { lat: -26.3045, lon: -48.8487 }

test('estado inicial depende do suporte do navegador', () => {
  assert.equal(estadoInicialLocalizacao(true), E.AGUARDANDO)
  assert.equal(estadoInicialLocalizacao(false), E.SEM_SUPORTE)
})

test('posição válida exige latitude e longitude finitas', () => {
  assert.equal(posicaoValida(JOINVILLE), true)
  assert.equal(posicaoValida({ lat: 0, lon: 0 }), true)
  for (const posicao of [{ lat: null, lon: null }, { lat: -26.3, lon: null }, { lat: NaN, lon: 1 }, {}, null, undefined]) {
    assert.equal(posicaoValida(posicao), false, JSON.stringify(posicao))
  }
})

test('primeira posição concede a localização', () => {
  assert.equal(estadoAposPosicao(E.AGUARDANDO, JOINVILLE), E.CONCEDIDA)
})

test('posição inválida não muda o estado', () => {
  assert.equal(estadoAposPosicao(E.AGUARDANDO, { lat: null, lon: null }), E.AGUARDANDO)
  assert.equal(estadoAposPosicao(E.TEMPO_ESGOTADO, { lat: NaN, lon: NaN }), E.TEMPO_ESGOTADO)
})

test('erros antes da primeira posição', () => {
  assert.equal(estadoAposErro(E.AGUARDANDO, 1), E.NEGADA)
  assert.equal(estadoAposErro(E.AGUARDANDO, 2), E.INDISPONIVEL)
  assert.equal(estadoAposErro(E.AGUARDANDO, 3), E.TEMPO_ESGOTADO)
  assert.equal(estadoAposErro(E.AGUARDANDO, 99), E.AGUARDANDO)
})

test('posição que chega depois de timeout ou indisponibilidade concede', () => {
  assert.equal(estadoAposPosicao(E.TEMPO_ESGOTADO, JOINVILLE), E.CONCEDIDA)
  assert.equal(estadoAposPosicao(E.INDISPONIVEL, JOINVILLE), E.CONCEDIDA)
})

test('com posição obtida, timeout e falha momentânea mantêm a localização', () => {
  assert.equal(estadoAposErro(E.CONCEDIDA, 2), E.CONCEDIDA)
  assert.equal(estadoAposErro(E.CONCEDIDA, 3), E.CONCEDIDA)
})

test('permissão retirada depois de concedida nega', () => {
  assert.equal(estadoAposErro(E.CONCEDIDA, 1), E.NEGADA)
})

test('só a localização concedida fica disponível', () => {
  assert.equal(localizacaoDisponivel(E.CONCEDIDA), true)
  for (const estado of [E.AGUARDANDO, E.NEGADA, E.INDISPONIVEL, E.TEMPO_ESGOTADO, E.SEM_SUPORTE]) {
    assert.equal(localizacaoDisponivel(estado), false, estado)
  }
})

test('aviso aparece só quando a localização não virá', () => {
  assert.equal(avisoLocalizacao(E.AGUARDANDO), null)
  assert.equal(avisoLocalizacao(E.CONCEDIDA), null)
  for (const estado of [E.NEGADA, E.INDISPONIVEL, E.TEMPO_ESGOTADO, E.SEM_SUPORTE]) {
    const aviso = avisoLocalizacao(estado)
    assert.match(aviso, /rota a partir de você fica indisponível/, estado)
    assert.match(aviso, /trajeto por endereço/, estado)
  }
  assert.match(avisoLocalizacao(E.NEGADA), /negado/)
})

test('motivo do botão desabilitado', () => {
  assert.equal(motivoLocalizacaoIndisponivel(E.CONCEDIDA), '')
  assert.equal(motivoLocalizacaoIndisponivel(E.AGUARDANDO), 'Obtendo sua localização…')
  assert.match(motivoLocalizacaoIndisponivel(E.NEGADA), /negado/)
  assert.match(motivoLocalizacaoIndisponivel(E.TEMPO_ESGOTADO), /Não foi possível/)
})

test('origem do link de navegação', () => {
  assert.equal(origemNavegacao(JOINVILLE), '-26.3045,-48.8487')
  assert.equal(origemNavegacao({ lat: null, lon: null }), null)
  assert.equal(origemNavegacao(undefined), null)
})
