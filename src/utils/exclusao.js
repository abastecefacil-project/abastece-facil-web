/**
 * Mensagem de erro de exclusão (Veículos e Postos do admin, F4).
 *
 * Vale a `message` do `ErrorResponse` do backend quando ela vier. Sem ela — o
 * 403 do Spring Security chega sem corpo, um 500 cru do BasicErrorController
 * não traz `message` útil, e uma conexão perdida não traz resposta —, o texto
 * padrão. Função pura, sem import, para ser testável com `node --test`.
 */

export const MENSAGEM_ERRO_EXCLUSAO = 'Não foi possível excluir. Tente novamente.'

export function mensagemErroExclusao(erro) {
  const mensagem = erro?.response?.data?.message
  return typeof mensagem === 'string' && mensagem.trim() ? mensagem.trim() : MENSAGEM_ERRO_EXCLUSAO
}
