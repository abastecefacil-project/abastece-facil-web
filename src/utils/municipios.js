/**
 * Nome oficial de cidade de SC para exibição (docs/redesign/REDESIGN.md §4.7).
 *
 * Os postos importados trazem a cidade em caixa alta e sem acento ("SAO JOSE"),
 * e o nomeProprio sozinho daria "Sao Jose". A lista oficial do IBGE
 * (src/data/municipios-sc.json, com fonte e data no próprio arquivo) devolve
 * "São José". Só apresentação: nada muda no dado enviado ao backend nem na busca.
 */

import dados from '../data/municipios-sc.json' with { type: 'json' }
import { nomeProprio } from './formatacao.js'

/** Sem acento, sem caixa e com espaços normalizados: a chave de comparação. */
function chave(texto) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

const NOME_OFICIAL = new Map(dados.municipios.map(({ nome }) => [chave(nome), nome]))

/**
 * Nome da cidade como o IBGE o escreve, se a UF for SC e houver correspondência
 * exata (ignorando acento e caixa) com um município de SC. Fora de SC, sem UF ou
 * sem correspondência, o texto formatado pelo nomeProprio: a lista é só de SC, e
 * um homônimo de outro estado ("SAO DOMINGOS", GO) não pode herdar a grafia daqui.
 */
export function nomeCidadeExibicao(cidade, uf) {
  if (typeof cidade !== 'string' || !cidade.trim()) return nomeProprio(cidade)
  const deSC = typeof uf === 'string' && uf.trim().toUpperCase() === 'SC'
  return (deSC && NOME_OFICIAL.get(chave(cidade))) || nomeProprio(cidade)
}
