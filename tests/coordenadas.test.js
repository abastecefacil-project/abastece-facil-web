import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  coordenadasParaEnvio,
  interpretarParCoordenadas,
  mensagemErroCoordenadas,
  normalizarCoordenada,
  urlBuscaGoogleMaps,
  validarCoordenada,
} from '../src/utils/coordenadas.js'

test('par colado: os três formatos aceitos', () => {
  const esperado = { latitude: '-26.3045', longitude: '-48.8487' }
  assert.deepEqual(interpretarParCoordenadas('-26.3045, -48.8487'), esperado)
  assert.deepEqual(interpretarParCoordenadas('  -26.3045,   -48.8487  '), esperado)
  assert.deepEqual(interpretarParCoordenadas('-26.3045,-48.8487'), esperado)
  assert.deepEqual(interpretarParCoordenadas('-26,3045; -48,8487'), esperado)
  assert.deepEqual(interpretarParCoordenadas('-26.3045;-48.8487'), esperado)
  // Vírgula decimal com vírgula e espaço separando também é um par.
  assert.deepEqual(interpretarParCoordenadas('-26,3045, -48,8487'), esperado)
})

test('par colado: muitas casas decimais passam inteiras', () => {
  assert.deepEqual(interpretarParCoordenadas('-26.30451234567891, -48.84871234567891'), {
    latitude: '-26.30451234567891',
    longitude: '-48.84871234567891',
  })
})

test('par colado: o que não é par fica para a colagem normal', () => {
  for (const texto of [
    '-26,3045', // um número com vírgula decimal, não um par
    '-26.3045',
    'Rua Riachuelo, 100',
    '-26.3045, -48.8487, 12',
    '',
    '   ',
    'abc, def',
  ]) {
    assert.equal(interpretarParCoordenadas(texto), null, texto)
  }
  assert.equal(interpretarParCoordenadas(null), null)
})

test('normalização: vírgula vira ponto, vazio vira null', () => {
  assert.equal(normalizarCoordenada('-26,3045'), '-26.3045')
  assert.equal(normalizarCoordenada(' -26.3045 '), '-26.3045')
  assert.equal(normalizarCoordenada('-26.30154860'), '-26.30154860')
  assert.equal(normalizarCoordenada(''), null)
  assert.equal(normalizarCoordenada('  '), null)
  assert.equal(normalizarCoordenada(null), null)
  assert.equal(normalizarCoordenada(undefined), null)
})

test('validação: faixas, inclusive os limites', () => {
  assert.equal(validarCoordenada('90', '0', 'latitude'), true)
  assert.equal(validarCoordenada('-90', '0', 'latitude'), true)
  assert.equal(validarCoordenada('-26,3045', '-48.8487', 'latitude'), true)
  assert.equal(validarCoordenada('90.0001', '0', 'latitude'), 'Latitude deve estar entre -90 e 90')
  assert.equal(validarCoordenada('-91', '0', 'latitude'), 'Latitude deve estar entre -90 e 90')
  assert.equal(validarCoordenada('180', '0', 'longitude'), true)
  assert.equal(validarCoordenada('-180', '0', 'longitude'), true)
  assert.equal(validarCoordenada('180.5', '0', 'longitude'), 'Longitude deve estar entre -180 e 180')
})

test('validação: valor que não é número', () => {
  assert.equal(validarCoordenada('abc', '0', 'latitude'), 'Latitude inválida')
  assert.equal(validarCoordenada('-26.3.4', '0', 'latitude'), 'Latitude inválida')
  assert.equal(validarCoordenada('-26.3045, -48.8487', '', 'longitude'), 'Longitude inválida')
})

test('validação: as duas juntas ou nenhuma', () => {
  assert.equal(validarCoordenada('', '', 'latitude'), true)
  assert.equal(validarCoordenada('', '-48.8487', 'latitude'), 'Informe também a latitude')
  assert.equal(validarCoordenada(null, '-26.3045', 'longitude'), 'Informe também a longitude')
  // A mensagem fica só no campo vazio; o preenchido é válido.
  assert.equal(validarCoordenada('-26.3045', '', 'latitude'), true)
})

test('envio: os cinco casos do contrato', () => {
  const nulas = { latitude: null, longitude: null }

  // Criação sem preencher: o backend geocodifica.
  assert.deepEqual(coordenadasParaEnvio({ latitude: '', longitude: '', editando: false, alteradas: false }), nulas)
  // Criação preenchida, com vírgula decimal normalizada.
  assert.deepEqual(
    coordenadasParaEnvio({ latitude: '-26,3045', longitude: ' -48.8487', editando: false, alteradas: true }),
    { latitude: '-26.3045', longitude: '-48.8487' },
  )
  // Edição sem tocar nos campos: as carregadas NÃO voltam.
  assert.deepEqual(
    coordenadasParaEnvio({ latitude: '-26.30154860', longitude: '-48.85134790', editando: true, alteradas: false }),
    nulas,
  )
  // Edição com os campos alterados.
  assert.deepEqual(
    coordenadasParaEnvio({ latitude: '-26.31', longitude: '-48.85', editando: true, alteradas: true }),
    { latitude: '-26.31', longitude: '-48.85' },
  )
  // Edição com os dois campos limpos: o backend decide.
  assert.deepEqual(coordenadasParaEnvio({ latitude: '', longitude: null, editando: true, alteradas: true }), nulas)
})

test('busca no Google Maps: endereço do formulário codificado', () => {
  assert.equal(
    urlBuscaGoogleMaps({
      address: 'Rua Riachuelo',
      number: '100',
      district: 'Bom Sucesso',
      city: 'Palmitos',
      state: 'SC',
    }),
    'https://www.google.com/maps/search/?api=1&query=Rua%20Riachuelo%2C%20100%2C%20Bom%20Sucesso%2C%20Palmitos%20-%20SC',
  )
})

test('busca no Google Maps: partes vazias ficam de fora', () => {
  assert.equal(
    urlBuscaGoogleMaps({ address: 'Rua Riachuelo', number: '', district: null, city: 'Palmitos', state: '' }),
    'https://www.google.com/maps/search/?api=1&query=Rua%20Riachuelo%2C%20Palmitos',
  )
  assert.equal(urlBuscaGoogleMaps({}), null)
  assert.equal(urlBuscaGoogleMaps({ address: '  ', city: '' }), null)
})

test('erro de coordenadas: só os dois casos vão para a seção', () => {
  const naoLocalizado =
    'Endereço não localizado no mapa. Confira o endereço ou informe a latitude e a longitude manualmente.'
  assert.equal(
    mensagemErroCoordenadas({ status: 400, error: 'COORDINATES_NOT_FOUND', message: naoLocalizado }),
    naoLocalizado,
  )
  // Sem mensagem no corpo, o texto do contrato.
  assert.equal(mensagemErroCoordenadas({ error: 'COORDINATES_NOT_FOUND' }), naoLocalizado)

  const validacao = 'Erro de validação: Latitude deve estar entre -90 e 90'
  assert.equal(mensagemErroCoordenadas({ error: 'BAD_REQUEST', message: validacao }), validacao)
  assert.equal(
    mensagemErroCoordenadas({ error: 'BAD_REQUEST', message: 'Erro de validação: Latitude e longitude devem ser informadas juntas' }),
    'Erro de validação: Latitude e longitude devem ser informadas juntas',
  )

  // Demais erros seguem o tratamento genérico.
  assert.equal(mensagemErroCoordenadas({ error: 'BAD_REQUEST', message: 'Erro de validação: Nome é obrigatório' }), null)
  assert.equal(mensagemErroCoordenadas({ error: 'CONFLICT', message: 'CNPJ já cadastrado' }), null)
  assert.equal(mensagemErroCoordenadas(undefined), null)
  assert.equal(mensagemErroCoordenadas('<html>413</html>'), null)
})
