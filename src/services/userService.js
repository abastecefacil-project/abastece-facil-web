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

export async function reenviarAtivacao(id) {
    return await apiPrivate.post(`/api/users/${id}/reenviar-ativacao`)
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

// ---------------------------------------------------------------------------
// SOLUÇÃO TEMPORÁRIA — substituir por GET /api/users/me quando o backend expuser
// esse endpoint. Ver a pendência registrada no CLAUDE.md.
//
// O S5 precisa do id e da regional do usuário logado para travar o campo de
// regional do GESTOR_FROTA, e hoje não existe caminho para isso: o AuthResponse
// do login traz apenas { token, type, message, perfil }, o JWT carrega só sub
// (e-mail), perfil, iat e exp, e GET /api/users não filtra por e-mail.
//
// Enquanto isso, o e-mail sai do claim `sub` e o registro é localizado varrendo a
// listagem. O e-mail é o ÚNICO dado aproveitado do token: perfil e regional
// continuam saindo do banco, então a decisão do S2a — nunca autorizar sobre dado
// de token, que vive 24 horas e envelhece — não é contornada aqui.
//
// Toda a gambiarra está contida nesta função. Trocar por
// `apiPrivate.get('/api/users/me')` mexe só neste arquivo.
//
// Diferente das demais funções deste módulo, esta devolve o usuário já
// desembrulhado (ou null), porque é uma busca composta e não uma chamada crua.
// ---------------------------------------------------------------------------
const TAMANHO_PAGINA_BUSCA_AUTENTICADO = 200

function emailDoToken() {
  const token = localStorage.getItem('token')
  if (!token) return null

  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const preenchido = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(atob(preenchido)).sub || null
  } catch {
    return null
  }
}

export async function getUsuarioAutenticado() {
  const email = emailDoToken()
  if (!email) return null

  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const { data } = await apiPrivate.get('/api/users', {
      params: { active: true, page, size: TAMANHO_PAGINA_BUSCA_AUTENTICADO },
    })

    const encontrado = data.content.find((usuario) => usuario.email === email)
    if (encontrado) return encontrado

    totalPages = data.totalPages
    page += 1
  }

  return null
}
