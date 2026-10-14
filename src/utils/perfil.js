/**
 * Rótulos e ícones de perfil de usuário. Único lugar do frontend que traduz o
 * enum do backend para texto de interface.
 *
 * Apresentação, não autorização: quem decide o que cada perfil pode fazer é o
 * backend. Função pura, sem import de Vue, para ser testada com `node --test`.
 *
 * - `curto`: indicador de perfil no cabeçalho do `AppShell`.
 * - `completo`: select de perfil do `UserDialog`, onde "Gestor de Frota" é mais
 *   claro que "Gestor".
 */
export const ROTULOS_PERFIL = {
  ADMINISTRADOR: { curto: 'Admin', completo: 'Administrador', icone: 'mdi-account-cog' },
  GESTOR_FROTA: { curto: 'Gestor', completo: 'Gestor de Frota', icone: 'mdi-account-tie' },
  COLABORADOR: { curto: 'Colaborador', completo: 'Colaborador', icone: 'mdi-account' },
}

// `Object.hasOwn`, e não `ROTULOS_PERFIL[perfil]`, para que "toString" e afins
// não resolvam para o protótipo.
function entrada(perfil) {
  return typeof perfil === 'string' && Object.hasOwn(ROTULOS_PERFIL, perfil)
    ? ROTULOS_PERFIL[perfil]
    : null
}

/**
 * Perfil nulo ou desconhecido devolve null nas três funções, e quem exibe não
 * mostra nada. Nunca há rótulo padrão: um "Admin" de fallback mentiria
 * justamente para a sessão adulterada ou anterior ao P0.5a.
 */
export function rotuloCurtoPerfil(perfil) {
  return entrada(perfil)?.curto ?? null
}

export function rotuloPerfil(perfil) {
  return entrada(perfil)?.completo ?? null
}

export function iconePerfil(perfil) {
  return entrada(perfil)?.icone ?? null
}
