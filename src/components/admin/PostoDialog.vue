<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720px"
    scrollable
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <!-- Cabeçalho (REDESIGN §4.6): título e fechar. O X emite o mesmo `close`
           do botão Cancelar. -->
      <v-card-title class="dialogo-cabecalho">
        <h2 class="dialogo-titulo">{{ props.isEditing ? 'Editar posto' : 'Novo posto' }}</h2>
        <v-btn
          icon
          variant="text"
          size="small"
          density="comfortable"
          aria-label="Fechar"
          class="dialogo-fechar"
          @click="$emit('close')"
        >
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </v-card-title>

      <!-- Conteúdo -->
      <v-card-text class="dialogo-corpo">
        <!-- Abaixo de 600px (xs) todo campo ocupa a linha inteira: cols="12" em
             todas as colunas, e a divisão começa no sm (REDESIGN §4.6). -->
        <v-form ref="form">
          <!-- Nome e Nome Fantasia -->
          <v-row dense>
            <v-col cols="12" sm="6" md="6">
              <v-text-field
                v-model="localPosto.name"
                class="small-input"
                label="Nome*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Nome é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="6">
              <v-text-field
                v-model="localPosto.fantasyName"
                class="small-input"
                label="Nome fantasia"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

          <!-- CNPJ e Telefone -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="localPosto.cnpj"
                class="small-input"
                label="CNPJ*"
                variant="outlined"
                density="comfortable"
                maxlength="18"
                :rules="[(v) => !!v || 'CNPJ é obrigatório']"
                @input="formatCnpj"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="localPosto.phone"
                class="small-input"
                label="Telefone"
                variant="outlined"
                density="comfortable"
                maxlength="15"
                @input="formatPhone"
              ></v-text-field>
            </v-col>

          <!-- CEP e Endereço na mesma linha -->
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="localPosto.cep"
                class="small-input"
                label="CEP*"
                variant="outlined"
                density="comfortable"
                maxlength="9"
                :rules="[(v) => !!v || 'CEP é obrigatório']"
                :error="cepNotFound"
                :error-messages="cepNotFound ? ['CEP não encontrado'] : []"
                @input="formatCep"
                @blur="searchCep"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="localPosto.address"
                class="small-input"
                label="Endereço*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Endereço é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="localPosto.number"
                class="small-input"
                label="Número*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Número é obrigatório']"
              ></v-text-field>
            </v-col>          

          <!-- Bairro, Cidade e Estado -->
            <v-col cols="12" sm="5" md="6">
              <v-text-field
                v-model="localPosto.district"
                class="small-input"
                label="Bairro*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Bairro é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="5" md="4">
              <v-text-field
                v-model="localPosto.city"
                class="small-input"
                label="Cidade*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Cidade é obrigatória']"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="2">
              <v-text-field
                v-model="localPosto.state"
                class="small-input"
                label="Estado*"
                variant="outlined"
                density="comfortable"
                maxlength="2"
                :rules="[(v) => !!v || 'Estado é obrigatório']"
              ></v-text-field>
            </v-col>

          <!-- Localização no mapa: só para o posto que o backend não localiza
               pelo endereço. `eager` mantém os campos montados com a seção
               recolhida, senão o v-form não os validaria. -->
            <v-col cols="12">
              <v-expansion-panels v-model="secaoCoordenadas" flat class="secao-coordenadas">
                <v-expansion-panel value="coordenadas">
                  <v-expansion-panel-title class="secao-coordenadas-titulo">
                    <v-icon icon="mdi-map-marker-outline" size="18" class="secao-coordenadas-icone" />
                    Localização no mapa
                  </v-expansion-panel-title>
                  <v-expansion-panel-text eager>
                    <p class="coordenadas-ajuda">
                      Preencha só se o endereço não for localizado automaticamente.
                    </p>
                    <p class="coordenadas-ajuda">
                      <a
                        v-if="urlGoogleMaps"
                        :href="urlGoogleMaps"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="coordenadas-link"
                      >
                        Buscar no Google Maps
                        <v-icon icon="mdi-open-in-new" size="14" />
                      </a>
                      <span v-else>Preencha o endereço para buscar no Google Maps.</span>
                      No mapa, clique com o botão direito sobre o posto e copie as coordenadas.
                    </p>

                    <v-alert
                      v-if="erroCoordenadas"
                      type="error"
                      variant="tonal"
                      density="compact"
                      class="coordenadas-erro"
                    >
                      {{ erroCoordenadas }}
                    </v-alert>

                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          ref="campoLatitude"
                          v-model="localPosto.latitude"
                          class="small-input"
                          label="Latitude"
                          placeholder="-26.3045"
                          inputmode="decimal"
                          variant="outlined"
                          density="comfortable"
                          :rules="[regraLatitude]"
                          @update:model-value="aoEditarCoordenada"
                          @paste="colarCoordenadas"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          ref="campoLongitude"
                          v-model="localPosto.longitude"
                          class="small-input"
                          label="Longitude"
                          placeholder="-48.8487"
                          inputmode="decimal"
                          variant="outlined"
                          density="comfortable"
                          :rules="[regraLongitude]"
                          @update:model-value="aoEditarCoordenada"
                          @paste="colarCoordenadas"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>

          <!-- Horário de Funcionamento e Switch de Ativação -->
            <v-col cols="12" :sm="isEditing ? 4 : 6">
              <v-text-field
                v-model="localPosto.openTime"
                class="small-input"
                label="Horário de abertura"
                type="time"
                variant="outlined"
                density="comfortable"
                :rules="[exigeParDeHorario('closeTime', 'abertura')]"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" :sm="isEditing ? 4 : 6">
              <v-text-field
                v-model="localPosto.closeTime"
                class="small-input"
                label="Horário de fechamento"
                type="time"
                variant="outlined"
                density="comfortable"
                :rules="[exigeParDeHorario('openTime', 'fechamento')]"
              ></v-text-field>
            </v-col>
            
            <!-- Status: switch simples, na altura dos campos ao lado. Só na
                 edição, de propósito (F2): na criação o backend ignora isActive
                 e o @PrePersist grava true, então um switch ali não teria efeito. -->
            <v-col v-if="isEditing" cols="12" sm="4" md="4" class="d-flex align-center">
              <v-switch
                v-model="localPosto.active"
                color="primary"
                label="Posto ativo"
                hide-details
                inset
                density="compact"
                class="campo-status"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- Ações -->
      <v-card-actions class="dialog-actions">
        <v-btn
          class="btn-dialog btn-dialog--cancelar"
          variant="outlined"
          @click="$emit('close')"
        >
          Cancelar
        </v-btn>
        <v-btn
          class="btn-dialog btn-dialog--confirmar"
          variant="flat"
          @click="handleSave"
          :loading="isLoading"
          :disabled="isLoading"
        >
          {{ props.isEditing ? 'Salvar' : 'Cadastrar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <BaseStatusModal
    v-model="successDialog"
    type="success"
    title="Sucesso!"
    message="Posto cadastrado com sucesso!"
  />

  <BaseStatusModal
    v-model="errorDialog"
    type="error"
    title="Erro!"
    :message="mensagemErro"
  />

</template>

<script setup>
import BaseStatusModal from '../app/BaseStatusModal.vue';
import { computed, nextTick, ref, watch } from 'vue'
import { createStation, updateStation, getAddressByCep } from '@/services/stationService';
import { formatarTelefone } from '@/utils/mascaras'
import { statusInicialPosto } from '@/utils/posto'
import {
  coordenadasParaEnvio,
  interpretarParCoordenadas,
  mensagemErroCoordenadas,
  urlBuscaGoogleMaps,
  validarCoordenada,
} from '@/utils/coordenadas'

const isLoading = ref(false);
const successDialog = ref(false)
const errorDialog = ref(false)

const props = defineProps({
  modelValue: Boolean,
  isEditing: Boolean,
  posto: {
    type: Object,
    default: () => ({}),
  },
})

// Na edição o verbo é "salvar": "cadastrar" sugeria que a falha era de criação.
const mensagemErro = computed(() =>
  props.isEditing
    ? 'Não foi possível salvar o posto. Tente novamente.'
    : 'Não foi possível cadastrar o posto. Tente novamente.',
)

const cepNotFound = ref(false);
const form = ref(null)
const localPosto = ref({
  ...props.posto,
  openTime: props.posto.openTime || '06:00',
  closeTime: props.posto.closeTime || '22:00',
  active: statusInicialPosto(props.posto),
})  

//Busca dados pelo cep
async function searchCep() {
  if(!localPosto.value.cep || localPosto.value.cep.length < 8) return;

  try {
    const response = await getAddressByCep(localPosto.value.cep);
    const data = response.data;
    if (!data.cep) {
      cepNotFound.value = true;
      return
    }
    if(data) {
      cepNotFound.value = false;
      localPosto.value.address = data.logradouro;
      localPosto.value.district = data.bairro;
      localPosto.value.city = data.localidade;
      localPosto.value.state = data.uf;
    }

  } catch(err) {
    cepNotFound.value = true;
    console.error("Erro ao buscar CEP", err)
  }
}

// Os dois horários vazios significam "sem horário" e viram null, o mesmo que
// a importação por planilha grava quando o horário da origem é ambíguo.
function montarHorario(abertura, fechamento) {
  return abertura && fechamento ? `${abertura} - ${fechamento}` : null
}

// --- Localização no mapa ---------------------------------------------------
// Contrato com o backend: na edição, latitude e longitude só vão no corpo se o
// administrador as digitou ou colou. Reenviar as carregadas faria o backend
// usá-las mesmo com o endereço mudado, e o marcador nunca mais acompanharia o
// endereço. Por isso a flag é de interação, e não comparação de valor:
// redigitar o mesmo valor também conta, e fixa o marcador onde está.
const secaoCoordenadas = ref(null)
const coordenadasAlteradas = ref(false)
const erroCoordenadas = ref('')
const campoLatitude = ref(null)
const campoLongitude = ref(null)

const regraLatitude = (v) => validarCoordenada(v, localPosto.value.longitude, 'latitude')
const regraLongitude = (v) => validarCoordenada(v, localPosto.value.latitude, 'longitude')

const urlGoogleMaps = computed(() => urlBuscaGoogleMaps(localPosto.value))

// A regra "as duas ou nenhuma" depende do campo oposto: corrigir um precisa
// limpar o erro que ficou no outro. Só revalida quem está mostrando erro, para
// não acusar um campo em que a pessoa ainda nem chegou.
function revalidarSeComErro(campo) {
  if (campo.value?.isValid === false) campo.value.validate()
}

// Disparado só por ação do usuário: o v-model sozinho não emite
// update:model-value quando o valor muda por código.
function aoEditarCoordenada() {
  coordenadasAlteradas.value = true
  erroCoordenadas.value = ''
  nextTick(() => {
    revalidarSeComErro(campoLatitude)
    revalidarSeComErro(campoLongitude)
  })
}

// "-26.3045, -48.8487", como o Google Maps copia, preenche os dois campos a
// partir de qualquer um deles. O que não for par é colado normalmente.
function colarCoordenadas(event) {
  const par = interpretarParCoordenadas(event.clipboardData?.getData('text'))
  if (!par) return
  event.preventDefault()
  localPosto.value.latitude = par.latitude
  localPosto.value.longitude = par.longitude
  aoEditarCoordenada()
  nextTick(() => {
    campoLatitude.value?.validate()
    campoLongitude.value?.validate()
  })
}

async function mostrarErroCoordenadas(mensagem) {
  erroCoordenadas.value = mensagem
  secaoCoordenadas.value = 'coordenadas'
  await nextTick()
  campoLatitude.value?.focus()
}

// Preencher só um dos dois gravaria um horário que a leitura de
// utils/posto.js considera inválido; os dois ou nenhum.
function exigeParDeHorario(campoOposto, rotulo) {
  return (v) =>
    !!v ||
    !localPosto.value[campoOposto] ||
    `Informe também o horário de ${rotulo}`
}

//Cadastra Postos
const handleSave = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) {
    // Com a seção recolhida, o erro de coordenada ficaria escondido.
    const coordenadasInvalidas =
      regraLatitude(localPosto.value.latitude) !== true ||
      regraLongitude(localPosto.value.longitude) !== true
    if (coordenadasInvalidas) secaoCoordenadas.value = 'coordenadas'
    return;
  }

   isLoading.value = true;

  try {
    const body = {
      name: localPosto.value.name,
      fantasyName: localPosto.value.fantasyName,
      cnpj: localPosto.value.cnpj,
      cep: localPosto.value.cep,
      address: `${localPosto.value.address}, ${localPosto.value.number}`,
      district: localPosto.value.district,
      city: localPosto.value.city,
      state: localPosto.value.state,
      phone: localPosto.value.phone,
      businessHours: montarHorario(localPosto.value.openTime, localPosto.value.closeTime),
      isActive: localPosto.value.active,
      ...coordenadasParaEnvio({
        latitude: localPosto.value.latitude,
        longitude: localPosto.value.longitude,
        editando: props.isEditing,
        alteradas: coordenadasAlteradas.value,
      }),
    };

    let response;

    if (props.isEditing) {
      response = await updateStation(localPosto.value.id, body);
    } else {
      response = await createStation(body);
      successDialog.value = true
    }

    emit('save', response.data);
    emit('update:modelValue', false);

  } catch (err) {
    // Endereço não localizado ou coordenada recusada: a orientação vai para a
    // seção de localização, onde a pessoa resolve. O resto, modal genérico.
    const mensagem = mensagemErroCoordenadas(err?.response?.data)
    if (mensagem) mostrarErroCoordenadas(mensagem)
    else errorDialog.value = true
  }  finally {
    isLoading.value = false;
  }
};

const emit = defineEmits(['update:modelValue', 'save', 'close'])

watch(
  () => props.posto,
  (newPosto) => {
    // Em edição, posto sem horário abre com os campos vazios: completar com
    // '00:00' faria um simples salvar gravar "00:00 - 00:00" por cima do NULL.
    // A criação mantém o '00:00' de sempre.
    const horarioPadrao = props.isEditing ? '' : '00:00'
    localPosto.value = {
      ...newPosto,
      openTime: newPosto.openTime || horarioPadrao,
      closeTime: newPosto.closeTime || horarioPadrao,
      active: statusInicialPosto(newPosto),
      latitude: newPosto.latitude ?? '',
      longitude: newPosto.longitude ?? '',
    }
    // Posto novo no dialog: nada foi digitado ainda, e o erro e a seção
    // aberta eram do posto anterior.
    coordenadasAlteradas.value = false
    erroCoordenadas.value = ''
    secaoCoordenadas.value = null
  },
  { deep: true },
)

const formatCep = (event) => {
  cepNotFound.value = false;
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 5) {
    value = value.slice(0, 5) + '-' + value.slice(5, 8)
  }
  localPosto.value.cep = value
}

const formatCnpj = (event) => {
  let value = event.target.value.replace(/\D/g, '')

  if (value.length > 2) {
    value = value.slice(0, 2) + '.' + value.slice(2)
  }
  if (value.length > 6) {
    value = value.slice(0, 6) + '.' + value.slice(6)
  }
  if (value.length > 10) {
    value = value.slice(0, 10) + '/' + value.slice(10)
  }
  if (value.length > 15) {
    value = value.slice(0, 15) + '-' + value.slice(15, 17)
  }

  localPosto.value.cnpj = value
}

const formatPhone = (event) => {
  const formatado = formatarTelefone(event.target.value)
  localPosto.value.phone = formatado
  // O DOM também precisa ser corrigido: quando a máscara descarta o caractere
  // digitado, o valor formatado é igual ao do modelo, o Vue não vê mudança e o
  // caractere inválido continuaria visível no campo.
  event.target.value = formatado
}

</script>

<style scoped>
/* Raio de 16px e sombra de overlay vêm da regra global de diálogo em main.css.
   Forma, cor e responsividade dos botões vêm de .btn-dialog* e .dialog-actions. */

.dialogo-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4) var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.dialogo-titulo {
  margin: 0;
  font-size: var(--text-section-title-size);
  line-height: var(--text-section-title-line);
  font-weight: var(--text-section-title-weight);
  color: var(--color-neutral-900);
}

.dialogo-fechar {
  color: var(--color-text-muted);
}

.dialogo-corpo {
  padding: var(--space-6) !important;
}

/* O switch não tem contorno nem rótulo flutuante: o texto fica em body, na
   cor do texto principal, alinhado ao centro da linha dos horários. */
.campo-status :deep(.v-label) {
  color: var(--color-text);
  opacity: 1;
  font-size: var(--text-body-size);
}

/* Trilho sólido. O Vuetify pinta o ligado com .bg-primary (!important) a 60%
   de opacidade, o que dava um azul lavado; com opacidade 1 fica o primary cheio
   (9,3:1 sobre o branco, acima dos 3:1 de componente). Desligado, neutral-400,
   a mesma borda dos campos (3,5:1). */
.campo-status :deep(.v-switch__track) {
  opacity: 1;
  background-color: var(--color-neutral-400);
}

/* Localização no mapa. A margem de baixo compensa o rótulo flutuante dos
   horários, que sobe ~7px acima do contorno: sem ela o rótulo encostava no
   painel, enquanto entre os campos sobram 8px. */
.secao-coordenadas {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.secao-coordenadas-titulo {
  min-height: 48px;
  font-size: var(--text-body-size);
  font-weight: 600;
  color: var(--color-text);
}

.secao-coordenadas-icone {
  margin-right: var(--space-2);
  color: var(--color-primary);
}

.coordenadas-ajuda {
  margin: 0 0 var(--space-2);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
  color: var(--color-text-muted);
}

.coordenadas-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-right: var(--space-1);
  font-weight: 500;
  color: var(--color-blue-600);
  text-decoration: none;
}

.coordenadas-link:hover {
  text-decoration: underline;
}

.coordenadas-erro {
  margin-bottom: var(--space-3);
}

@media (max-width: 600px) {
  .dialogo-corpo {
    padding: var(--space-5) !important;
  }
}
</style>
