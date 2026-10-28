/**
 * Percorre um endpoint paginado do Spring Data até a última página.
 *
 * Para telas que precisam da base inteira — o mapa, o filtro de trajeto e a
 * busca da lista do usuário. Função pura: quem faz a requisição é o
 * `buscarPagina` recebido, e é isso que permite testá-la com `node --test`
 * (o apiClient lê `import.meta.env`, que não existe fora do Vite).
 */

/**
 * As páginas são pedidas em sequência, nunca em paralelo, de 0 até
 * `totalPages - 1`. O `totalPages` vale o da resposta mais recente.
 *
 * Falha em qualquer página não lança: devolve o que já chegou com
 * `completo: false`, porque a tela mostra o parcial com um aviso. As páginas
 * seguintes não são pedidas.
 *
 * Itens repetidos são descartados por `id`. O backend ordena por
 * `created_at DESC`, então um posto inserido entre duas páginas empurra um
 * item para a seguinte, que chegaria duas vezes.
 *
 * @param {(page: number) => Promise<{ content: Array<{ id: unknown }>, totalPages: number }>} buscarPagina
 * @returns {Promise<{ itens: Array, completo: boolean }>}
 */
export async function buscarTodasAsPaginas(buscarPagina) {
  const itens = []
  const vistos = new Set()
  let pagina = 0
  let totalPaginas = 1

  while (pagina < totalPaginas) {
    let resposta
    try {
      resposta = await buscarPagina(pagina)
    } catch (erro) {
      console.error(`Erro ao buscar a página ${pagina}`, erro)
      return { itens, completo: false }
    }

    for (const item of resposta?.content ?? []) {
      if (vistos.has(item.id)) continue
      vistos.add(item.id)
      itens.push(item)
    }

    totalPaginas = resposta?.totalPages ?? 0
    pagina += 1
  }

  return { itens, completo: true }
}

const formatoQuantidade = new Intl.NumberFormat('pt-BR')

/**
 * Texto do rodapé de lista paginada: "Mostrando 11 a 20 de 971".
 *
 * `pagina` é a da interface, a partir de 1 (o Spring conta a partir de 0).
 * `porPagina` vem do `size` da resposta quando a paginação é do servidor, porque
 * o tamanho varia por endpoint (10 em postos, veículos e ocorrências; 20 em
 * usuários, que não tem `@PageableDefault`). A última página fecha no total.
 *
 * Devolve null quando não há o que mostrar: total ausente, zero ou entrada
 * inválida. Quem exibe simplesmente omite o texto.
 */
export function textoIntervaloPagina(pagina, porPagina, total) {
  if (![pagina, porPagina, total].every(Number.isFinite)) return null
  if (total <= 0 || porPagina <= 0 || pagina < 1) return null

  const inicio = (pagina - 1) * porPagina + 1
  if (inicio > total) return null
  const fim = Math.min(pagina * porPagina, total)

  const f = formatoQuantidade.format
  return `Mostrando ${f(inicio)} a ${f(fim)} de ${f(total)}`
}
