import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  apresentacaoPopupPosto,
  htmlCluster,
  htmlMarcadorPosto,
  htmlMarcadorUsuario,
  nivelCluster,
} from '../src/utils/mapa.js'

test('nivelCluster: três níveis por quantidade, com os limites 9 e 99', () => {
  assert.deepEqual(nivelCluster(2), { nivel: 'pequeno', tamanho: 34 })
  assert.deepEqual(nivelCluster(9), { nivel: 'pequeno', tamanho: 34 })
  assert.deepEqual(nivelCluster(10), { nivel: 'medio', tamanho: 40 })
  assert.deepEqual(nivelCluster(99), { nivel: 'medio', tamanho: 40 })
  assert.deepEqual(nivelCluster(100), { nivel: 'grande', tamanho: 46 })
  assert.deepEqual(nivelCluster(971), { nivel: 'grande', tamanho: 46 })
})

test('nivelCluster: entrada inválida cai no menor nível', () => {
  assert.equal(nivelCluster(undefined).nivel, 'pequeno')
  assert.equal(nivelCluster('abc').nivel, 'pequeno')
})

test('htmlCluster: mostra só o número', () => {
  assert.equal(htmlCluster(42), '<span class="cluster-posto__numero">42</span>')
  assert.equal(htmlCluster(null), '<span class="cluster-posto__numero">0</span>')
})

test('marcadores: SVG e HTML locais, sem URL externa nem cor literal', () => {
  for (const html of [htmlMarcadorPosto(), htmlMarcadorUsuario(), htmlCluster(5)]) {
    assert.doesNotMatch(html, /https?:|\/\/|url\(/)
    assert.doesNotMatch(html, /#[0-9a-f]{3,6}\b|rgb\(|fill=|stroke=/i)
  }
  assert.match(htmlMarcadorPosto(), /<svg[^>]*aria-hidden="true"/)
  assert.match(htmlMarcadorPosto(), /marcador-posto__corpo/)
  assert.match(htmlMarcadorPosto(), /marcador-posto__icone/)
})

test('apresentacaoPopupPosto: nome, endereço e cidade legíveis', () => {
  const p = apresentacaoPopupPosto({
    name: 'POSTO DELTA DO NORTE LTDA',
    address: 'RUA DONA FRANCISCA, 1500',
    city: 'SAO JOSE',
    state: 'sc',
  })
  assert.equal(p.nome, 'Posto Delta do Norte LTDA')
  assert.equal(p.endereco, 'Rua Dona Francisca, 1500')
  assert.equal(p.cidade, 'São José - SC')
})

test('apresentacaoPopupPosto: telefone formatado com link tel:', () => {
  const p = apresentacaoPopupPosto({ phone: '47992564972' })
  assert.deepEqual(p.telefone, { texto: '(47) 99256-4972', href: 'tel:47992564972', informado: true })
})

test('apresentacaoPopupPosto: telefone e horário ausentes trazem o fallback', () => {
  const p = apresentacaoPopupPosto({ phone: '  ', businessHours: null })
  assert.deepEqual(p.telefone, { texto: 'Telefone não informado', href: null, informado: false })
  assert.deepEqual(p.horario, { texto: 'Horário não informado', informado: false })
})

test('apresentacaoPopupPosto: horário de 24 horas e horário comum', () => {
  assert.equal(apresentacaoPopupPosto({ businessHours: '00:00 - 23:59' }).horario.texto, '24 horas')
  assert.deepEqual(apresentacaoPopupPosto({ businessHours: '07:00  -  21:00' }).horario, { texto: '07:00 - 21:00', informado: true })
})

test('apresentacaoPopupPosto: sem cidade ou sem UF não sobra hífen solto', () => {
  assert.equal(apresentacaoPopupPosto({ city: 'JOINVILLE' }).cidade, 'Joinville')
  assert.equal(apresentacaoPopupPosto({ state: 'SC' }).cidade, 'SC')
  assert.equal(apresentacaoPopupPosto({}).cidade, '')
})
