// Menu lateral e botão superior direito de cada contexto do `AppShell`.
//
// Aqui é apresentação, não autorização. A lista `perfis` de um item decide
// apenas se ele aparece no menu. Quem barra a navegação é o guard do router
// (P0.5), e quem autoriza de verdade é o backend, que valida perfil e regional
// no serviço desde o S2a e responde 403. Não acrescentar regra de negócio a
// este arquivo.
//
// As chaves dos itens (`title`, `icon`, `value`, `to`) são as que os arrays
// `menuItems` dos dois layouts já usavam, para que os bindings do template não
// mudassem na unificação. `perfis` entra com o mesmo nome que o `meta.perfis`
// do router usa, porque é a mesma ideia aplicada a outra camada.

const PERFIS_ADMIN = ['ADMINISTRADOR', 'GESTOR_FROTA']

export const NAVEGACAO = {
  admin: {
    botao: { title: 'Sair', icon: 'mdi-logout' },
    // Os seis itens levam o mesmo `perfis` em vez de uma regra no contexto
    // inteiro: é o que permite um item divergir no futuro sem reescrever o
    // filtro. Hoje nenhum diverge — a única distinção entre gestor e
    // administrador no projeto é *dentro* da tela de usuários (quais perfis um
    // gestor pode criar, e em qual regional), e mora em
    // `components/admin/UserDialog.vue`, não em acesso a tela.
    itens: [
      {
        title: 'Home',
        icon: 'mdi-home',
        value: 'home',
        to: { name: 'AdminDashboard' },
        perfis: PERFIS_ADMIN,
      },
      {
        title: 'Postos',
        icon: 'mdi-gas-station',
        value: 'station',
        to: { name: 'StationAdmin' },
        perfis: PERFIS_ADMIN,
      },
      {
        title: 'Mapa',
        icon: 'mdi-map-marker',
        value: 'mapa',
        to: { name: 'MapAdmin' },
        perfis: PERFIS_ADMIN,
      },
      {
        title: 'Veículos',
        icon: 'mdi-car',
        value: 'veiculos',
        to: { name: 'VehicleAdmin' },
        perfis: PERFIS_ADMIN,
      },
      {
        title: 'Ocorrências',
        icon: 'mdi-alert-circle',
        value: 'ocorrencias',
        to: { name: 'OccurrencesAdmin' },
        perfis: PERFIS_ADMIN,
      },
      {
        title: 'Usuários',
        icon: 'mdi-account-group',
        value: 'usuarios',
        to: { name: 'UsersAdmin' },
        perfis: PERFIS_ADMIN,
      },
    ],
  },

  user: {
    // O rótulo diz "Admin" e a ação é sair. A discrepância é existente e
    // preservada deliberadamente — ver §9, item 8 do CLAUDE.md. Não corrigir
    // aqui: quem quiser mudar o rótulo muda o comportamento junto, num trabalho
    // próprio.
    botao: { title: 'Admin', icon: 'mdi-account-cog' },
    // Nenhum item leva `perfis`, de propósito. `/user/*` é aberto a visitante
    // não autenticado, porque o usuário final não faz login (§1 do CLAUDE.md),
    // e restringir aqui esvaziaria o menu para quem tem `perfil` nulo.
    itens: [
      { title: 'Home', icon: 'mdi-home', value: 'home', to: { name: 'UserDashboard' } },
      {
        title: 'Postos',
        icon: 'mdi-gas-station',
        value: 'station',
        to: { name: 'UserGasStations' },
      },
      { title: 'Mapa', icon: 'mdi-map-marker', value: 'mapa', to: { name: 'MapUser' } },
      {
        title: 'Ocorrências',
        icon: 'mdi-alert',
        value: 'ocorrencias',
        to: { name: 'OccurrencesUser' },
      },
      {
        title: 'Central de Ajuda',
        icon: 'mdi-tooltip-question',
        value: 'sobre',
        to: { name: 'HelpCenter' },
      },
    ],
  },
}

// Item **sem** `perfis` passa para qualquer sessão, inclusive `perfil === null`
// — mesma regra do guard, que libera rota sem `meta.perfis`. O perfil nulo é
// estado real e esperado: `normalizarPerfil` reduz a ele toda sessão anterior ao
// P0.5a e todo valor adulterado à mão.
//
// A função vive aqui, e não no `AppShell`, para poder ser exercitada sem montar
// componente nenhum — este módulo é JS puro, sem import de Vue.
export function itensVisiveis(contexto, perfil) {
  return NAVEGACAO[contexto].itens.filter((item) => !item.perfis || item.perfis.includes(perfil))
}
