import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#16496E',
          secondary: '#0F324C',
          background: '#F7F8FA',
          surface: '#FFFFFF',
          success: '#2E7D32',
          error: '#C62828',
          warning: '#ED6C02',
          info: '#0288D1',
        },
      },
    },
  },
  defaults: {
    // Sem `elevation` aqui: a classe .elevation-N do Vuetify usa !important
    // e sobrescreveria o box-shadow definido no CSS dos cards.
    VCard: {
      rounded: 'lg',
    },
    VBtn: {
      rounded: 'md',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
