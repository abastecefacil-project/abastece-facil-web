import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apresentacaoLinhaPosto } from '../src/utils/postoExibicao.js'

const importado = {
  name: 'POSTO Z21 LTDA',
  fantasyName: null,
  address: 'RUA DONA FRANCISCA',
  number: '1500',
  district: 'SAGUACU',
  city: 'SAO JOSE',
  state: 'SC',
  phone: '47992564972',
  businessHours: '00:00 - 23:59',
}

test('apresentacaoLinhaPosto: posto importado em caixa alta vira texto legível', () => {
  assert.deepEqual(apresentacaoLinhaPosto(importado), {
    nome: 'Posto Z21 LTDA',
    endereco: 'Rua Dona Francisca, 1500 - Saguacu',
    cidadeUf: 'São José/SC',
    enderecoCompleto: 'Rua Dona Francisca, 1500 - Saguacu · São José/SC',
    telefone: '(47) 99256-4972',
    horario: '24 horas',
  })
})

test('apresentacaoLinhaPosto: nome fantasia tem precedência sobre a razão social', () => {
  const linha = apresentacaoLinhaPosto({ ...importado, fantasyName: 'AUTO POSTO DELTA' })
  assert.equal(linha.nome, 'Auto Posto Delta')
})

test('apresentacaoLinhaPosto: formata parte a parte, sem o número travar o logradouro', () => {
  // "km200" tem minúscula: sozinho, ele é devolvido intacto, e o logradouro
  // ainda vira Title Case.
  const linha = apresentacaoLinhaPosto({ ...importado, address: 'RODOVIA BR-101', number: 'km200', district: 'Serraria' })
  assert.equal(linha.endereco, 'Rodovia BR-101, km200 - Serraria')
})

test('apresentacaoLinhaPosto: partes ausentes não deixam separador sobrando', () => {
  const linha = apresentacaoLinhaPosto({ ...importado, number: '', district: null })
  assert.equal(linha.endereco, 'Rua Dona Francisca')
  assert.equal(linha.enderecoCompleto, 'Rua Dona Francisca · São José/SC')
})

test('apresentacaoLinhaPosto: telefone e horário ausentes saem null', () => {
  const linha = apresentacaoLinhaPosto({ ...importado, phone: null, businessHours: null })
  assert.equal(linha.telefone, null)
  assert.equal(linha.horario, null)
})

test('apresentacaoLinhaPosto: não altera o posto recebido', () => {
  const copia = { ...importado }
  apresentacaoLinhaPosto(copia)
  assert.deepEqual(copia, importado)
})
