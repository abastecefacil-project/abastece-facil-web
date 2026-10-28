<template>
  <div class="guia">
    <h3 class="guia__titulo">Orientações para Abastecimento</h3>

    <!-- O número visível é decorativo: a posição já vem da própria lista. -->
    <ol class="passos">
      <li class="passo">
        <span class="passo__numero" aria-hidden="true">1</span>
        <div class="passo__texto">
          <strong>Verifique a aceitação do cartão:</strong> Confirme se o posto aceita o cartão NEO Facilidades, que fica no carro (na pasta ou porta-luvas).
        </div>
      </li>

      <li class="passo">
        <span class="passo__numero" aria-hidden="true">2</span>
        <div class="passo__texto">
          <strong>Registre as informações:</strong> Anote a quilometragem atual do carro e tenha sua matrícula em mãos.
        </div>
      </li>

      <li class="passo">
        <span class="passo__numero" aria-hidden="true">3</span>
        <div class="passo__texto">
          <strong>Escolha o combustível:</strong> Sempre abasteça com etanol/álcool. Utilize gasolina somente se o posto não tiver etanol disponível.
        </div>
      </li>

      <li class="passo">
        <span class="passo__numero" aria-hidden="true">4</span>
        <div class="passo__texto">
          <strong>Pagamento:</strong> No momento do pagamento, informe a quilometragem e sua matrícula.
        </div>
      </li>

      <li class="passo">
        <span class="passo__numero" aria-hidden="true">5</span>
        <div class="passo__texto">
          <strong>Senha para abastecimento:</strong>
          <ul class="passo__sublista">
            <li>Deve ter 4 a 6 dígitos (recomenda-se usar o número da matrícula no verso da cracha).</li>
            <li>No primeiro abastecimento, basta digitá-la na maquininha, sem necessidade de cadastro prévio. Essa senha será utilizada nos próximos abastecimentos.</li>
          </ul>
        </div>
      </li>

      <li class="passo">
        <span class="passo__numero" aria-hidden="true">6</span>
        <div class="passo__texto">
          <strong>Problemas com o pagamento:</strong> Se o cartão NEO Facilidades não for aceito, ou houver algum problema no pagamento, você poderá entrar em contato com a Gestora de Frota ou pagar o abastecimento para depois solicitar o reembolso.
        </div>
      </li>
    </ol>

    <!-- Até o R12 era um banner "Link do Mapa" sem link. -->
    <div class="guia__mapa">
      <p class="guia__mapa-texto">Acesse o menu "Mapa" para visualizar os postos disponíveis</p>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-map-marker-outline"
        :to="{ name: 'MapUser' }"
        class="btn-secundario"
      >
        Abrir mapa
      </v-btn>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* Card do design system (REDESIGN §4.6): borda, raio de 12px, sem sombra. */
.guia {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.guia__titulo {
  margin: 0 0 var(--space-5);
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
}

.passos {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.passo {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

/* Número do passo em blue-700 sobre blue-50, o mesmo par do tile de ícone
   (§4.5). Substitui o círculo no azul do Material. */
.passo__numero {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-blue-50);
  color: var(--color-blue-700);
  font-size: var(--text-body-size);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Texto de orientação em body-lg (§4.2). */
.passo__texto {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
  font-size: var(--text-body-lg-size);
  line-height: var(--text-body-lg-line);
  color: var(--color-text);
}

.passo__texto strong {
  font-weight: 600;
  color: var(--color-neutral-900);
}

.passo__sublista {
  margin: var(--space-2) 0 0;
  padding-left: var(--space-5);
  list-style: disc;
}

.passo__sublista li {
  margin: var(--space-1) 0;
  color: var(--color-text-muted);
}

.guia__mapa {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.guia__mapa-texto {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

/* Botão secundário (§4.6), o mesmo da Início. A classe dobrada vence o
   outlined do Vuetify, que herdaria a cor do texto na borda. */
.v-btn.btn-secundario {
  flex-shrink: 0;
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}

@media (max-width: 959px) {
  .guia {
    padding: var(--space-5);
  }

  .passos {
    gap: var(--space-4);
  }
}

/* No celular o botão vai para baixo do texto e ocupa a largura toda. */
@media (max-width: 599px) {
  .guia__mapa {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
