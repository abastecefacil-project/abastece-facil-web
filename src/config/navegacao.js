// Menu lateral de cada contexto do `AppShell`.
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
    // Os seis itens levam o mesmo `perfis` em vez de uma regra no contexto
    // inteiro: é o que permite um item divergir no futuro sem reescrever o
    // filtro. Hoje nenhum diverge — a única distinção entre gestor e
    // administrador no projeto é *dentro* da tela de usuários (quais perfis um
    // gestor pode criar, e em qual regional), e mora em
    // `components/admin/UserDialog.vue`, não em acesso a tela.
    //
    // `grupo` é o rótulo de seção da sidebar e o primeiro nível do breadcrumb
    // (REDESIGN §5.1). O `AppShell` agrupa itens consecutivos com o mesmo
    // `grupo`, então a ordem do array é a ordem dos grupos na tela.
    itens: [
      {
        title: 'Painel',
        icon: 'mdi-view-dashboard-outline',
        value: 'home',
        to: { name: 'AdminDashboard' },
        perfis: PERFIS_ADMIN,
        grupo: 'Visão geral',
      },
      {
        title: 'Mapa',
        icon: 'mdi-map-marker-outline',
        value: 'mapa',
        to: { name: 'MapAdmin' },
        perfis: PERFIS_ADMIN,
        grupo: 'Visão geral',
      },
      {
        title: 'Ocorrências',
        icon: 'mdi-alert-circle-outline',
        value: 'ocorrencias',
        to: { name: 'OccurrencesAdmin' },
        perfis: PERFIS_ADMIN,
        grupo: 'Operação',
      },
      {
        title: 'Postos',
        icon: 'mdi-gas-station-outline',
        value: 'station',
        to: { name: 'StationAdmin' },
        perfis: PERFIS_ADMIN,
        grupo: 'Cadastros',
      },
      {
        title: 'Veículos',
        icon: 'mdi-car-outline',
        value: 'veiculos',
        to: { name: 'VehicleAdmin' },
        perfis: PERFIS_ADMIN,
        grupo: 'Cadastros',
      },
      {
        title: 'Usuários',
        icon: 'mdi-account-group-outline',
        value: 'usuarios',
        to: { name: 'UsersAdmin' },
        perfis: PERFIS_ADMIN,
        grupo: 'Cadastros',
      },
    ],
  },

  user: {
    // Nenhum item leva `perfis`, de propósito. `/user/*` exige login
    // (`meta.requiresAuth` no router), mas aceita qualquer perfil, inclusive
    // `null` — sessão anterior ao P0.5a ou valor adulterado que
    // `normalizarPerfil` zerou. Restringir aqui esvaziaria o menu dessa sessão.
    // Também não há `grupo`: o menu do colaborador é curto e vem sem seções.
    itens: [
      {
        title: 'Início',
        icon: 'mdi-home-outline',
        value: 'home',
        to: { name: 'UserDashboard' },
      },
      { title: 'Mapa', icon: 'mdi-map-marker-outline', value: 'mapa', to: { name: 'MapUser' } },
      {
        title: 'Postos',
        icon: 'mdi-gas-station-outline',
        value: 'station',
        to: { name: 'UserGasStations' },
      },
      {
        title: 'Ocorrências',
        icon: 'mdi-alert-circle-outline',
        value: 'ocorrencias',
        to: { name: 'OccurrencesUser' },
      },
      {
        title: 'Central de Ajuda',
        icon: 'mdi-help-circle-outline',
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

// Seções da sidebar: itens consecutivos com o mesmo `grupo` viram uma seção.
// Item sem `grupo` cai numa seção de `grupo: null`, que o `AppShell` desenha sem
// rótulo — é o caso do menu inteiro do colaborador. Recebe a lista já filtrada
// por `itensVisiveis`, então um grupo sem nenhum item visível nem aparece.
export function agruparPorGrupo(itens) {
  const secoes = []
  for (const item of itens) {
    const grupo = item.grupo ?? null
    const ultima = secoes.at(-1)
    if (ultima && ultima.grupo === grupo) ultima.itens.push(item)
    else secoes.push({ grupo, itens: [item] })
  }
  return secoes
}
