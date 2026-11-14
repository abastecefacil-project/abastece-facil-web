import { apiPrivate } from './apiClient'

export async function getNotificacoes(page = 0) {
  return await apiPrivate.get('/api/notificacoes', { params: { page, size: 10 } })
}

export async function marcarNotificacaoLida(id) {
  return await apiPrivate.patch(`/api/notificacoes/${id}/lida`)
}
