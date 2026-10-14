export function limparSessao() {
  localStorage.removeItem('token')
  localStorage.removeItem('perfil')
}

export function lerTokenValido() {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const partes = token.split('.')
    if (partes.length !== 3 || !partes[0] || !partes[2]) throw new Error('JWT inválido')
    const payload = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    // A assinatura continua sendo validada pela API.
    if (typeof exp === 'number' && Number.isFinite(exp) && exp * 1000 > Date.now()) return token
  } catch {
    // Tokens malformados também encerram a sessão local.
  }

  limparSessao()
  return null
}
