/**
 * Apresentação do usuário autenticado no `AppShell`. Função pura, sem import de
 * Vue, para ser testada com `node --test`.
 */

// Partículas que não contam como palavra: "Ana de Souza" vira "AS", e não "AD".
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

/**
 * Iniciais do avatar: primeira letra da primeira e da última palavra
 * significativas. Uma palavra só dá uma letra. Nome ausente ou só com
 * partículas devolve null, e quem exibe cai no ícone do perfil.
 */
export function iniciaisDoNome(nome) {
  if (typeof nome !== 'string') return null
  const palavras = nome
    .trim()
    .split(/\s+/)
    .filter((palavra) => palavra && !PARTICULAS.has(palavra.toLocaleLowerCase('pt-BR')))
  if (!palavras.length) return null
  const primeira = palavras[0].charAt(0)
  const ultima = palavras.length > 1 ? palavras.at(-1).charAt(0) : ''
  return (primeira + ultima).toLocaleUpperCase('pt-BR')
}
