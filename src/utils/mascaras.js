/**
 * Máscaras de entrada compartilhadas entre formulários.
 *
 * Funções puras: recebem o que o usuário digitou e devolvem o texto formatado,
 * sem tocar em estado reativo. Quem liga ao campo é o componente.
 */

/** Dígitos de um telefone nacional: 10 (fixo) ou 11 (celular). */
const MAX_DIGITOS_TELEFONE = 11

/**
 * Formata um telefone brasileiro ao vivo: (47) 99999-8888.
 *
 * Aceita qualquer entrada — tudo que não é dígito é descartado — e limita o
 * total a 11 dígitos, então digitar além disso não deixa sobra solta no fim.
 *
 * Com 1 ou 2 dígitos devolve "(47", sem o ") " final, de propósito: se o
 * fechamento e o espaço fossem recolocados a cada tecla, apagar de trás para
 * frente travaria o campo em "(47) " para sempre.
 *
 * O resultado passa no TELEFONE_PATTERN do backend a partir de 10 dígitos, e a
 * entidade normaliza para só dígitos ao persistir.
 */
export function formatarTelefone(valor) {
  const digitos = String(valor ?? '')
    .replace(/\D/g, '')
    .slice(0, MAX_DIGITOS_TELEFONE)

  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`

  const ddd = digitos.slice(0, 2)
  const resto = digitos.slice(2)

  if (resto.length <= 4) return `(${ddd}) ${resto}`

  // Até 10 dígitos o primeiro bloco tem 4 (fixo); no 11º vira 5 (celular).
  const tamanhoPrefixo = digitos.length === MAX_DIGITOS_TELEFONE ? 5 : 4
  return `(${ddd}) ${resto.slice(0, tamanhoPrefixo)}-${resto.slice(tamanhoPrefixo)}`
}
