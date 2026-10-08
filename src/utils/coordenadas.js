/**
 * Latitude e longitude informadas à mão no cadastro e na edição de posto.
 *
 * Existem para o posto que o serviço de mapas do backend não localiza pelo
 * endereço. Funções puras, sem import de Vue, testadas com `node --test`.
 */

const LIMITES = { latitude: 90, longitude: 180 }
const ROTULOS = { latitude: 'Latitude', longitude: 'Longitude' }

const NUMERO = /^-?\d+(?:\.\d+)?$/

// Pares aceitos na colagem. O primeiro é o que o Google Maps copia.
const NUM = String.raw`-?\d+(?:[.,]\d+)?`
const NUM_PONTO = String.raw`-?\d+\.\d+`
const PARES = [
  // "-26,3045; -48,8487": ponto e vírgula separa, vírgula pode ser decimal.
  new RegExp(String.raw`^(${NUM})\s*;\s*(${NUM})$`),
  // "-26.3045, -48.8487": vírgula seguida de espaço separa.
  new RegExp(String.raw`^(${NUM}),\s+(${NUM})$`),
  // "-26.3045,-48.8487": uma vírgula só, entre dois números com ponto
  // decimal. Exigir o ponto é o que impede "-26,3045" de virar um par.
  new RegExp(String.raw`^(${NUM_PONTO}),(${NUM_PONTO})$`),
]

/**
 * Tira espaços e troca vírgula decimal por ponto. Campo vazio vira null.
 * Não valida: um texto que não é número sai como entrou, e a regra do campo
 * acusa.
 */
export function normalizarCoordenada(valor) {
  if (valor === null || valor === undefined) return null
  const texto = String(valor).trim()
  return texto === '' ? null : texto.replace(',', '.')
}

/**
 * Reconhece um par colado ("-26.3045, -48.8487") e devolve
 * { latitude, longitude } já normalizados, ou null se o texto não for um par.
 * As faixas não são conferidas aqui: o par fora da faixa preenche os campos, e
 * a validação aponta o erro onde ele está.
 */
export function interpretarParCoordenadas(texto) {
  if (typeof texto !== 'string') return null
  const limpo = texto.trim()
  for (const padrao of PARES) {
    const partes = padrao.exec(limpo)
    if (partes) {
      return {
        latitude: normalizarCoordenada(partes[1]),
        longitude: normalizarCoordenada(partes[2]),
      }
    }
  }
  return null
}

/**
 * Regra de um campo: `true` ou a mensagem de erro. `tipo` é 'latitude' ou
 * 'longitude'; `outroValor` é o do campo oposto, porque as duas vão juntas ou
 * nenhuma. A mensagem de par incompleto fica no campo vazio.
 */
export function validarCoordenada(valor, outroValor, tipo) {
  const rotulo = ROTULOS[tipo]
  const limite = LIMITES[tipo]
  const normalizado = normalizarCoordenada(valor)

  if (normalizado === null) {
    return normalizarCoordenada(outroValor) === null || `Informe também a ${rotulo.toLowerCase()}`
  }
  if (!NUMERO.test(normalizado)) return `${rotulo} inválida`
  if (Math.abs(Number(normalizado)) > limite) {
    return `${rotulo} deve estar entre -${limite} e ${limite}`
  }
  return true
}

/**
 * O que vai no corpo da requisição. Contrato com o backend: na edição, as
 * coordenadas só vão quando o administrador as digitou ou alterou. Reenviar as
 * que o formulário carregou faria o backend usá-las mesmo com o endereço
 * mudado, e o marcador nunca mais acompanharia o endereço.
 *
 * Os dois campos vazios também vão null, na criação e na edição: o backend
 * geocodifica, ou mantém as coordenadas se o endereço não mudou. Vão como
 * string numérica, que o backend aceita, para não passar por ponto flutuante.
 */
export function coordenadasParaEnvio({ latitude, longitude, editando, alteradas }) {
  const lat = normalizarCoordenada(latitude)
  const lon = normalizarCoordenada(longitude)
  if (lat === null && lon === null) return { latitude: null, longitude: null }
  if (editando && !alteradas) return { latitude: null, longitude: null }
  return { latitude: lat, longitude: lon }
}

/**
 * Busca do endereço do formulário no Google Maps, para o administrador achar o
 * posto e copiar as coordenadas. Devolve null se não houver endereço nenhum.
 */
export function urlBuscaGoogleMaps({ address, number, district, city, state } = {}) {
  const limpar = (valor) => (valor ?? '').toString().trim()
  const rua = [address, number].map(limpar).filter(Boolean).join(', ')
  const cidade = limpar(city)
  const uf = limpar(state)
  const cidadeUf = cidade && uf ? `${cidade} - ${uf}` : cidade || uf
  const consulta = [rua, limpar(district), cidadeUf].filter(Boolean).join(', ')
  if (!consulta) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`
}

const MENSAGEM_NAO_LOCALIZADO =
  'Endereço não localizado no mapa. Confira o endereço ou informe a latitude e a longitude manualmente.'

/**
 * Se a falha ao salvar é das coordenadas, a mensagem a mostrar na seção; senão
 * null, e o erro segue o tratamento genérico. Recebe o corpo do ErrorResponse.
 *
 * - COORDINATES_NOT_FOUND: o backend não localizou o endereço.
 * - BAD_REQUEST de validação que fala de latitude ou longitude. O backend junta
 *   as mensagens de todos os campos numa só, sem dizer qual falhou, então o
 *   texto é o único sinal. Os demais campos o v-form barra antes do envio.
 */
export function mensagemErroCoordenadas(erro) {
  if (erro?.error === 'COORDINATES_NOT_FOUND') return erro.message || MENSAGEM_NAO_LOCALIZADO
  const mensagem = erro?.message
  if (
    erro?.error === 'BAD_REQUEST' &&
    typeof mensagem === 'string' &&
    mensagem.startsWith('Erro de validação') &&
    /latitude|longitude/i.test(mensagem)
  ) {
    return mensagem
  }
  return null
}
