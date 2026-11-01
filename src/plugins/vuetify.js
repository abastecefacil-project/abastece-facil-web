import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { pt } from 'vuetify/locale'

// Tema do Vuetify. Os valores repetem os tokens de assets/main.css
// (docs/redesign/REDESIGN.md §4.1): o tema não lê CSS custom properties, então
// os dois arquivos precisam andar juntos.
//
// As cores semânticas usam o valor de TEXTO da tabela de semânticas, não o de
// ícone: é com essa cor que o Vuetify escreve o texto de chips e alertas tonais,
// e só ela passa 4,5:1 sobre o fundo claro.
export default createVuetify({
  components,
  directives,
  // Textos internos do Vuetify (paginação, "Nenhum dado", rótulos do date
  // picker) em português.
  locale: {
    locale: 'pt',
    fallback: 'en',
    messages: { pt },
  },
  // O adaptador de datas não traduz 'pt' sozinho, porque o código vale para
  // pt-PT e pt-BR. Sem este mapa, o date picker formata mês e dia da semana
  // com o idioma do navegador.
  date: {
    locale: { pt: 'pt-BR' },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#16496E', // blue-700
          secondary: '#4B5866', // neutral-600
          background: '#F5F7FA', // neutral-50
          surface: '#FFFFFF', // neutral-0
          success: '#1E7A4F',
          warning: '#8F5B0A',
          error: '#B42318',
          info: '#20558C',
          // Fundo do VTooltip, além de VSnackbar, VBadge sem cor e chips
          // flat/elevated. Branco sobre neutral-800 dá 14,1:1.
          'surface-variant': '#232C36', // neutral-800
          'on-surface-variant': '#FFFFFF',
          // Fundo da sidebar do AppShell (blue-900). Como cor do tema, o
          // Vuetify calcula sozinho o texto branco por cima.
          sidebar: '#0C2741',
        },
      },
    },
  },
  defaults: {
    // VCard sem default nenhum, de propósito: nem `elevation` nem `rounded`. As
    // classes .elevation-N e .rounded-* do Vuetify usam !important e anulariam
    // a sombra zerada e o raio de 12px que main.css dá aos cards.
    //
    // 'lg' gera .rounded-lg, 8px com !important: o raio do botão sai da própria
    // classe, sem disputa com o CSS. A altura de 40px fica em main.css, via
    // --v-btn-height, porque a prop `height` como default valeria também para
    // botões de ícone e de tamanho small.
    VBtn: {
      rounded: 'lg',
      elevation: 0,
    },
    // Num grupo, quem arredonda é o contêiner; os botões de dentro ficam retos,
    // senão o 'lg' acima abriria cantos internos no segmentado.
    VBtnGroup: {
      rounded: 'lg',
      VBtn: { rounded: 0 },
    },
    VBtnToggle: {
      rounded: 'lg',
      VBtn: { rounded: 0 },
    },
    // Campos: 'lg' gera .rounded-lg, 8px (§4.4), no VField; o contorno do
    // outlined herda o raio. Os quatro componentes levam o default porque o
    // VSelect e o VAutocomplete não herdam o do VTextField.
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
