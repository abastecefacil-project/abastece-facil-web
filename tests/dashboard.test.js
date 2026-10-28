import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ALTURA_MINIMA_BARRA,
  PROPORCAO_MINIMA,
  itensCidadesComPostos,
  itensUsuariosPorPerfil,
  itensVeiculosComOcorrencias,
  proporcoesRelativas,
  textoConvitesAntigos,
  SEM_VALOR,
  alturasBarras,
  formatarMesCurto,
  rotuloBarraMes,
  subtituloOcorrenciasPorMes,
  totalOcorrenciasPeriodo,
  contextoPostos,
  contextoUsuarios,
  contextoVeiculos,
  formatarDataOcorrencia,
  formatarValorKpi,
  subtituloPainel,
  variacaoMensal,
} from '../src/utils/dashboard.js'

test('KPI sem valor mostra traço, nunca 0', () => {
  for (const valor of [null, undefined, NaN, '12']) {
    assert.equal(formatarValorKpi(valor), SEM_VALOR, `valor ${valor}`)
  }
  assert.equal(formatarValorKpi(0), '0')
  assert.equal(formatarValorKpi(1234), '1.234')
})

test('variação em alta e em queda vira percentual sobre o mês anterior', () => {
  assert.deepEqual(variacaoMensal(15, 12), { direcao: 'alta', texto: '25% vs. mês anterior' })
  assert.deepEqual(variacaoMensal(6, 12), { direcao: 'queda', texto: '50% vs. mês anterior' })
})

test('percentual é arredondado para inteiro', () => {
  assert.equal(variacaoMensal(4, 3).texto, '33% vs. mês anterior')
  assert.equal(variacaoMensal(5, 3).texto, '67% vs. mês anterior')
  assert.equal(variacaoMensal(2400, 1000).texto, '140% vs. mês anterior')
})

test('mês anterior zerado mostra só a diferença absoluta', () => {
  assert.deepEqual(variacaoMensal(3, 0), { direcao: 'alta', texto: '+3 vs. mês anterior' })
})

test('meses iguais, inclusive os dois zerados, são estáveis', () => {
  const estavel = { direcao: 'estavel', texto: 'Igual ao mês anterior' }
  assert.deepEqual(variacaoMensal(7, 7), estavel)
  assert.deepEqual(variacaoMensal(0, 0), estavel)
})

test('contexto dos postos concorda em número', () => {
  assert.equal(contextoPostos({ inativos: 12, cidadesAtendidas: 34 }), '12 inativos · 34 cidades')
  assert.equal(contextoPostos({ inativos: 1, cidadesAtendidas: 1 }), '1 inativo · 1 cidade')
  assert.equal(contextoPostos({ inativos: 0, cidadesAtendidas: 1200 }), 'Nenhum inativo · 1.200 cidades')
})

test('contexto da frota concorda em número', () => {
  assert.equal(contextoVeiculos({ inativos: 3 }), '3 inativos')
  assert.equal(contextoVeiculos({ inativos: 1 }), '1 inativo')
  assert.equal(contextoVeiculos({ inativos: 0 }), 'Nenhum inativo')
})

test('contexto dos usuários aguardando ativação', () => {
  assert.equal(contextoUsuarios({ aguardandoAtivacao: 2 }), '2 aguardando ativação')
  assert.equal(contextoUsuarios({ aguardandoAtivacao: 0 }), 'Nenhum aguardando ativação')
})

test('data da ocorrência não recua um dia pelo fuso', () => {
  const texto = formatarDataOcorrencia('2026-10-01')
  assert.match(texto, /^01 /)
  assert.match(texto, /2026$/)
  assert.match(formatarDataOcorrencia('2026-01-31'), /^31 .*2026$/)
})

test('data vazia ou inválida não vira texto', () => {
  for (const data of [null, undefined, '', '2026-13-01', '2026-02-30', '01/10/2026', '2026-10-01T10:00:00']) {
    assert.equal(formatarDataOcorrencia(data), '', `data ${data}`)
  }
})

test('subtítulo junta perfil e horário, omitindo o que faltar', () => {
  const carga = new Date(2026, 9, 21, 14, 5)
  assert.equal(subtituloPainel('GESTOR_FROTA', carga), 'Gestor de Frota · Atualizado às 14:05')
  assert.equal(subtituloPainel('ADMINISTRADOR', null), 'Administrador')
  assert.equal(subtituloPainel(null, carga), 'Atualizado às 14:05')
  assert.equal(subtituloPainel(null, null), '')
  assert.equal(subtituloPainel('ADMINISTRADOR', new Date('inválida')), 'Administrador')
})

test('mês abreviado em pt-BR, com ano de dois dígitos', () => {
  const esperados = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  esperados.forEach((abreviacao, indice) => {
    const mes = `2026-${String(indice + 1).padStart(2, '0')}`
    assert.equal(formatarMesCurto(mes), `${abreviacao}/26`)
  })
  assert.equal(formatarMesCurto('2027-01'), 'jan/27')
})

test('mês inválido não vira texto', () => {
  for (const mes of [null, undefined, '', '2026-13', '2026-00', '2026-5', '05/2026', '2026-05-01']) {
    assert.equal(formatarMesCurto(mes), '', `mês ${mes}`)
  }
})

test('rótulo acessível da barra diz mês por extenso e quantidade', () => {
  assert.equal(rotuloBarraMes({ mes: '2026-05', total: 1 }), 'maio de 2026: 1 ocorrência')
  assert.equal(rotuloBarraMes({ mes: '2026-06', total: 0 }), 'junho de 2026: 0 ocorrências')
  assert.equal(rotuloBarraMes({ mes: '2026-03', total: 12 }), 'março de 2026: 12 ocorrências')
})

test('altura das barras é relativa ao maior valor', () => {
  assert.deepEqual(alturasBarras([1, 0, 1, 1, 1, 2]), [50, 0, 50, 50, 50, 100])
  assert.deepEqual(alturasBarras([3, 2, 1]), [100, 67, 33])
})

test('série zerada ou vazia não gera barra', () => {
  assert.deepEqual(alturasBarras([0, 0, 0]), [0, 0, 0])
  assert.deepEqual(alturasBarras([]), [])
})

test('valor pequeno ao lado de um pico não some', () => {
  assert.deepEqual(alturasBarras([1, 1000]), [ALTURA_MINIMA_BARRA, 100])
  assert.deepEqual(alturasBarras([0, 1000]), [0, 100])
})

test('subtítulo do gráfico soma o período', () => {
  const serie = [1, 0, 1, 1, 1, 2].map((total, indice) => ({ mes: `2026-${String(indice + 5).padStart(2, '0')}`, total }))
  assert.equal(totalOcorrenciasPeriodo(serie), 6)
  assert.equal(subtituloOcorrenciasPorMes(serie), '6 nos últimos 6 meses')
  assert.equal(subtituloOcorrenciasPorMes(serie.map((item) => ({ ...item, total: 0 }))), '')
  assert.equal(subtituloOcorrenciasPorMes(null), '')
})

test('proporção genérica é a mesma das colunas do gráfico', () => {
  for (const totais of [[1, 0, 1, 1, 1, 2], [3, 2, 1], [0, 0], [], [1, 1000]]) {
    assert.deepEqual(proporcoesRelativas(totais), alturasBarras(totais), `totais ${totais}`)
  }
  assert.deepEqual(proporcoesRelativas([3, 1]), [100, 33])
  assert.deepEqual(proporcoesRelativas([1, 1000]), [PROPORCAO_MINIMA, 100])
})

test('ranking de veículos usa a placa como rótulo, sem link', () => {
  const lista = [{ placa: 'MGM5H18', total: 3 }, { placa: 'ABC1234', total: 1 }]
  assert.deepEqual(itensVeiculosComOcorrencias(lista), [
    { rotulo: 'MGM5H18', total: 3 },
    { rotulo: 'ABC1234', total: 1 },
  ])
  assert.deepEqual(itensVeiculosComOcorrencias([]), [])
})

test('ranking de cidades leva a UF como detalhe e preserva a ordem', () => {
  // Como a API devolve: a cidade em caixa alta e sem acento, como foi importada.
  const lista = [
    { cidade: 'JOINVILLE', uf: 'SC', total: 48 },
    { cidade: 'SAO JOSE', uf: 'SC', total: 30 },
  ]
  assert.deepEqual(itensCidadesComPostos(lista), [
    { rotulo: 'Joinville', detalhe: 'SC', total: 48 },
    { rotulo: 'São José', detalhe: 'SC', total: 30 },
  ])
})

test('ranking de cidades fora de SC usa o nome próprio, e nulo segue nulo', () => {
  assert.deepEqual(itensCidadesComPostos([{ cidade: 'SAO DOMINGOS', uf: 'GO', total: 2 }]), [
    { rotulo: 'Sao Domingos', detalhe: 'GO', total: 2 },
  ])
  assert.equal(itensCidadesComPostos(null), null)
  assert.deepEqual(itensCidadesComPostos([]), [])
})

test('usuários por perfil usam o rótulo completo, na ordem da API', () => {
  const lista = [
    { perfil: 'COLABORADOR', total: 0 },
    { perfil: 'GESTOR_FROTA', total: 1 },
    { perfil: 'ADMINISTRADOR', total: 0 },
  ]
  assert.deepEqual(itensUsuariosPorPerfil(lista), [
    { rotulo: 'Colaborador', total: 0 },
    { rotulo: 'Gestor de Frota', total: 1 },
    { rotulo: 'Administrador', total: 0 },
  ])
  assert.deepEqual(itensUsuariosPorPerfil([{ perfil: 'AUDITOR', total: 2 }]), [{ rotulo: 'AUDITOR', total: 2 }])
})

test('ranking sem resposta continua nulo, para a lista distinguir carga de vazio', () => {
  for (const transformar of [itensVeiculosComOcorrencias, itensCidadesComPostos, itensUsuariosPorPerfil]) {
    assert.equal(transformar(null), null)
    assert.equal(transformar(undefined), null)
  }
})

test('aviso de convites antigos concorda em número e some sem convites', () => {
  assert.equal(textoConvitesAntigos(1), '1 usuário aguarda ativação há mais de 7 dias')
  assert.equal(textoConvitesAntigos(3), '3 usuários aguardam ativação há mais de 7 dias')
  for (const quantidade of [0, -1, null, undefined]) {
    assert.equal(textoConvitesAntigos(quantidade), '', `quantidade ${quantidade}`)
  }
})
