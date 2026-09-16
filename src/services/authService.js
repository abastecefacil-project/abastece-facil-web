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

  // Pede o link de redefinição. Responde 200 com um corpo único, IDÊNTICO para
  // conta existente, inexistente, inativa e sem senha definida — e o envio é
  // assíncrono, depois da resposta, para que nem o tempo diferencie os casos.
  // Nada aqui pode ramificar por resultado: a garantia é do S4, e o cliente só
  // teria como desfazê-la. Devolve { message }.
  async solicitarRecuperacao(email) {
    const response = await apiPublic.post('/api/auth/recuperacao', { email })
    return response.data
  },

  // Sonda do link de recuperação, gêmea da de ativação: 200 SEMPRE, decisão
  // pelo campo `valido` do corpo, e não consome o token.
  async validarTokenRecuperacao(token) {
    const response = await apiPublic.get('/api/auth/recuperacao/validar', { params: { token } })
    return response.data
  },

  // Consome o token e grava a senha nova. Devolve o mesmo AuthResponse do
  // login e da ativação, já autenticando a pessoa. O erro sobe cru, pelo mesmo
  // motivo do `ativarConta`.
  async redefinirSenha({ token, senha }) {
    const response = await apiPublic.post('/api/auth/recuperacao/confirmar', { token, senha })
    return response.data
  },
}

export default authService
