<template>
  <v-main class="acesso">
    <div class="acesso-layout">
      <!-- Painel da marca: só a partir de md. Abaixo disso a tela é só o
           formulário, com o logo colorido no topo. -->
      <aside class="acesso-marca">
        <img src="@/assets/logoBranco.png" alt="Abastece Fácil" class="acesso-marca__logo" />

        <div class="acesso-marca__corpo">
          <p class="acesso-marca__proposito">
            Postos conveniados e ocorrências da frota em um só lugar.
          </p>

          <!-- Só o que o sistema faz de fato: nada de números nem promessas.
               Os ícones são os do menu (config/navegacao.js), porque o mesmo
               conceito usa o mesmo ícone em todo o sistema. -->
          <ul class="acesso-marca__lista">
            <li v-for="item in funcionalidades" :key="item.texto" class="acesso-marca__item">
              <span class="acesso-marca__icone">
                <v-icon :icon="item.icone" size="20" />
              </span>
              <span>{{ item.texto }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <div class="acesso-formulario">
        <div class="acesso-conteudo">
          <img src="@/assets/logo.png" alt="Abastece Fácil" class="acesso-logo-mobile" />
          <slot />
        </div>
      </div>
    </div>
  </v-main>
</template>

<script setup>
// Layout das quatro telas públicas: login, ativação de conta, pedido de
// recuperação e redefinição de senha. Nasceu no S6a dentro de AtivacaoConta.vue
// e foi extraído no S6b. No R5 virou o layout de duas colunas do redesign
// (docs/redesign/REDESIGN.md §5.2), e o Login passou a usá-lo também.

const funcionalidades = [
  {
    icone: 'mdi-map-marker-outline',
    texto: 'Postos conveniados em lista e no mapa, com a rota até o posto',
  },
  {
    icone: 'mdi-alert-circle-outline',
    texto: 'Registro de ocorrências dos veículos da frota',
  },
  {
    icone: 'mdi-gas-station-outline',
    texto: 'Gestão de postos, veículos e usuários',
  },
]
</script>

<style scoped>
/* As classes compartilhadas pelas views (.acesso-titulo, .acesso-btn...) usam
   :deep() porque o conteúdo de <slot> é compilado com o data-v do PAI, não com
   o deste componente: um seletor escopado normal não alcançaria nada do que as
   views passam para dentro. As do próprio template dispensam o :deep(). */
.acesso {
  background: var(--color-surface);
}

.acesso-layout {
  display: grid;
  grid-template-columns: 42% 1fr;
  min-height: 100vh;
}

/* ── painel da marca ─────────────────────────────────────────────────────── */

.acesso-marca {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
  background: var(--color-blue-900);
  color: var(--color-neutral-0);
}

.acesso-marca__logo {
  height: 44px;
  width: auto;
  align-self: flex-start;
}

/* Centrado no espaço que sobra abaixo do logo. */
.acesso-marca__corpo {
  margin: auto 0;
  max-width: 440px;
}

.acesso-marca__proposito {
  margin: 0 0 var(--space-10);
  font-size: var(--text-kpi-size);
  line-height: var(--text-kpi-line);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.acesso-marca__lista {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.acesso-marca__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--text-body-lg-size);
  line-height: var(--text-body-lg-line);
  color: var(--color-sidebar-text);
}

/* Mesmo tile da sidebar ativa: branco a 10% sobre o blue-900. */
.acesso-marca__icone {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-sidebar-active);
  color: var(--color-blue-200);
}

/* ── formulário ──────────────────────────────────────────────────────────── */

.acesso-formulario {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-8);
}

.acesso-conteudo {
  width: 100%;
  max-width: 400px;
}

.acesso-logo-mobile {
  display: none;
  height: 40px;
  width: auto;
  margin-bottom: var(--space-8);
}

@media (max-width: 959.98px) {
  .acesso-layout {
    grid-template-columns: 1fr;
  }

  .acesso-marca {
    display: none;
  }

  .acesso-formulario {
    align-items: flex-start;
    padding: var(--space-10) var(--space-4);
  }

  .acesso-logo-mobile {
    display: block;
  }
}

/* ── classes usadas pelas views ──────────────────────────────────────────── */

:deep(.acesso-titulo) {
  margin: 0;
  font-size: var(--text-page-title-size);
  line-height: var(--text-page-title-line);
  font-weight: var(--text-page-title-weight);
  color: var(--color-neutral-900);
}

:deep(.acesso-texto) {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

/* Tile do ícone das telas de estado (link inválido, falha, e-mail enviado).
   Âmbar por padrão: são situações que pedem atenção. */
:deep(.acesso-icone) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-warning-bg);
  color: var(--color-warning-icon);
}

:deep(.acesso-icone--info) {
  background: var(--color-blue-50);
  color: var(--color-blue-700);
}

/* Botão de ação: largura total, no padrão do design system (40px, peso 500,
   sem sombra). Não redefine raio nem peso: vêm do default do VBtn e do
   main.css. */
:deep(.acesso-btn) {
  width: 100%;
}

/* Secundário (§4.6): ação de navegação nas telas de estado ("Ir para o login",
   "Pedir um novo link"). Ação de recuperação ("Tentar novamente") continua
   primária. */
:deep(.acesso-btn--secundario) {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
}

:deep(.acesso-btn--secundario:hover) {
  border-color: var(--color-neutral-400);
}

/* Link terciário. O foco visível vem da regra global de main.css. */
:deep(.acesso-link) {
  color: var(--color-blue-600);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: 500;
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}

:deep(.acesso-link:hover) {
  color: var(--color-blue-800);
  text-decoration: underline;
}
</style>
