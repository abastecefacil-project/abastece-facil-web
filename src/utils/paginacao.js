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
