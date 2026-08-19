# Refatoração visual do frontend — Abastece Fácil

Documentação das alterações de interface aplicadas ao frontend Vue 3 + Vuetify.

**Natureza da mudança:** refatoração incremental de UI/UX.
**Escopo:** exclusivamente CSS e templates. Nenhuma alteração de lógica de negócio,
contrato de API ou backend.

---

## 1. Princípio adotado

A intervenção foi guiada por três regras:

1. **Preservar a identidade existente.** O sistema já era azul; a paleta partiu das
   cores que o próprio projeto usava (`#16496E` na barra superior, `#0F324C` no menu
   lateral), em vez de introduzir uma paleta nova.
2. **Não alterar comportamento.** Onde uma melhoria visual era possível apenas com
   CSS, não se tocou no JavaScript.
3. **Não reestruturar.** Nenhuma pasta foi movida, nenhum componente foi renomeado,
   nenhuma biblioteca foi adicionada.

O diagnóstico inicial identificou que a maior fonte de inconsistência visual não era
a ausência de estilo, mas a **dispersão**: mais de 25 cores hexadecimais fixas
espalhadas pelos arquivos `.vue`, com **quatro azuis diferentes cumprindo a mesma
função** (`#16496E`, `#0D47A1`, `#1976D2`, `#1f5077`). A estratégia foi, portanto,
centralizar antes de estilizar.

---

## 2. Camada de fundação

### 2.1 Tokens de design — `src/assets/main.css`

Foram definidas variáveis CSS em `:root`, consumidas por todos os componentes:

| Token | Valor | Função |
|---|---|---|
| `--color-primary` | `#16496E` | Cor de marca e ações principais |
| `--color-primary-soft` | `#E8EFF5` | Fundo de ícones e realces suaves |
| `--color-background` | `#F7F8FA` | Fundo geral das páginas |
| `--color-surface` | `#FFFFFF` | Cards e superfícies elevadas |
| `--color-border` | `#E3E7EC` | Bordas de cards |
| `--color-border-strong` | `#CFD6DE` | Bordas de campos de formulário |
| `--color-text` | `#1F2933` | Texto principal |
| `--color-text-muted` | `#6B7785` | Texto secundário |
| `--color-warning` | `#ED6C02` | Alerta (usado no overlay do mapa) |
| `--radius-sm/md/lg` | `6px / 10px / 14px` | Raios de borda |
| `--shadow-sm/md` | sombras discretas | Elevação |
| `--transition` | `180ms ease` | Duração das microinterações |

`success` e `error` **não** têm token próprio: vêm do tema do Vuetify, para não
existirem duas fontes de verdade para a mesma cor.

O arquivo também define a tipografia de página (`.page-title`, `.page-subtitle`) e
normaliza botões e campos.

> **Nota sobre especificidade.** As regras globais que sobrescrevem o Vuetify são
> prefixadas com `.v-application`. Isso é necessário porque, no servidor de
> desenvolvimento, o CSS do Vuetify é injetado **depois** do `main.css`: com a mesma
> especificidade, o padrão do Vuetify venceria a cascata. O prefixo torna o
> resultado independente da ordem de injeção.

### 2.2 Tema do Vuetify — `src/plugins/vuetify.js`

O tema `light` estava sem paleta customizada, ou seja, todo `color="primary"` do
projeto resolvia para o azul padrão do Vuetify. Foram registrados:

- **Cores:** `primary`, `secondary`, `background`, `surface`, `success`, `error`,
  `warning`, `info`
- **Defaults de componentes:** `VCard` (raio), `VBtn` (raio), `VTextField`,
  `VSelect`, `VTextarea` (variante `outlined`, densidade `comfortable`, cor `primary`)

Esta foi a alteração de maior alcance: padronizou dezenas de componentes sem
modificá-los individualmente.

> **Atenção para manutenção futura:** não definir `elevation` nos defaults do
> `VCard`. A classe `.elevation-N` do Vuetify usa `!important` e anularia o
> `box-shadow` definido no CSS dos cards. Isso foi detectado e corrigido durante
> a implementação.

---

## 3. Alterações por arquivo

### Layout e navegação

| Arquivo | Alteração |
|---|---|
| `src/layouts/AdminLayout.vue` | Sidebar e header modernizados |
| `src/layouts/DefaultLayout.vue` | Idem, aplicado em paralelo |

**Sidebar:** item ativo passou a ter fundo levemente mais claro **e barra lateral
branca de 3px**; hover discreto; label "MENU" em caixa-alta reduzida; espaçamento e
altura dos itens ajustados; opacidade dos ícones uniformizada.

**Header:** sombra removida (`elevation` 2 → 0), divisor vertical adicionado e
**indicação da seção atual** exibida ao lado do logo. O nome da seção é derivado do
próprio array `menuItems` cruzado com a rota ativa — nenhum texto novo foi inventado.
O logo foi reduzido de 65px para 44px, que era o elemento de maior peso visual.

**Preservado sem alteração:** modo `rail` (colapso), comportamento mobile
(drawer temporário, botão hambúrguer), tooltips no modo colapsado, todos os
handlers e os itens de menu.

> **Observação estrutural.** `AdminLayout.vue` e `DefaultLayout.vue` são
> praticamente idênticos (228 e 230 linhas), divergindo apenas no array `menuItems`
> e no botão superior direito. Toda a lógica de drawer/rail/resize está duplicada.
> A unificação **não** foi feita por representar reestruturação, fora do escopo
> desta etapa. Fica registrada como oportunidade de melhoria.

### Componentes compartilhados

| Arquivo | Alteração |
|---|---|
| `src/components/app/Footer.vue` | Sombra removida; texto com opacidade reduzida e corpo menor |
| `src/components/app/SearchFilterBar.vue` | Campo de busca e botão de filtro com bordas e alturas padronizadas; hover no botão; `actionColor` padrão passou de `#0D47A1` para `primary` |
| `src/components/app/PaginationBar.vue` | Botões circulares com sombra → quadrados de raio moderado, borda sutil e hover |
| `src/components/app/PopupStation.vue` | Cabeçalho com divisor; hierarquia tipográfica; botão "Ver rota" de verde para a cor primária |

### Telas de usuário

| Arquivo | Alteração |
|---|---|
| `src/views/user/GasStations.vue` | Espaçamento da página, estado vazio e responsividade |
| `src/components/user/GasStationCard.vue` | Ver abaixo |
| `src/views/user/Occurrences.vue` | Fundo e cabeçalho alinhados ao card do formulário |
| `src/components/user/OccurrenceForm.vue` | Ver abaixo |
| `src/views/user/UserDashboard.vue` | Fundo via token; props mortas removidas |
| `src/components/user/DashboardCard.vue` | Ver abaixo |

**Card de posto:** o ícone estava num círculo **vermelho** (`#EF5350`) — cor que
passou a ser reservada a erro e alerta. Substituído por quadrado arredondado com
fundo `--color-primary-soft` e ícone na cor primária. O hover deixou de usar
`transform: translateY(-2px)` e passa a destacar pela borda, um efeito mais sóbrio.

**Formulário de ocorrências:** campos agrupados em um card branco com cabeçalho
"Dados da ocorrência" e a indicação de campos obrigatórios. Rodapé de ações separado
por divisor, com **Cancelar** como botão secundário (contorno) e **Cadastrar** como
primário — antes ambos eram sólidos, competindo por atenção. No mobile, os campos
Placa/Nome e Título/Data passaram de `cols="6"` para `cols="12" sm="6"`, empilhando
em telas estreitas em vez de ficarem espremidos.

**Regras de validação, payload e `handleSubmit` permaneceram inalterados.**

**Card do dashboard:** botão de "Acessar" passou a usar a cor primária do tema;
círculo do passo virou quadrado arredondado na cor primária.

### Telas administrativas

| Arquivo | Alteração |
|---|---|
| `src/views/admin/AdminDashboard.vue` | Fundo via token |
| `src/views/admin/StationMap.vue` | Overlays de carregamento e de erro de permissão |
| `src/views/admin/StationManagement.vue` | Removido `action-color="#0D47A1"` |
| `src/views/admin/UserManagement.vue` | Removido `action-color="#0D47A1"` |
| `src/views/admin/VehicleManagement.vue` | Removido `action-color="#0D47A1"` |
| `src/components/admin/StatsCards.vue` | Ver abaixo |
| `src/components/admin/DashboardHeader.vue` | Tipografia delegada às classes globais |

**Cards de indicadores:** os quatro ícones usavam quatro cores distintas
(vermelho, azul, roxo, amarelo), o que fragmentava a leitura. Passaram a um
contêiner único com fundo suave e ícone na cor primária. A chave `color` do array
`stats`, agora sem uso, foi removida.

**Mapa:** apenas o entorno foi tratado. Os overlays ganharam ícone e indicador de
progresso, borda e sombra consistentes com os cards. **A integração Leaflet,
o cluster de marcadores, a chamada de API e a lógica de geolocalização não foram
tocados.**

---

## 4. Defeitos pré-existentes encontrados

Três problemas já existiam no projeto e vieram à tona durante a análise:

### 4.1 `src/assets/base.css` nunca foi importado

O arquivo não é carregado por `main.js`, por `index.html` nem pelos layouts —
somente `main.css` é. Trata-se de resíduo do scaffold inicial do Vue, e contém
inclusive um bloco `@media (prefers-color-scheme: dark)` que redefiniria fundo e
texto.

**Consequência prática:** foi por isso que os tokens foram declarados em `main.css`.
Colocá-los em `base.css` não teria efeito algum.

**Status:** o arquivo foi mantido intacto e continua sem uso. Pode ser removido com
segurança.

### 4.2 O destaque da página ativa na paginação nunca funcionou

O CSS usava o seletor `.v-pagination__item--active`, mas o Vuetify 3 aplica
`.v-pagination__item--is-active`. A regra portanto nunca chegava a valer, e a página
corrente não era destacada.

**Status:** corrigido em `PaginationBar.vue`, com comentário explicativo no código.

### 4.3 Ordem de injeção de CSS no ambiente de desenvolvimento

Descrito na seção 2.1. Contornado com o prefixo `.v-application`.

---

## 5. Regressões introduzidas durante a implementação e corrigidas

Registradas por transparência e para evitar reincidência:

| Problema | Causa | Correção |
|---|---|---|
| Cards perderam a sombra | `elevation: 0` nos defaults do `VCard` gera `.elevation-0` com `!important` | Propriedade removida dos defaults |
| Campos inválidos perderam a borda vermelha | A regra global de borda de campo sobrescrevia o estado de erro do Vuetify | Adicionado `:not(.v-field--error)` aos seletores |
| Círculo do passo saía azul-claro do Vuetify | A prop `colorClass="bg-blue"` colidia com a classe utilitária `.bg-blue` do Vuetify, que é `!important` | Prop removida; cor aplicada diretamente |

---

## 6. O que **não** foi alterado

Esta lista é parte da documentação porque delimita o escopo da intervenção:

- Backend Java — nenhum arquivo tocado
- Endpoints, métodos HTTP, payloads e formatos de resposta
- `src/services/` — todos os cinco serviços e o `apiClient` intactos
- `src/stores/` — store de autenticação intacta
- `src/router/index.js` — rotas e guard de autenticação intactos
- Regras de validação de formulário
- Integração Leaflet e lógica de geolocalização
- Biblioteca de ícones (Material Design Icons, já em uso) — nada foi instalado
- Fonte (Manrope, já em uso)
- Estrutura de pastas e nomes de componentes
- `src/assets/base.css`

**Nenhuma dependência foi adicionada ao `package.json`.**

---

## 7. Verificação executada

| Verificação | Resultado |
|---|---|
| Build de produção (`npm run build`) | Passa — `✓ built in 11.22s` |
| Lint (`npx eslint src`) | 15 erros, **todos pré-existentes**; contagem não aumentou |
| Rotas montadas sem erro | 10 de 10 |
| Erros de console | Nenhum nas telas públicas |
| Carregamento de postos | `GET /api/public/gas-stations/filter` → 200 |
| Mapa | Leaflet montado, 15 tiles, 3 marcadores, popup com link de rota correto |
| Validação do formulário | As 4 regras disparam e bloqueiam o envio (0 requisições) |
| Estado de erro de campo | Borda e mensagem em `#C62828` |
| Responsividade | Sem estouro horizontal em 375px, 768px e desktop |

Os 15 erros de lint referem-se a nomes de componente de palavra única
(`Map`, `Login`, `Reports`, `Occurrences`) e variáveis não utilizadas
(`unwatchMobile`, `response`, `error`, `deletarPosto`, `apiPublic`), todos em
trechos não modificados por esta refatoração.

### Limitações da verificação

Três pontos não puderam ser cobertos e ficam registrados:

1. **O formulário de ocorrência não foi submetido.** A validação foi testada apenas
   no lado cliente, para não gravar registros de teste no banco. O caminho de
   submissão não foi modificado.
2. **As telas administrativas foram verificadas apenas quanto a layout**, usando um
   token fictício para atravessar o guard de rota. As chamadas de dados retornaram
   403, como esperado — o que confirma que a autenticação continua funcionando.
3. **Não foram capturadas imagens** das telas durante a implementação.

---

## 8. Arquivos alterados — 21

```
src/assets/main.css                          (tokens + base global)
src/plugins/vuetify.js                       (tema + defaults)

src/layouts/AdminLayout.vue                  (sidebar + header)
src/layouts/DefaultLayout.vue                (sidebar + header)

src/components/app/Footer.vue
src/components/app/SearchFilterBar.vue
src/components/app/PaginationBar.vue
src/components/app/PopupStation.vue

src/components/user/GasStationCard.vue
src/components/user/OccurrenceForm.vue
src/components/user/DashboardCard.vue

src/components/admin/StatsCards.vue
src/components/admin/DashboardHeader.vue

src/views/user/GasStations.vue
src/views/user/Occurrences.vue
src/views/user/UserDashboard.vue

src/views/admin/AdminDashboard.vue
src/views/admin/StationMap.vue
src/views/admin/StationManagement.vue
src/views/admin/UserManagement.vue
src/views/admin/VehicleManagement.vue
```

Fora de `src/`, foi criado o arquivo `.env` na raiz do frontend (não versionado),
necessário para a execução local. Ver seção 9.

---

## 9. Nota sobre variáveis de ambiente

O `.env.example` e o `README.md` documentam apenas `VITE_API_PROXY_TARGET`, mas
`src/services/apiClient.js` lê **`VITE_API_BASE_URL`**, que não está documentada.

Como todos os serviços já chamam caminhos iniciados por `/api/...`,
`VITE_API_BASE_URL` deve permanecer **vazia** em desenvolvimento: assim as
requisições saem relativas e são capturadas pelo proxy do Vite, que as encaminha ao
backend. Preenchê-la com `http://localhost:8081` faz as chamadas contornarem o proxy
e resultarem em erro de CORS.

```env
VITE_API_PROXY_TARGET="http://localhost:8081"
VITE_API_BASE_URL=
```

Recomenda-se acrescentar `VITE_API_BASE_URL` ao `.env.example`.
