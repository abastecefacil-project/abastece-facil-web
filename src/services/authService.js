import { apiPublic } from './apiClient'

// Tudo aqui é público por contrato: /api/auth/** é permitAll no backend, e
// nenhuma destas chamadas pode depender de token. Por isso apiPublic, nunca
// apiPrivate.
const authService = {
  async login(credentials) {
    const response = await apiPublic.post('/api/auth/login', credentials)
    return response.data
  },

  // Sonda do link de ativação. Responde 200 SEMPRE, inclusive para token
  // inválido — quem decide é o campo `valido` do corpo, não o status. E não
  // consome o token: pode ser chamada de novo a cada recarga da página.
  // Devolve { valido, nome }, com `nome` null quando `valido` é false.
  async validarTokenAtivacao(token) {
    const response = await apiPublic.get('/api/auth/ativacao/validar', { params: { token } })
    return response.data
  },

  // Consome o token e define a senha. Devolve o mesmo AuthResponse do login,
  // já autenticando a pessoa. O erro sobe cru: o campo `error` do corpo é o
  // único discriminador entre TOKEN_INVALIDO (410) e SENHA_FRACA (400).
  async ativarConta({ token, senha }) {
    const response = await apiPublic.post('/api/auth/ativacao', { token, senha })
    return response.data
  },

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

export default authService
