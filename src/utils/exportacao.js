/**
 * Exportação .xlsx das listagens do admin: nome do arquivo e mensagem de erro.
 *
 * Funções puras, sem import, para serem testáveis com `node --test`. Quem faz a
 * requisição e dispara o download é o `services/exportacaoService.js`.
 */

export const MENSAGEM_ERRO_EXPORTACAO = 'Não foi possível exportar. Tente novamente.'

const doisDigitos = (n) => String(n).padStart(2, '0')

/**
 * Nome do arquivo do `Content-Disposition` (`filename*=` tem precedência, como
 * manda a RFC 6266). Sem header, `<entidade>-AAAA-MM-DD.xlsx` na data local,
 * o mesmo formato que o backend usa.
 */
export function nomeArquivoExportacao(contentDisposition, entidade, data = new Date()) {
  const estendido = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(contentDisposition ?? '')
  if (estendido) {
    try {
      return decodeURIComponent(estendido[1].trim())
    } catch {
      // Codificação inválida: tenta o filename simples.
    }
  }
  const simples = /filename\s*=\s*"?([^";]+)"?/i.exec(contentDisposition ?? '')
  if (simples?.[1].trim()) return simples[1].trim()

  const dia = `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`
  return `${entidade}-${dia}.xlsx`
}

/**
 * Com `responseType: 'blob'`, o `ErrorResponse` do backend chega como Blob com
 * JSON. Vale a `message` dele; sem corpo (403 do Spring Security, falha de
 * rede) ou com corpo que não é JSON, a mensagem padrão.
 */
export async function mensagemErroExportacao(erro) {
  const corpo = erro?.response?.data
  try {
    const dados = typeof corpo?.text === 'function' ? JSON.parse(await corpo.text()) : corpo
    const mensagem = dados?.message
    if (typeof mensagem === 'string' && mensagem.trim()) return mensagem.trim()
  } catch {
    // Corpo vazio ou HTML (proxy): cai na mensagem padrão.
  }
  return MENSAGEM_ERRO_EXPORTACAO
}
