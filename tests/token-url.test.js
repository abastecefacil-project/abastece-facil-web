import test from 'node:test'
import assert from 'node:assert/strict'
import { extrairTokenDoFragmento } from '../src/utils/tokenUrl.js'

test('extrai somente um token do fragmento da URL', () => {
  assert.equal(extrairTokenDoFragmento('#token=abc-123_456'), 'abc-123_456')
  assert.equal(extrairTokenDoFragmento('#token=a&token=b'), '')
  assert.equal(extrairTokenDoFragmento(''), '')
})
