<template>
  <div class="abastecimento-guide">
    <div class="guide-card">
      <h3 class="card-title">Orientações para Abastecimento</h3>
      
      <div class="orientacoes-list">
        <div class="orientacao-item">
          <div class="item-number">1</div>
          <div class="item-content">
            <strong>Verifique a aceitação do cartão:</strong> Confirme se o posto aceita o cartão NEO Facilidades, que fica no carro (na pasta ou porta-luvas).
          </div>
        </div>

        <div class="orientacao-item">
          <div class="item-number">2</div>
          <div class="item-content">
            <strong>Registre as informações:</strong> Anote a quilometragem atual do carro e tenha sua matrícula em mãos.
          </div>
        </div>

        <div class="orientacao-item">
          <div class="item-number">3</div>
          <div class="item-content">
            <strong>Escolha o combustível:</strong> Sempre abasteça com etanol/álcool. Utilize gasolina somente se o posto não tiver etanol disponível.
          </div>
        </div>

        <div class="orientacao-item">
          <div class="item-number">4</div>
          <div class="item-content">
            <strong>Pagamento:</strong> No momento do pagamento, informe a quilometragem e sua matrícula.
          </div>
        </div>

        <div class="orientacao-item">
          <div class="item-number">5</div>
          <div class="item-content">
            <strong>Senha para abastecimento:</strong>
            <ul class="sub-list">
              <li>Deve ter 4 a 6 dígitos (recomenda-se usar o número da matrícula no verso da cracha).</li>
              <li>No primeiro abastecimento, basta digitá-la na maquininha, sem necessidade de cadastro prévio. Essa senha será utilizada nos próximos abastecimentos.</li>
            </ul>
          </div>
        </div>

        <div class="orientacao-item">
          <div class="item-number">6</div>
          <div class="item-content">
            <strong>Problemas com o pagamento:</strong> Se o cartão NEO Facilidades não for aceito, ou houver algum problema no pagamento, você poderá entrar em contato com a Gestora de Frota ou pagar o abastecimento para depois solicitar o reembolso.
          </div>
        </div>
      </div>

      <div class="link-mapa">
        <v-icon icon="mdi-map-marker" color="#1976D2" size="20"></v-icon>
        <span>Link do Mapa: Acesse o menu "Mapa" para visualizar os postos disponíveis</span>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.abastecimento-guide {
  width: 100%;
}

.guide-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #e0e0e0;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #424242;
  margin: 0 0 24px 0;
}

.orientacoes-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.orientacao-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.item-number {
  min-width: 32px;
  height: 32px;
  background-color: #1976D2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  font-size: 14px;
  color: #424242;
  line-height: 1.6;
}

.item-content strong {
  color: #1976D2;
  font-weight: 600;
}

.sub-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  list-style: disc;
}

.sub-list li {
  margin: 4px 0;
  color: #616161;
}

.link-mapa {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 16px;
  background-color: #E3F2FD;
  border-radius: 8px;
  font-size: 14px;
  color: #424242;
}

@media (max-width: 768px) {
  .guide-card {
    padding: 24px 20px;
  }

  .card-title {
    font-size: 1.125rem;
  }

  .orientacoes-list {
    gap: 16px;
  }

  .item-content {
    font-size: 13px;
  }
}
</style>