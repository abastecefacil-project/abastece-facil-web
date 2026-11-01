<template>
  <section class="contatos" aria-labelledby="contatos-titulo">
    <h2 id="contatos-titulo" class="contatos__titulo">
      <slot name="titulo">Precisa de mais informações?</slot>
    </h2>
    <p class="contatos__descricao">
      <slot name="descricao">Para dúvidas adicionais ou situações específicas, entre em contato:</slot>
    </p>

    <ul class="contatos__lista">
      <li>
        <a
          class="contato contato--link"
          :href="ASSISTENCIA_24H.href"
          :aria-label="`Ligar para a ${ASSISTENCIA_24H.rotulo}: ${ASSISTENCIA_24H.telefone}`"
        >
          <span class="contato__icone"><v-icon icon="mdi-phone-outline" size="20" /></span>
          <span class="contato__info">
            <span class="contato__nome">{{ ASSISTENCIA_24H.rotulo }}</span>
            <span class="contato__telefone">{{ ASSISTENCIA_24H.telefone }}</span>
          </span>
          <v-icon icon="mdi-chevron-right" size="20" class="contato__acao" />
        </a>
      </li>
      <li>
        <a
          class="contato contato--link"
          :href="WHATSAPP_SEGURO.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Falar com o seguro pelo WhatsApp: ${WHATSAPP_SEGURO.telefone} (abre em nova aba)`"
        >
          <span class="contato__icone"><v-icon icon="mdi-whatsapp" size="20" /></span>
          <span class="contato__info">
            <span class="contato__nome">{{ WHATSAPP_SEGURO.rotulo }}</span>
            <span class="contato__telefone">{{ WHATSAPP_SEGURO.telefone }}</span>
          </span>
          <v-icon icon="mdi-open-in-new" size="18" class="contato__acao" />
        </a>
      </li>
    </ul>

    <h3 class="contatos__grupo">Gestão de frota da sua regional</h3>

    <p v-if="carregando" role="status" class="contatos__estado">Carregando contatos da gestão de frota…</p>
    <div v-else-if="erro" role="alert" class="contatos__estado">
      <p class="ma-0">Não foi possível carregar os contatos da gestão de frota.</p>
      <v-btn variant="text" class="contatos__tentar" @click="carregarGestores">Tentar novamente</v-btn>
    </div>
    <ul v-else-if="contatos.length" class="contatos__lista">
      <li v-for="(gestor, index) in contatos" :key="index">
        <component
          :is="gestor.url ? 'a' : 'div'"
          class="contato"
          :class="{ 'contato--link': gestor.url }"
          :href="gestor.url || undefined"
          :target="gestor.url ? '_blank' : undefined"
          :rel="gestor.url ? 'noopener noreferrer' : undefined"
          :aria-label="gestor.url ? `Falar com ${gestor.nome} pelo WhatsApp (abre em nova aba)` : undefined"
        >
          <span class="contato__icone">
            <v-icon :icon="gestor.url ? 'mdi-whatsapp' : 'mdi-account-tie-outline'" size="20" />
          </span>
          <span class="contato__info">
            <span class="contato__nome">{{ gestor.nome }}</span>
            <span class="contato__telefone">
              {{ gestor.url ? telefoneExibicao(gestor.telefone) : 'Telefone não disponível para contato pelo WhatsApp' }}
            </span>
          </span>
          <v-icon v-if="gestor.url" icon="mdi-open-in-new" size="18" class="contato__acao" />
        </component>
      </li>
    </ul>
    <p v-else class="contatos__estado">Nenhum gestor de frota ativo vinculado à sua regional.</p>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getGestoresDaMinhaRegional } from '@/services/userService'
import { montarUrlWhatsapp, normalizarNumeroWhatsapp } from '@/utils/whatsapp'
import { telefoneExibicao } from '@/utils/formatacao'
import { ASSISTENCIA_24H, WHATSAPP_SEGURO } from '@/config/contatosSeguro'

// Card de contatos da Início e da Central de Ajuda (R8). O que vem dos dois
// imports acima só é usado no template: tests/contatos-gestores.test.js executa
// este script numa VM, sem os imports, e um uso aqui o quebraria.

const gestores = ref([])
const carregando = ref(true)
const erro = ref(false)
const contatos = computed(() => gestores.value.map((gestor) => {
  const { numero } = normalizarNumeroWhatsapp(gestor.telefone)
  return { ...gestor, url: numero ? montarUrlWhatsapp(numero) : null }
}))

const carregarGestores = async () => {
  carregando.value = true
  erro.value = false
  try {
    gestores.value = await getGestoresDaMinhaRegional()
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

onMounted(carregarGestores)
</script>

<style scoped>
/* Card do design system (REDESIGN §4.6): borda, raio de 12px, sem sombra. A
   largura e a posição são de quem usa: Início (coluna lateral) e Central de
   Ajuda. */
.contatos {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.contatos__titulo {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
}

.contatos__descricao {
  margin: var(--space-1) 0 var(--space-4);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

.contatos__grupo {
  margin: var(--space-5) 0 var(--space-2);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  font-weight: 600;
  color: var(--color-neutral-600);
}

.contatos__lista {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.contatos__estado {
  margin: 0;
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--color-text-muted);
}

.v-btn.contatos__tentar {
  margin-top: var(--space-1);
  margin-left: calc(-1 * var(--space-4));
  color: var(--color-blue-600);
}

/* Linha de contato: tile de ícone neutro (§4.5), nome e telefone. A linha
   clicável tem borda e destaca por borda no hover, sem deslocamento (§4.6). */
.contato {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
}

.contato--link {
  border-color: var(--color-border);
  transition:
    border-color var(--transition),
    background-color var(--transition);
}

.contato--link:hover {
  border-color: var(--color-blue-200);
  background-color: var(--color-neutral-50);
}

.contato__icone {
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

.contato__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.contato__nome {
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: 600;
  color: var(--color-text);
}

.contato__telefone {
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.contato__acao {
  flex-shrink: 0;
  color: var(--color-neutral-500);
}

@media (max-width: 959px) {
  .contatos {
    padding: var(--space-5);
  }
}
</style>
