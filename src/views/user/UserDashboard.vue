<template>
  <div class="inicio">
    <PageHeader
      :titulo="saudacao"
      subtitulo="Encontre um posto conveniado, registre uma ocorrência ou peça ajuda."
    />

    <!-- Ordem do DOM é a da §5.8 e a do mobile: busca, ocorrência, ajuda, mapa.
         No desktop o grid põe a ajuda na coluna lateral. -->
    <div class="inicio-grid">
      <section class="inicio-card area-busca" aria-labelledby="inicio-busca-titulo">
        <h2 id="inicio-busca-titulo" class="inicio-card__titulo">Encontrar posto</h2>
        <p class="inicio-card__texto">Busque entre os postos conveniados pelo nome ou pela cidade.</p>
        <form role="search" class="inicio-busca" @submit.prevent="buscarPostos">
          <v-text-field
            v-model="termoBusca"
            label="Buscar posto por nome ou cidade"
            prepend-inner-icon="mdi-magnify"
            enterkeyhint="search"
            clearable
            hide-details
            class="inicio-busca__campo"
          />
          <!-- Secundário: a ação primária da tela é "Registrar ocorrência". -->
          <v-btn type="submit" variant="outlined" class="btn-secundario">Buscar</v-btn>
        </form>
      </section>

      <section class="inicio-card area-ocorrencia" aria-labelledby="inicio-ocorrencia-titulo">
        <div class="inicio-card__linha">
          <span class="inicio-card__icone"><v-icon icon="mdi-alert-circle-outline" size="20" /></span>
          <div class="inicio-card__textos">
            <h2 id="inicio-ocorrencia-titulo" class="inicio-card__titulo">Registrar ocorrência</h2>
            <p class="inicio-card__texto">
              Informe um problema com o veículo da frota, como combustível abaixo de meio tanque,
              sujeira ou itens esquecidos.
            </p>
          </div>
        </div>
        <v-btn color="primary" :to="{ name: 'OccurrencesUser' }" class="inicio-card__acao">
          Registrar ocorrência
        </v-btn>
      </section>

      <ContactSection class="area-ajuda">
        <template #titulo>Precisa de ajuda agora?</template>
        <template #descricao>Fale com o seguro ou com a gestão de frota da sua regional.</template>
      </ContactSection>

      <router-link :to="{ name: 'MapUser' }" class="inicio-card inicio-atalho area-mapa">
        <span class="inicio-card__icone"><v-icon icon="mdi-map-marker-outline" size="20" /></span>
        <span class="inicio-card__textos">
          <span class="inicio-card__titulo">Ver postos no mapa</span>
          <span class="inicio-card__texto">Localize os postos perto de você e trace uma rota.</span>
        </span>
        <v-icon icon="mdi-chevron-right" size="20" class="inicio-atalho__seta" />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import ContactSection from '@/components/user/ContactSection.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import { primeiroNome } from '@/utils/usuario'

const router = useRouter()

// O nome vem do AppShell, que já chama `/api/users/me`: aqui não há segunda
// chamada. Enquanto carrega, ou se falhar, a saudação fica sem nome.
const nomeUsuario = inject('nomeUsuario', ref(null))
const saudacao = computed(() => {
  const nome = primeiroNome(nomeUsuario.value)
  return nome ? `Olá, ${nome}` : 'Olá!'
})

const termoBusca = ref('')

// Postos lê `?busca=` e preenche o próprio campo (REDESIGN §5.8). Sem termo, vai
// para a lista inteira.
function buscarPostos() {
  const busca = termoBusca.value?.trim()
  router.push({ name: 'UserGasStations', query: busca ? { busca } : {} })
}
</script>

<style scoped>
/* Fundo e rolagem são do AppShell. Largura, padding e gutter da §4.3, iguais
   aos do Painel: 1440px, 32 e 24px no desktop, 16px abaixo de md. */
.inicio {
  max-width: 1440px;
  padding: var(--space-8);
}

.inicio-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'busca'
    'ocorrencia'
    'ajuda'
    'mapa';
  gap: var(--space-6);
}

.area-busca {
  grid-area: busca;
}

.area-ocorrencia {
  grid-area: ocorrencia;
}

.area-ajuda {
  grid-area: ajuda;
}

.area-mapa {
  grid-area: mapa;
}

/* Duas colunas a partir de md. A última linha leva a sobra (1fr) quando a
   ajuda é mais alta que a coluna principal, e os cards não esticam. */
@media (min-width: 960px) {
  .inicio-grid {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
      'busca ajuda'
      'ocorrencia ajuda'
      'mapa ajuda';
    align-items: start;
  }
}

/* Card do design system (§4.6): borda, raio de 12px, sem sombra. */
.inicio-card {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.inicio-card__linha {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.inicio-card__textos {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.inicio-card__titulo {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
}

.inicio-card__texto {
  margin: var(--space-1) 0 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

/* Tile de ícone de entidade (§4.5). */
.inicio-card__icone {
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

.inicio-card__acao {
  margin-top: var(--space-5);
}

.inicio-busca {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.inicio-busca__campo {
  flex: 1;
  min-width: 0;
}

/* Botão secundário (§4.6), o mesmo da tela de postos do admin. A classe
   dobrada vence o outlined do Vuetify, que herdaria a cor do texto na borda. */
.v-btn.btn-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}

/* Card clicável (§4.6): hover por borda blue-200, sem deslocamento. O foco
   visível vem da regra global de main.css para `a`. */
.inicio-atalho {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: inherit;
  text-decoration: none;
  transition: border-color var(--transition);
}

.inicio-atalho:hover {
  border-color: var(--color-blue-200);
}

.inicio-atalho .inicio-card__titulo {
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
}

.inicio-atalho__seta {
  flex-shrink: 0;
  color: var(--color-neutral-500);
}

@media (max-width: 959px) {
  .inicio {
    padding: var(--space-4);
  }

  .inicio-grid {
    gap: var(--space-4);
  }

  .inicio-card {
    padding: var(--space-5);
  }
}

/* No celular o tile ocupa espaço que o texto precisa; a ação de ocorrência e a
   busca ocupam a largura toda, como alvo de toque. */
@media (max-width: 599px) {
  .inicio-card__linha .inicio-card__icone {
    display: none;
  }

  .inicio-card__acao {
    width: 100%;
  }

  /* Lado a lado, o rótulo do campo seria cortado em 390px. */
  .inicio-busca {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
