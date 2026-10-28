/**
 * Central de Ajuda (R12). Funções e dados puros, sem import de Vue, para serem
 * testados com `node --test`.
 */

/**
 * Seções da Central, na ordem da tela. A mesma lista monta os chips de âncora
 * e os cabeçalhos das seções, para o destino de um chip nunca divergir do id
 * da seção. O chip "Contatos" não está aqui: leva ao card do fim, que não é
 * uma seção de conteúdo, e só aparece abaixo de 960px.
 */
export const SECOES_AJUDA = Object.freeze([
  Object.freeze({ id: 'ajuda-abastecimento', titulo: 'Abastecimento', icone: 'mdi-gas-station-outline' }),
  Object.freeze({ id: 'ajuda-seguro', titulo: 'Seguro frota própria', icone: 'mdi-shield-check-outline' }),
  Object.freeze({ id: 'ajuda-perguntas', titulo: 'Perguntas frequentes', icone: 'mdi-help-circle-outline' }),
])

export const ID_CONTATOS_AJUDA = 'ajuda-contatos'

/**
 * Filtro da busca de dúvidas. Termo vazio ou nulo (o botão de limpar do campo
 * devolve null) mostra todas; senão, compara sem diferenciar maiúsculas com a
 * pergunta e a resposta. É o comportamento que a view tinha até o R12.
 */
export function filtrarPerguntas(perguntas, termo) {
  if (!termo) return perguntas
  const busca = termo.toLowerCase()
  return perguntas.filter(
    (faq) => faq.question.toLowerCase().includes(busca) || faq.answer.toLowerCase().includes(busca),
  )
}
