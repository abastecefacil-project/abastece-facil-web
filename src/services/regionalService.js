import { apiPrivate } from './apiClient'

// O endpoint tem default de size=20 e não filtra. O consumidor é um select de
// formulário, não uma tabela navegável: pedir uma página grande evita truncar a
// lista em silêncio quando as 13 regionais da FIESC forem cadastradas.
const TAMANHO_PAGINA_REGIONAIS = 200

export async function getRegionais() {
  return await apiPrivate.get('/api/regionais', {
    params: { page: 0, size: TAMANHO_PAGINA_REGIONAIS },
  })
}
