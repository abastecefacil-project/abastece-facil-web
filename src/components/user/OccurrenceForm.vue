<template>
  <div class="ocorrencia-form">
    <v-form ref="formRef">
      <div class="ocorrencia-card">
        <v-alert v-if="dataError" type="error" variant="tonal" class="mb-6">
          {{ dataError }}
          <v-btn variant="text" @click="loadData" :loading="loadingData">Tentar novamente</v-btn>
        </v-alert>

        <!-- O nome não é campo: vem de getUsuarioAutenticado e vai no payload sem
             passar por nada que o colaborador possa editar. -->
        <div v-else class="ocorrencia-autor" :aria-busy="loadingData">
          <v-icon icon="mdi-account-outline" size="16" class="ocorrencia-autor__icone" />
          <span>Registrando como:</span>
          <strong v-if="!loadingData" class="ocorrencia-autor__nome">{{ userName }}</strong>
          <span v-else class="ocorrencia-autor__carregando" aria-hidden="true" />
        </div>
        <p class="ocorrencia-dica">Campos marcados com * são obrigatórios.</p>

        <section class="ocorrencia-secao" aria-labelledby="ocorrencia-secao-veiculo">
          <h2 id="ocorrencia-secao-veiculo" class="ocorrencia-secao__titulo">Veículo</h2>
          <v-autocomplete
            v-model="form.licensePlate"
            :items="vehicles"
            item-title="label"
            item-value="licensePlate"
            label="Modelo ou placa*"
            placeholder="Busque pelo modelo ou placa"
            variant="outlined"
            density="comfortable"
            :loading="loadingData"
            :disabled="loadingData || loading"
            :rules="[(v) => !!v || 'Veículo é obrigatório']"
            no-data-text="Nenhum veículo disponível"
            hide-details="auto"
            menu-icon="mdi-chevron-down"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :title="item.raw.model" role="option">
                <template #append>
                  <PlateBadge :placa="item.raw.licensePlate" />
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <span class="veiculo-selecionado">
                <span class="veiculo-selecionado__modelo">{{ item.raw.model }}</span>
                <PlateBadge :placa="item.raw.licensePlate" />
              </span>
            </template>
          </v-autocomplete>
        </section>

        <section class="ocorrencia-secao" aria-labelledby="ocorrencia-secao-tipo">
          <h2 id="ocorrencia-secao-tipo" class="ocorrencia-secao__titulo">
            Tipo da ocorrência<span aria-hidden="true">*</span>
          </h2>
          <!-- O v-input registra o grupo no v-form: as mesmas titleRules do antigo
               select validam o tipo, e a mensagem sai abaixo dos chips, ligada ao
               grupo por aria-describedby. messagesId e isValid chegam como refs
               (o slot não os desembrulha), daí o .value. -->
          <v-input :model-value="form.title" :rules="titleRules" hide-details="auto">
            <template #default="{ messagesId, isValid }">
              <v-chip-group
                v-model="form.title"
                column
                selected-class="tipo-chip--selecionado"
                role="group"
                aria-labelledby="ocorrencia-secao-tipo"
                :aria-describedby="messagesId.value"
                :aria-invalid="isValid.value === false ? 'true' : undefined"
                class="tipo-grupo"
              >
                <v-chip
                  v-for="opcao in titleOptions"
                  :key="opcao"
                  :value="opcao"
                  variant="outlined"
                  role="button"
                  :aria-pressed="form.title === opcao ? 'true' : 'false'"
                  :prepend-icon="iconesTipo[opcao]"
                  class="tipo-chip"
                >
                  {{ opcao }}
                </v-chip>
              </v-chip-group>
            </template>
          </v-input>

          <v-text-field
            v-if="form.title === 'Outro'"
            v-model="form.customTitle"
            label="Qual o tipo?*"
            placeholder="Ex.: pneu furado"
            variant="outlined"
            density="comfortable"
            maxlength="40"
            counter="40"
            :rules="[(v) => !!v || 'Informe o título']"
            hide-details="auto"
            class="mt-4"
          />
        </section>

        <section class="ocorrencia-secao" aria-labelledby="ocorrencia-secao-data">
          <h2 id="ocorrencia-secao-data" class="ocorrencia-secao__titulo">Data</h2>
          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            max-width="300px"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="form.date"
                label="Data da ocorrência*"
                variant="outlined"
                density="comfortable"
                readonly
                v-bind="props"
                prepend-inner-icon="mdi-calendar-blank-outline"
                :rules="[(v) => !!v || 'Data é obrigatória']"
                hide-details="auto"
                class="campo-data"
              />
            </template>

            <v-date-picker
              v-model="dateValue"
              color="primary"
              @update:model-value="onDateSelected"
            />
          </v-menu>
        </section>

        <section class="ocorrencia-secao" aria-labelledby="ocorrencia-secao-descricao">
          <h2 id="ocorrencia-secao-descricao" class="ocorrencia-secao__titulo">Descrição</h2>
          <v-textarea
            v-model="form.description"
            label="Descrição"
            placeholder="Descreva a ocorrência com detalhes..."
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            rows="5"
            auto-grow
            counter="500"
            maxlength="500"
          />
        </section>

        <div class="ocorrencia-acoes">
          <v-btn
            variant="outlined"
            :disabled="loading"
            class="btn-secundario"
            @click="handleClear"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            :disabled="loadingData || !!dataError"
            @click="handleSubmit"
          >
            Registrar ocorrência
          </v-btn>
        </div>
      </div>
    </v-form>

    <BaseStatusModal
      v-model="successDialog"
      type="success"
      title="Ocorrência registrada"
      message="A ocorrência foi registrada com sucesso."
    />

    <BaseStatusModal
      v-model="errorDialog"
      type="error"
      title="Não foi possível registrar"
      message="A ocorrência não foi registrada. Tente novamente em instantes."
    />
  </div>
</template>

<script setup>
import BaseStatusModal from '../app/BaseStatusModal.vue'
import PlateBadge from '@/components/app/PlateBadge.vue'
import { createOccurrences } from '@/services/occurrenceService'
import { getAvailableCars } from '@/services/vehicleService'
import { getUsuarioAutenticado } from '@/services/userService'
import { ref, reactive, onMounted, nextTick } from 'vue'

// tests/occurrence-form.test.js executa este script numa VM sem as linhas de
// import, com apenas ref, reactive, onMounted, nextTick e os três services.
// Nada além disso pode ser usado aqui (nem computed, nem utils importados).

// dd/mm/aaaa, o formato exibido no campo; formatDateToISO desfaz no envio.
const formatarData = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const vehicles = ref([])
const userName = ref('')
const loadingData = ref(true)
const dataError = ref('')
const dateValue = ref(new Date())

const loadData = async () => {
  loadingData.value = true
  dataError.value = ''
  try {
    const [response, user] = await Promise.all([getAvailableCars(), getUsuarioAutenticado()])
    if (!user?.name) throw new Error('Usuário sem nome')
    vehicles.value = response.data.map((vehicle) => ({
      ...vehicle,
      label: `${vehicle.model} — ${vehicle.licensePlate}`,
    }))
    userName.value = user.name
  } catch {
    dataError.value = 'Não foi possível carregar os veículos e o usuário. Tente novamente.'
  } finally {
    loadingData.value = false
  }
}

onMounted(loadData)

const dateMenu = ref(false)
const formRef = ref(null)
const loading = ref(false)
const successDialog = ref(false)
const errorDialog = ref(false)

const titleOptions = [
  'Combustível Abaixo de Meio Tanque',
  'Veículo com Itens Pessoais',
  'Veículo Sujo Internamente',
  'Devolução Fora do Estacionamento',
  'Outro',
]

const iconesTipo = {
  'Combustível Abaixo de Meio Tanque': 'mdi-gas-station-outline',
  'Veículo com Itens Pessoais': 'mdi-bag-personal-outline',
  'Veículo Sujo Internamente': 'mdi-spray-bottle',
  'Devolução Fora do Estacionamento': 'mdi-parking',
  Outro: 'mdi-dots-horizontal',
}

// A data já vem com hoje e continua editável pelo date picker. O veículo
// começa null: com '', o Vuetify o trataria como selecionado (rótulo flutuando
// e um PlateBadge vazio no campo).
const form = reactive({
  licensePlate: null,
  title: '',
  customTitle: '',
  description: '',
  date: formatarData(new Date()),
})

const titleRules = [
  (v) => !!v || 'Título é obrigatório',
  (v) => (v && v.length >= 3) || 'Mínimo 3 caracteres',
]

const onDateSelected = (val) => {
  if (val) {
    form.date = formatarData(new Date(val))
    dateMenu.value = false
  }
}

const formatDateToISO = (dateStr) => {
  if (!dateStr) return null

  const [day, month, year] = dateStr.split('/')
  if (!day || !month || !year) return null

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const handleSubmit = async () => {
  if (loadingData.value || dataError.value || loading.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const finalTitle = form.title === 'Outro' ? form.customTitle : form.title
    const body = {
      licensePlate: form.licensePlate.replace('-', ''),
      title: finalTitle,
      description: form.description,
      userName: userName.value,
      occurrenceDate: formatDateToISO(form.date),
    }
    await createOccurrences(body)

    handleClear()
    successDialog.value = true
  } catch (error) {
    errorDialog.value = true
  } finally {
    loading.value = false
  }
}

// Volta ao estado inicial, inclusive a data de hoje. O nome não é tocado.
// O veículo volta a null, e não a '': o watcher de validação do Vuetify
// revalida qualquer valor diferente de null, e com '' o "Veículo é
// obrigatório" reaparecia depois do Cancelar. O reset espera o nextTick para
// rodar depois desse watcher, e não antes.
const handleClear = async () => {
  form.licensePlate = null
  form.title = ''
  form.customTitle = ''
  form.description = ''
  form.date = formatarData(new Date())
  dateValue.value = new Date()
  await nextTick()
  formRef.value?.resetValidation()
}
</script>

<style scoped>
/* Card do design system (§4.6): borda, raio de 12px, sem sombra. O raio dos
   campos e o contorno vêm das regras globais de main.css. */
.ocorrencia-card {
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.ocorrencia-autor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
}

.ocorrencia-autor__icone {
  color: var(--color-neutral-500);
}

.ocorrencia-autor__nome {
  color: var(--color-text);
  font-weight: 600;
}

.ocorrencia-autor__carregando {
  display: inline-block;
  width: 160px;
  height: 14px;
  border-radius: var(--radius-sm);
  background-color: var(--color-neutral-100);
}

.ocorrencia-dica {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-line);
}

.ocorrencia-secao {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.ocorrencia-secao__titulo {
  margin: 0 0 var(--space-3);
  color: var(--color-neutral-900);
  font-size: var(--text-card-title-size);
  line-height: var(--text-card-title-line);
  font-weight: var(--text-card-title-weight);
}

/* Modelo e placa na seleção do autocomplete. */
.veiculo-selecionado {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.veiculo-selecionado__modelo {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Chips do tipo: `column` quebra linha em vez de rolar. O padding zerado
   alinha o primeiro chip com a borda dos campos. */
.tipo-grupo {
  padding: 0;
}

.v-chip.tipo-chip {
  border-color: var(--color-border-strong);
  color: var(--color-text);
  font-size: var(--text-body-size);
  transition: border-color var(--transition), background-color var(--transition);
}

.v-chip.tipo-chip:hover {
  border-color: var(--color-neutral-600);
}

.v-chip.tipo-chip.tipo-chip--selecionado {
  border-color: var(--color-blue-700);
  background-color: var(--color-blue-50);
  color: var(--color-blue-700);
  font-weight: 500;
}

.campo-data {
  max-width: 280px;
}

.ocorrencia-acoes {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* Secundário (§4.6), o mesmo da Início. */
.v-btn.btn-secundario {
  border-color: var(--color-neutral-300);
  color: var(--color-text);
  background-color: var(--color-surface);
}

.v-btn.btn-secundario:hover {
  border-color: var(--color-neutral-400);
}

@media (max-width: 599px) {
  .ocorrencia-card {
    padding: var(--space-4);
  }

  .ocorrencia-secao,
  .ocorrencia-acoes {
    margin-top: var(--space-5);
    padding-top: var(--space-5);
  }

  .campo-data {
    max-width: none;
  }

  /* Primário em cima, os dois na largura toda. */
  .ocorrencia-acoes {
    flex-direction: column-reverse;
  }
}
</style>
