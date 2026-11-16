export function extrairTokenDoFragmento(hash) {
  const parametros = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const tokens = parametros.getAll('token')
  return tokens.length === 1 ? tokens[0] : ''
}
