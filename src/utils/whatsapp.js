// Links de WhatsApp para os contatos cadastrados da gestão de frota.

export const MENSAGEM_PADRAO_WHATSAPP =
  'Olá! Sou colaborador e preciso de ajuda com um veículo da frota.'

/**
 * Aceita telefone nacional com DDD (10/11 dígitos) ou com país 55 (12/13).
 *
 * @returns {{ numero: string | null, motivo: 'ausente' | 'invalido' | null }}
 */
export function normalizarNumeroWhatsapp(valor) {
  const texto = String(valor ?? '').trim()
  if (texto === '') return { numero: null, motivo: 'ausente' }

  let digitos = texto.replace(/\D/g, '')
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`

  const valido = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')
  return valido ? { numero: digitos, motivo: null } : { numero: null, motivo: 'invalido' }
}

export function montarUrlWhatsapp(numero, mensagem = MENSAGEM_PADRAO_WHATSAPP) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
