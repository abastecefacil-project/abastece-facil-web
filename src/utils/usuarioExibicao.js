/**
 * Linha de usuário pronta para exibição, usada pela tabela de Usuários do admin
 * (REDESIGN §5.7).
 *
 * Mesmo modelo de `postoExibicao.js` e `ocorrenciaExibicao.js`: função pura,
 * imports relativos para ser testável com `node --test`. Só apresentação: o
 * usuário de entrada não muda, e quem decide o que cada perfil pode fazer
 * continua sendo o backend (e, na tela, `podeEditarUsuario`/`podeAlterarStatus`).
 */

import { rotuloPerfil } from './perfil.js'

// Administrador não tem regional por regra de negócio (V103); para os demais,
// a ausência é dado faltando.
export const REGIONAL_NAO_SE_APLICA = 'Não se aplica'
export const REGIONAL_NAO_INFORMADA = 'Não informada'

/**
 * Status do cadastro, nas três variantes do `StatusChip`. Derivado de
 * `isActive` + `senhaDefinida`, como o antigo `UserCard`: inativo vence
 * aguardando. `conviteEnviado` NÃO entra aqui: em qualquer GET ele vem null, e
 * null não é falha.
 */
export function statusUsuario(usuario) {
  if (usuario.isActive === false) return 'inativo'
  if (usuario.senhaDefinida === false) return 'aguardando'
  return 'ativo'
}

/**
 * Recebe o usuário como a API devolve (`name`, `email`, `perfil`, `regional`,
 * `isActive`, `senhaDefinida`).
 *
 * - `perfil`: rótulo completo ("Gestor de Frota"), ou null para perfil
 *   desconhecido, e a tela não mostra chip. Nunca há rótulo padrão (perfil.js).
 * - `regional`: "Joinville (JOI)", ou null com `regionalAusente` dizendo por
 *   quê: "Não se aplica" para administrador, "Não informada" para os demais.
 */
export function apresentacaoLinhaUsuario(usuario) {
  const regional = usuario.regional
  const nomeRegional = regional?.nome
    ? regional.sigla ? `${regional.nome} (${regional.sigla})` : regional.nome
    : null

  return {
    nome: (usuario.name ?? '').trim(),
    email: (usuario.email ?? '').trim(),
    perfil: rotuloPerfil(usuario.perfil),
    regional: nomeRegional,
    regionalAusente: nomeRegional
      ? null
      : usuario.perfil === 'ADMINISTRADOR' ? REGIONAL_NAO_SE_APLICA : REGIONAL_NAO_INFORMADA,
    status: statusUsuario(usuario),
  }
}
