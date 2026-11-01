<template>
  <div class="ajuda">
    <PageHeader titulo="Central de Ajuda" subtitulo="Orientações sobre abastecimento e seguro frota" />

    <nav class="ajuda-ancoras" aria-label="Seções da Central de Ajuda">
      <a
        v-for="secao in SECOES_AJUDA"
        :key="secao.id"
        :href="`#${secao.id}`"
        class="ajuda-ancora"
        @click.prevent="irPara(secao.id)"
      >
        <v-icon :icon="secao.icone" size="16" />
        {{ secao.titulo }}
      </a>
      <a
        :href="`#${ID_CONTATOS_AJUDA}`"
        class="ajuda-ancora ajuda-ancora--contatos"
        @click.prevent="irPara(ID_CONTATOS_AJUDA)"
      >
        <v-icon icon="mdi-phone-outline" size="16" />
        Contatos
      </a>
    </nav>

    <div class="ajuda-grid">
      <div class="ajuda-conteudo">
        <section :id="abastecimento.id" class="ajuda-secao" :aria-labelledby="`${abastecimento.id}-titulo`">
          <div class="ajuda-secao__cabecalho">
            <span class="ajuda-secao__icone"><v-icon :icon="abastecimento.icone" size="20" /></span>
            <h2 :id="`${abastecimento.id}-titulo`" class="ajuda-secao__titulo" tabindex="-1" data-foco-ancora>
              {{ abastecimento.titulo }}
            </h2>
          </div>
          <AbastecimentoGuide />
        </section>

        <section :id="seguro.id" class="ajuda-secao" :aria-labelledby="`${seguro.id}-titulo`">
          <div class="ajuda-secao__cabecalho">
            <span class="ajuda-secao__icone"><v-icon :icon="seguro.icone" size="20" /></span>
            <h2 :id="`${seguro.id}-titulo`" class="ajuda-secao__titulo" tabindex="-1" data-foco-ancora>
              {{ seguro.titulo }}
            </h2>
          </div>
          <SeguroInfo />
        </section>

        <section :id="perguntas.id" class="ajuda-secao" :aria-labelledby="`${perguntas.id}-titulo`">
          <div class="ajuda-secao__cabecalho">
            <span class="ajuda-secao__icone"><v-icon :icon="perguntas.icone" size="20" /></span>
            <h2 :id="`${perguntas.id}-titulo`" class="ajuda-secao__titulo" tabindex="-1" data-foco-ancora>
              {{ perguntas.titulo }}
            </h2>
          </div>

          <v-text-field
            v-model="searchQuery"
            label="Pesquisar dúvidas"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            class="ajuda-busca"
          ></v-text-field>

          <div v-if="filteredFaqs.length" class="ajuda-perguntas">
            <FaqItem
              v-for="faq in filteredFaqs"
              :key="faq.id"
              :question="faq.question"
              :answer="faq.answer"
            />
          </div>
          <EmptyState
            v-else
            icone="mdi-help-circle-outline"
            titulo="Nenhuma pergunta encontrada"
            texto="Tente ajustar sua pesquisa"
            class="ajuda-vazio"
          />
        </section>
      </div>

      <!-- Depois do conteúdo no DOM também no desktop: a ordem de leitura é a
           mesma em todas as larguras, e o grid só põe o card na coluna ao lado. -->
      <aside :id="ID_CONTATOS_AJUDA" class="ajuda-contatos" tabindex="-1" aria-labelledby="contatos-titulo">
        <ContactSection />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AbastecimentoGuide from '@/components/user/AbastecimentoGuide.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import SeguroInfo from '@/components/user/SeguroInfo.vue'
import FaqItem from '@/components/user/FaqItem.vue'
import ContactSection from '@/components/user/ContactSection.vue'
import { SECOES_AJUDA, ID_CONTATOS_AJUDA, filtrarPerguntas } from '@/utils/ajuda'

const [abastecimento, seguro, perguntas] = SECOES_AJUDA

// Âncoras (R12). O clique não segue o fragmento: com createWebHistory o
// vue-router o trataria como navegação, e o fragmento nativo rola sem mover o
// foco. Rola até a seção e põe o foco no título dela (ou no card de contatos),
// para o teclado e o leitor de tela continuarem dali.
const irPara = (id) => {
  const destino = document.getElementById(id)
  if (!destino) return
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  destino.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'start' })
  const alvo = destino.querySelector('[data-foco-ancora]') ?? destino
  alvo.focus({ preventScroll: true })
}

const searchQuery = ref('')

const faqs = ref([
  {
    id: 1,
    question: 'Posso usar qualquer tipo de combustível?',
    answer:
      'Sempre abasteça com etanol/álcool. Utilize gasolina somente se o posto não tiver etanol disponível.',
  },
  {
    id: 2,
    question: 'O que fazer se esquecer minha senha de abastecimento?',
    answer:
      'A senha deve ter de 4 a 6 dígitos. Recomenda-se usar o número da matrícula no verso da cracha. Entre em contato com a gestora de frota se precisar redefinir.',
  },
  {
    id: 3,
    question: 'Preciso cadastrar previamente para o primeiro abastecimento?',
    answer:
      'Não, no primeiro abastecimento basta digitar sua senha na maquininha, sem necessidade de cadastro prévio.',
  },
  {
    id: 4,
    question: 'O seguro cobre quais tipos de assistência?',
    answer:
      'O seguro oferece assistência 24h com guincho (KM ilimitado), troca de pneu, carga de bateria, transporte alternativo e chaveiro.',
  },
  {
    id: 5,
    question: 'Qual o limite de quilometragem para o guincho?',
    answer: 'O guincho é ilimitado em quilometragem, disponível 24 horas por dia.',
  },
  {
    id: 6,
    question: 'O que é necessário informar ao acionar o seguro?',
    answer:
      'Você deve registrar o sinistro, fornecer informações solicitadas pelo atendente, solicitar dados do terceiro, registrar boletim de ocorrência e abrir um Comunique informando líder, gestor, gestora de frotas e AGO.',
  },
])

const filteredFaqs = computed(() => filtrarPerguntas(faqs.value, searchQuery.value))
</script>

<style scoped>
/* Fundo e rolagem são do AppShell. Largura da Central na §4.3 (1120px),
   alinhada à esquerda como as outras telas; padding de 32px no desktop e 16px
   abaixo de md. */
.ajuda {
  max-width: 1120px;
  padding: var(--space-8);
}

/* ── Âncoras ────────────────────────────────────────────────────────────── */
.ajuda-ancoras {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

/* Chip de navegação: pílula neutra, destaque por borda no hover (§4.6). O
   foco visível vem da regra global de main.css para `a`. */
.ajuda-ancora {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: 500;
  text-decoration: none;
  transition:
    border-color var(--transition),
    background-color var(--transition);
}

.ajuda-ancora:hover {
  border-color: var(--color-blue-200);
  background: var(--color-neutral-50);
}

.ajuda-ancora .v-icon {
  color: var(--color-blue-700);
}

/* ── Grid ───────────────────────────────────────────────────────────────── */
.ajuda-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
}

.ajuda-conteudo {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  min-width: 0;
}

/* ── Seções ─────────────────────────────────────────────────────────────── */
.ajuda-secao {
  scroll-margin-top: var(--space-6);
}

.ajuda-secao__cabecalho {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

/* Tile de ícone (§4.5). */
.ajuda-secao__icone {
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

.ajuda-secao__titulo {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
  border-radius: var(--radius-sm);
}

/* O título recebe foco pela âncora. Anel só quando o foco veio do teclado. */
.ajuda-secao__titulo:focus {
  outline: none;
}

.ajuda-secao__titulo:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 2px;
}

/* ── Perguntas frequentes ───────────────────────────────────────────────── */
.ajuda-busca {
  max-width: 480px;
  margin-bottom: var(--space-4);
}

.ajuda-perguntas {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ajuda-vazio {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

/* ── Contatos ───────────────────────────────────────────────────────────── */
.ajuda-contatos {
  min-width: 0;
  border-radius: var(--radius-lg);
  scroll-margin-top: var(--space-6);
}

.ajuda-contatos:focus {
  outline: none;
}

.ajuda-contatos:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 2px;
}

/* Duas colunas a partir de md: conteúdo e o card de contatos fixo ao lado.
   Quem rola é o .main-container do AppShell, e o sticky prende o card a ele.
   O teto de altura garante que uma regional com muitos gestores ainda alcance
   o fim do card, rolando por dentro. O chip "Contatos" some: o card está
   sempre à vista. */
@media (min-width: 960px) {
  .ajuda-grid {
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    align-items: start;
  }

  .ajuda-contatos {
    position: sticky;
    top: var(--space-6);
    max-height: calc(100vh - var(--app-bar-height) - 2 * var(--space-6));
    max-height: calc(100dvh - var(--app-bar-height) - 2 * var(--space-6));
    overflow-y: auto;
  }

  .ajuda-ancora--contatos {
    display: none;
  }
}

@media (max-width: 959px) {
  .ajuda {
    padding: var(--space-4);
  }

  .ajuda-ancoras {
    margin-bottom: var(--space-5);
  }

  .ajuda-grid,
  .ajuda-conteudo {
    gap: var(--space-6);
  }
}
</style>
