/**
 * Link de WhatsApp para o contato institucional da frota.
 *
 * Lógica pura, sem `import.meta.env`, para ser testável com `node --test`.
 * Quem lê a variável de ambiente é `config/whatsapp.js`.
 */

export const MENSAGEM_PADRAO_WHATSAPP =
  'Olá! Sou colaborador e preciso de ajuda com um veículo da frota.'

/**
 * Mantém só os dígitos e valida: 12 ou 13 dígitos começando com 55
 * (país + DDD + fixo de 8 dígitos ou celular de 9).
 *
 * @returns {{ numero: string | null, motivo: 'ausente' | 'invalido' | null }}
 */
export function normalizarNumeroWhatsapp(valor) {
  const texto = String(valor ?? '').trim()
  if (texto === '') return { numero: null, motivo: 'ausente' }

  const digitos = texto.replace(/\D/g, '')

  const valido = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')
  return valido ? { numero: digitos, motivo: null } : { numero: null, motivo: 'invalido' }
}

export function montarUrlWhatsapp(numero, mensagem = MENSAGEM_PADRAO_WHATSAPP) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
