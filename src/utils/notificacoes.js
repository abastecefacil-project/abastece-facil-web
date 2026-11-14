// Único lugar que traduz o tipo da notificação em apresentação. O texto sai em
// segmentos para o template destacar nomes sem v-html.
const TIPOS = {
  RECUSA_NEO: {
    icone: 'mdi-credit-card-remove-outline',
    cor: 'error',
    titulo: 'Recusa do cartão Neo',
    texto: (n) => [
      { texto: n.usuarioNome, destaque: true },
      { texto: ' relatou que o Neo não passou no posto ' },
      { texto: n.postoNome, destaque: true },
      { texto: '.' },
    ],
    acao: { rotulo: 'Analisar posto', rota: (n) => ({ name: 'StationAdmin', query: { posto: String(n.postoId) } }) },
  },
  OCORRENCIA: {
    icone: 'mdi-alert-circle-outline',
    cor: 'warning',
    titulo: 'Nova ocorrência',
    texto: (n) => [
      { texto: n.usuarioNome, destaque: true },
      { texto: ` registrou "${n.ocorrenciaTitulo}" no veículo ` },
      { texto: n.ocorrenciaPlaca, destaque: true },
      { texto: '.' },
    ],
    acao: { rotulo: 'Analisar ocorrência', rota: (n) => ({ name: 'OccurrencesAdmin', query: { ocorrencia: String(n.ocorrenciaId) } }) },
  },
}

const DESCONHECIDO = { icone: 'mdi-bell-outline', cor: undefined, titulo: 'Notificação', texto: () => [], acao: null }

export function apresentacaoNotificacao(notificacao) {
  return TIPOS[notificacao?.tipo] ?? DESCONHECIDO
}
