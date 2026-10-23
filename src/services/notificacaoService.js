import { apiPrivate } from './apiClient'

export async function getNotificacoesNeo(page = 0) {
  return await apiPrivate.get('/api/notificacoes/neo', { params: { page, size: 10 } })
}

export async function marcarNotificacaoNeoLida(id) {
  return await apiPrivate.patch(`/api/notificacoes/neo/${id}/lida`)
}
