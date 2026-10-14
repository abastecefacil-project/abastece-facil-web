<template>
  <v-dialog
    :model-value="modelValue"
    max-width="800px"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <!-- Título -->
      <v-card-title class="pa-6 pb-4">
        <span class="text-h5 font-weight-bold">
          {{ props.isEditing ? 'Editar Posto' : 'Novo Posto' }}
        </span>
      </v-card-title>

      <!-- Conteúdo -->
      <v-card-text class="px-6 py-4">
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
                label="Nome Fantasia"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

          <!-- CNPJ e Telefone -->
            <v-col cols="6" sm="5" md="6">
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
            <v-col cols="6" sm="4" md="6">
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
            <v-col cols="4" sm="3" md="3">
              <v-text-field
                v-model="localPosto.cep"
                class="small-input"
                label="CEP*"
                style="font-size: 2px;"
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
            <v-col cols="8" sm="9" md="7">
              <v-text-field
                v-model="localPosto.address"
                class="small-input"
                label="Endereço*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Endereço é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="4" sm="3" md="2">
              <v-text-field
                v-model="localPosto.number"
                class="small-input"
                label="Numero*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Numero é obrigatório']"
              ></v-text-field>
            </v-col>          

          <!-- Bairro, Cidade e Estado -->
            <v-col cols="8" sm="5" md="6">
              <v-text-field
                v-model="localPosto.district"
                class="small-input"
                label="Bairro*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Bairro é obrigatório']"
              ></v-text-field>
            </v-col>
            <v-col cols="8" sm="5" md="4">
              <v-text-field
                v-model="localPosto.city"
                class="small-input"
                label="Cidade*"
                variant="outlined"
                density="comfortable"
                :rules="[(v) => !!v || 'Cidade é obrigatória']"
              ></v-text-field>
            </v-col>
            <v-col cols="4" sm="2" md="2">
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
            <v-col 
              :cols="isEditing ? 6 : 6"
              :sm="isEditing ? 4 : 6"
              :md="isEditing ? 4 : 6"
            >
              <v-text-field
                v-model="localPosto.openTime"
                class="small-input"
                label="Horário de Abertura"
                type="time"
                variant="outlined"
                density="comfortable"
                :rules="[exigeParDeHorario('closeTime', 'abertura')]"
              ></v-text-field>
            </v-col>
            
            <v-col
              :cols="isEditing ? 6 : 6"
              :sm="isEditing ? 4 : 6"
              :md="isEditing ? 4 : 6"
            >
              <v-text-field
                v-model="localPosto.closeTime"
                class="small-input"
                label="Horário de Fechamento"
                type="time"
                variant="outlined"
                density="comfortable"
                :rules="[exigeParDeHorario('openTime', 'fechamento')]"
              ></v-text-field>
            </v-col>
            
            <!-- Switch de Ativação Compacto -->
            <v-col v-if="isEditing" cols="12" sm="4" md="4">
              <v-card
                :color="localPosto.active ? '#008109' : '#C62828'"
                variant="outlined"
                class="pa-3 activation-card-compact"
                :class="{ 'active-card': localPosto.active }"
                height="50"
              >
                <div class="d-flex align-center justify-space-between h-100">
                  <span class="text-body-2 font-weight-medium">
                    {{ localPosto.active ? 'Posto Ativo' : 'Posto Inativo' }}
                  </span>
                  <v-switch
                    v-model="localPosto.active"
                    color="success"
                    hide-details
                    density="compact"
                  />
                </div>
              </v-card>
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
    message="Não foi possível cadastrar o Posto. Tente novamente."
  />

</template>

<script setup>
import BaseStatusModal from '../app/BaseStatusModal.vue';
import { computed, nextTick, ref, watch } from 'vue'
import { createStation, updateStation, getAddressByCep } from '@/services/stationService';
import { formatarTelefone } from '@/utils/mascaras'
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

const cepNotFound = ref(false);
const form = ref(null)
const localPosto = ref({
  ...props.posto,
  openTime: props.posto.openTime || '06:00',
  closeTime: props.posto.closeTime || '22:00',
  active: props.posto.active ?? false
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
      active: newPosto.status ?? true,
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
:deep(.v-dialog .v-card) {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Forma, cor e responsividade dos botões vêm de .btn-dialog* e .dialog-actions,
   em assets/main.css, compartilhadas com os demais diálogos do sistema. */

/* Estilos do Card de Ativação Compacto */
.activation-card-compact {
  transition: all 0.3s ease;
  border-width: 2px;
  
}

.activation-card-compact.active-card {
  border-color: #4CAF50 !important;
  background-color: rgba(76, 175, 80, 0.08) !important;
}

/* Localização no mapa */
.secao-coordenadas {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.secao-coordenadas-titulo {
  min-height: 48px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.secao-coordenadas-icone {
  margin-right: 8px;
  color: var(--color-primary);
}

.coordenadas-ajuda {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.coordenadas-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-right: 4px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}

.coordenadas-link:hover {
  text-decoration: underline;
}

.coordenadas-erro {
  margin-bottom: 12px;
}

.activation-card-compact :deep(.v-switch) {
  flex: 0 0 auto;
}

.activation-card-compact :deep(.v-switch__track) {
  height: 20px;
  width: 40px;
}

.activation-card-compact :deep(.v-switch__thumb) {
  height: 16px;
  width: 16px;
}
</style>
