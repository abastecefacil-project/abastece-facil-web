import { apiPrivate } from "./apiClient";

export async function getUsers(page = 0, name, active=true) {
    return await apiPrivate.get('/api/users', {
        params: { name, active, page }
    });
}

export async function getUserById(id) {
    return await apiPrivate.get(`/api/users/${id}`)
}

export async function createUser(userData) {
    return await apiPrivate.post('/api/users', userData)
}

export async function updateUser(id, userData) {
    return await apiPrivate.patch(`/api/users/${id}`, userData)
}

export async function reenviarAtivacao(id) {
    return await apiPrivate.post(`/api/users/${id}/reenviar-ativacao`)
}

export async function inativarUser(id) {
    return await apiPrivate.delete(`/api/users/${id}`)
}

export async function reativarUser(id) {
    return await apiPrivate.post(`/api/users/${id}/reativar`)
}

export async function getUsuarioAutenticado() {
  const { data } = await apiPrivate.get('/api/users/me')
  return data
}
