<template>
  <v-footer color="#16496E" elevation="0" class="d-flex align-center justify-center static-footer">
    <span class="footer-text">
      © 2025 Abastece Fácil. Todos os direitos reservados.
    </span>
  </v-footer>
</template>

<style scoped>
.static-footer {
  position: relative;
  max-height: 8vh;
  overflow: hidden; 
  z-index: 1;
  margin: 0;
  width: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding: 12px 16px !important;
  height: auto;
}

.footer-text {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);
}

/* Desktop grande */
@media (min-width: 1920px) {
  .static-footer {
    padding: 16px 24px !important;
    min-height: 60px;
  }

  .footer-text {
    font-size: 1rem;
  }
}

/* Desktop padrão */
@media (min-width: 1280px) and (max-width: 1919px) {
  .static-footer {
    padding: 14px 20px !important;
  }

  .footer-text {
    font-size: 0.9375rem;
  }
}

/* Tablet */
@media (min-width: 960px) and (max-width: 1279px) {
  .static-footer {
    padding: 12px 16px !important;
    min-height: 50px;
  }

  .footer-text {
    font-size: 0.875rem;
  }
}

/* Mobile */
@media (max-width: 959px) {
  .static-footer {
    padding: 10px 12px !important;
    min-height: 45px;
  }

  .footer-text {
    font-size: 0.8125rem;
    text-align: center;
  }
}

/* Mobile pequeno */
@media (max-width: 600px) {
  .static-footer {
    padding: 8px 12px !important;
    min-height: 40px;
  }

  .footer-text {
    font-size: 0.75rem;
  }
}
</style>
