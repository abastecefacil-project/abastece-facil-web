/**
 * Linha de posto pronta para exibição, compartilhada pela tabela de Postos do
 * admin e pela lista de Postos do colaborador (REDESIGN §4.7, §5.4 e §5.9).
 *
 * Arquivo próprio, e não `utils/posto.js`, porque `formatacao.js` já importa
 * `posto.js`: a função aqui depende dos dois. Imports relativos, para ser
 * testável com `node --test`. Só apresentação: o posto de entrada não muda, e a
 * busca continua comparando os dados crus.
 */

import { horarioExibicao, nomeProprio, telefoneExibicao } from './formatacao.js'
import { nomeCidadeExibicao } from './municipios.js'
import { nomeExibicaoPosto } from './posto.js'

/**
 * Recebe o posto já com o endereço partido em `address` (logradouro) e
 * `number`, como o devolvem `prepararPostoParaEdicao` e o mapeamento da lista
 * do colaborador. Telefone e horário saem null quando ausentes, e quem exibe
 * mostra `TELEFONE_NAO_INFORMADO` e `HORARIO_NAO_INFORMADO`.
 */
export function apresentacaoLinhaPosto(posto) {
  // Parte a parte: nomeProprio devolve intacto o texto que já tem minúscula,
  // e o número ("km200") ou o bairro ("Serraria") travariam o logradouro todo.
  const logradouro = [posto.address, posto.number].filter(Boolean).map(nomeProprio).join(', ')
  const endereco = [logradouro, nomeProprio(posto.district)].filter(Boolean).join(' - ')
  // Cidade de SC pelo nome oficial do IBGE ("SAO JOSE" vira "São José").
  const cidadeUf = [nomeCidadeExibicao(posto.city, posto.state), posto.state].filter(Boolean).join('/')
  return {
    nome: nomeProprio(nomeExibicaoPosto(posto)),
    endereco,
    cidadeUf,
    enderecoCompleto: [endereco, cidadeUf].filter(Boolean).join(' · '),
    telefone: telefoneExibicao(posto.phone),
    horario: horarioExibicao(posto.businessHours),
  }
}
