/**
 * Foco devolvido ao botão que abriu um diálogo (REDESIGN §7.4).
 *
 * Os diálogos das telas de gestão não têm `activator`: abrem por `v-model`. Sem
 * activator o Vuetify não tem para onde devolver o foco, e ele cai no <body> ao
 * fechar. Quem usa guarda a origem no clique e chama `devolverFoco` no
 * `after-leave` de cada diálogo da tela.
 *
 * Função pura, sem import de Vue: o documento entra por parâmetro, para ser
 * testável com `node --test`.
 */

// Diálogo ainda aberto (um formulário que deu lugar ao modal de sucesso, uma
// confirmação que deu lugar ao feedback). Só `.v-dialog`: tooltips e menus
// também são `.v-overlay`, e o tooltip do próprio botão de origem costuma
// estar aberto.
const DIALOGO_ABERTO = '.v-dialog.v-overlay--active'

/**
 * Elemento que recebeu o clique. É ele que volta a ter foco, e não o
 * `event.target`, que pode ser o ícone dentro do botão.
 */
export function elementoDeOrigem(evento) {
  return evento?.currentTarget ?? null
}

// A lista é recarregada depois de salvar, e o esqueleto de carregamento troca
// as linhas por elementos novos. O botão original fica desconectado, mas outro
// com o mesmo `data-origem` ("editar-7") ocupa o lugar dele.
function resolver(elemento, documento) {
  if (!elemento) return null
  if (elemento.isConnected) return elemento
  const chave = elemento.dataset?.origem
  return chave ? documento.querySelector(`[data-origem="${chave}"]`) : null
}

/**
 * Devolve o foco à origem, ou à primeira alternativa que existir (o botão de
 * origem some quando o usuário inativado sai da lista).
 *
 * - `'aguardando'`: outro diálogo continua aberto; a origem deve ser mantida e
 *   a chamada repetida quando ele fechar.
 * - `'mantido'`: o foco já está fora do <body> e de qualquer overlay, ou seja,
 *   alguém o levou para outro lugar de propósito, e ele fica onde está.
 * - `'devolvido'` ou `'sem-destino'`: a cadeia terminou.
 */
export function devolverFoco(origem, { documento = globalThis.document, alternativas = [] } = {}) {
  if (!documento) return 'sem-destino'
  if (documento.querySelector(DIALOGO_ABERTO)) return 'aguardando'

  const ativo = documento.activeElement
  const perdido = !ativo || ativo === documento.body || !!ativo.closest?.('.v-overlay')
  if (!perdido) return 'mantido'

  const destino = [resolver(origem, documento), ...alternativas].find((elemento) => elemento?.isConnected)
  if (!destino) return 'sem-destino'
  destino.focus()
  return 'devolvido'
}
