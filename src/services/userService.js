import { apiPublic, apiPrivate } from "./apiClient";

export async function getUsers(page = 0, name, active=true) {
    return await apiPrivate.get('/api/users', {
        params: { name, active, page }
    });
}

export async function createUser(userData) {
    return await apiPrivate.post('/api/users', userData)
}

export async function deleteUser(id) {
    return await apiPrivate.delete(`/api/users/${id}`)
}

export async function getUsersDashboard() {
    let active = true;
    let page = 0;
    let size = 1;
    return await apiPrivate.get('/api/users', {
        params: { active, page, size }
    });
}