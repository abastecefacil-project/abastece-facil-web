<template>
  <div class="seguro">
    <div class="assistencia">
      <span class="assistencia__icone"><v-icon icon="mdi-phone-outline" size="20" /></span>
      <div class="assistencia__textos">
        <h3 class="assistencia__titulo">Assistência 24 horas</h3>
        <a
          class="assistencia__telefone"
          :href="ASSISTENCIA_24H.href"
          :aria-label="`Ligar para a ${ASSISTENCIA_24H.rotulo}: ${ASSISTENCIA_24H.telefone}`"
        >{{ ASSISTENCIA_24H.telefone }}</a>
      </div>
    </div>

    <div class="seguro-grid">
      <div class="seguro-card">
        <h4 class="seguro-card__titulo">Seguro contra terceiros</h4>
        <ul class="seguro-card__lista">
          <li>Cobertura para danos materiais e corporais causados a terceiros em caso de acidente.</li>
        </ul>

        <h4 class="seguro-card__titulo seguro-card__titulo--seguinte">Assistência 24h (exclusiva para frota própria)</h4>
        <ul class="seguro-card__lista">
          <li>Guincho (KM ilimitado)</li>
          <li>Troca de pneu</li>
          <li>Carga de bateria</li>
          <li>Transporte alternativo</li>
          <li>Chaveiro</li>
        </ul>
      </div>

      <div class="seguro-card">
        <h4 class="seguro-card__titulo">Acionamento do Seguro</h4>
        <ul class="seguro-card__lista">
          <li>Através do 0800 ou WhatsApp;</li>
          <li>Registrar o sinistro;</li>
          <li>Fornecer as informações necessárias solicitadas pelo atendente;</li>
          <li><strong>Solicitar dados do terceiro;</strong></li>
          <li><strong>Registrar boletim de ocorrência</strong></li>
          <li><strong>Abrir um Comunique e informar ao líder, gestor, gestora de frotas e AGO, sobre o acidente.</strong></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
// O número vem do módulo único dos contatos do seguro (R8). O visual da seção
// é do R12: o banner em gradiente do azul do Material virou card do design
// system, com o telefone como link tel:.
import { ASSISTENCIA_24H } from '@/config/contatosSeguro'
</script>

<style scoped>
.seguro {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Card do design system (REDESIGN §4.6): borda, raio de 12px, sem sombra. */
.assistencia,
.seguro-card {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.assistencia {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* Tile de ícone (§4.5). */
.assistencia__icone {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-blue-50);
  color: var(--color-blue-700);
}

.assistencia__textos {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.assistencia__titulo {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: 600;
  color: var(--color-text-muted);
}

/* O número é o dado da seção: section-title em blue-600, a cor de link. */
.assistencia__telefone {
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-blue-600);
  text-decoration: none;
  border-radius: var(--radius-sm);
}

.assistencia__telefone:hover {
  text-decoration: underline;
}

.seguro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.seguro-card__titulo {
  margin: 0 0 var(--space-2);
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
  color: var(--color-neutral-900);
}

/* Até o R12 a classe era `.mt-4`, homônima da utilitária do Vuetify. */
.seguro-card__titulo--seguinte {
  margin-top: var(--space-5);
}

.seguro-card__lista {
  margin: 0;
  padding-left: var(--space-5);
  list-style: disc;
}

.seguro-card__lista li {
  margin: var(--space-1) 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

.seguro-card__lista li strong {
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 959px) {
  .assistencia,
  .seguro-card {
    padding: var(--space-5);
  }
}

@media (max-width: 599px) {
  .seguro-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
