import { apiPrivate } from "./apiClient"

// Resumo inteiro da Home de gestão numa requisição só. Os campos de usuário vêm
// escopados pelo perfil de quem chama, como no GET /api/users.
export async function getDashboard() {
    return await apiPrivate.get('/api/dashboard')
}
