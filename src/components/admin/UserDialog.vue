<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560px"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="dialog-card" rounded="lg">
      <v-card-title class="pa-6 pb-4">
        <span class="text-h5 font-weight-bold">Novo Usuário</span>
      </v-card-title>

      <v-card-text class="dialog-content">
        <!-- O usuário nasce sem senha: quem a define é a própria pessoa, pelo
             link de ativação enviado por e-mail. Daí não haver campo de senha. -->
        <p class="dialog-hint">
          O convite de ativação é enviado por e-mail. A senha é definida pela própria pessoa.
        </p>

        <v-alert
          v-if="erroCarregamento"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
          :text="erroCarregamento"
        />

        <v-alert
          v-else-if="gestorSemRegional"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
          text="Sua conta não está vinculada a nenhuma regional, então não é possível cadastrar usuários. Procure um administrador."
        />

        <v-form ref="form">
          <div class="form-fields">
            <v-text-field
              v-model="localUser.name"
              label="Nome completo*"
              placeholder="Ex: João Silva"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.nome]"
            ></v-text-field>

            <v-text-field
              v-model="localUser.email"
              label="E-mail*"
              placeholder="Ex: joao.silva@fiesc.org.br"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.email]"
            ></v-text-field>

            <v-text-field
              v-model="localUser.telefone"
              label="Telefone"
              placeholder="Ex: (47) 99999-8888"
              variant="outlined"
              density="comfortable"
              :rules="[rules.telefone]"
            ></v-text-field>

            <v-text-field
              v-model="localUser.matricula"
              :label="camposDePerfilObrigatorios ? 'Matrícula*' : 'Matrícula'"
              placeholder="Ex: 12345"
              variant="outlined"
              density="comfortable"
              :rules="regrasMatricula"
            ></v-text-field>

            <v-select
              v-model="localUser.perfil"
              :items="perfisDisponiveis"
              label="Perfil*"
              variant="outlined"
              density="comfortable"
              menu-icon="mdi-chevron-down"
              :rules="[rules.required]"
              :hint="perfilTravado ? 'Você só pode cadastrar colaboradores.' : ''"
              :persistent-hint="perfilTravado"
            ></v-select>

            <v-select
              v-model="localUser.regionalId"
              :items="regionaisDisponiveis"
              :label="camposDePerfilObrigatorios ? 'Regional*' : 'Regional'"
              variant="outlined"
              density="comfortable"
              menu-icon="mdi-chevron-down"
              :loading="carregandoDados"
              :readonly="regionalTravada"
              :append-inner-icon="regionalTravada ? 'mdi-lock-outline' : undefined"
              :rules="regrasRegional"
              :hint="regionalTravada ? 'Travada na sua regional.' : ''"
              :persistent-hint="regionalTravada"
            ></v-select>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-4 d-flex justify-end">
        <v-btn
          variant="outlined"
          size="large"
          rounded="lg"
          class="mr-3 cancel-btn"
          :disabled="isLoading"
          @click="$emit('close')"
        >
          CANCELAR
        </v-btn>
        <v-btn
          size="large"
          rounded="lg"
          color="primary"
          class="save-btn"
          :loading="isLoading"
          :disabled="isLoading || carregandoDados || gestorSemRegional || !!erroCarregamento"
          @click="handleSave"
        >
          CADASTRAR
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <BaseStatusModal
    v-model="successDialog"
    type="success"
    title="Sucesso!"
    message="Usuário cadastrado e convite de ativação enviado por e-mail."
  />

  <BaseStatusModal
    v-model="warningDialog"
    type="warning"
    title="Convite não enviado"
    message="O usuário foi cadastrado, mas o convite de ativação não saiu. Use a ação Reenviar ativação no card dele para tentar de novo."
  />

  <BaseStatusModal
    v-model="errorDialog"
    type="error"
    title="Erro!"
    :message="mensagemErro"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseStatusModal from '../app/BaseStatusModal.vue'
import { createUser, getUsuarioAutenticado } from '@/services/userService'
import { getRegionais } from '@/services/regionalService'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

const authStore = useAuthStore()

const PERFIL_LABELS = {
  COLABORADOR: 'Colaborador',
  GESTOR_FROTA: 'Gestor de Frota',
  ADMINISTRADOR: 'Administrador',
}

const MENSAGEM_ERRO_PADRAO = 'Não foi possível cadastrar o usuário. Tente novamente.'

// O campo `error` do ErrorResponse é o único discriminador programático que o
// backend oferece. DOMINIO_EMAIL_NAO_PERMITIDO fica de fora de propósito: a
// mensagem do backend lista os domínios aceitos, e reescrevê-la aqui perderia
// justamente a informação que resolve o erro.
const MENSAGENS_POR_ERRO = {
  MATRICULA_DUPLICADA: 'Já existe um usuário cadastrado com essa matrícula.',
  CONFLICT: 'Já existe um usuário cadastrado com esse e-mail.',
  PERFIL_NAO_PERMITIDO: 'Você não tem permissão para cadastrar usuários com esse perfil.',
  REGIONAL_NAO_PERMITIDA: 'Você só pode cadastrar usuários na sua própria regional.',
  NOT_FOUND: 'Regional não encontrada. Recarregue a página e tente novamente.',
}

const form = ref(null)
const isLoading = ref(false)
const carregandoDados = ref(false)
const erroCarregamento = ref('')

const regionais = ref([])
const usuarioLogado = ref(null)

const successDialog = ref(false)
const warningDialog = ref(false)
const errorDialog = ref(false)
const mensagemErro = ref(MENSAGEM_ERRO_PADRAO)

function formVazio() {
  return {
    name: '',
    email: '',
    telefone: '',
    matricula: '',
    perfil: 'COLABORADOR',
    regionalId: null,
  }
}

const localUser = ref(formVazio())

// Perfil ausente (sessão anterior ao P0.5a) cai na restrição mais estreita: a
// regra real é do backend, e a interface não deve prometer mais do que ele
// permite. Isso é conveniência de tela, não controle de acesso.
const isAdministrador = computed(() => authStore.perfil === 'ADMINISTRADOR')
const perfilTravado = computed(() => !isAdministrador.value)
const regionalTravada = computed(() => !isAdministrador.value)

const perfisDisponiveis = computed(() => {
  const permitidos = isAdministrador.value
    ? ['COLABORADOR', 'GESTOR_FROTA', 'ADMINISTRADOR']
    : ['COLABORADOR']
  return permitidos.map((valor) => ({ title: PERFIL_LABELS[valor], value: valor }))
})

function opcaoRegional(regional) {
  return {
    value: regional.id,
    title: regional.sigla ? `${regional.nome} (${regional.sigla})` : regional.nome,
  }
}

const regionaisDisponiveis = computed(() => {
  if (regionalTravada.value) {
    const propria = usuarioLogado.value?.regional
    return propria ? [opcaoRegional(propria)] : []
  }
  // O endpoint não filtra por `ativo`, então a filtragem é aqui. O resumo que vem
  // dentro do usuário não traz esse campo, por isso a comparação é com !== false.
  return regionais.value.filter((regional) => regional.ativo !== false).map(opcaoRegional)
})

const gestorSemRegional = computed(
  () =>
    regionalTravada.value &&
    !carregandoDados.value &&
    !erroCarregamento.value &&
    !usuarioLogado.value?.regional,
)

// Matrícula e regional são obrigatórias para COLABORADOR e GESTOR_FROTA, e
// opcionais para ADMINISTRADOR — conta de infraestrutura pode não ter regional.
const camposDePerfilObrigatorios = computed(() => localUser.value.perfil !== 'ADMINISTRADOR')

// === Validações ===
// Os formatos espelham o UserValidator do backend. É conveniência de interface:
// a mesma requisição chega por curl, e quem garante é o backend.
const rules = {
  required: (v) => (v !== null && v !== undefined && v !== '') || 'Campo obrigatório',
  nome: (v) =>
    !v ||
    (v.trim().length >= 2 && v.trim().length <= 100) ||
    'Nome deve ter entre 2 e 100 caracteres',
  email: (v) => !v || /.+@.+\..+/.test(v) || 'E-mail inválido',
  telefone: (v) =>
    !v ||
    /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(v) ||
    'Telefone inválido. Use o formato (47) 99999-8888',
  matricula: (v) => !v || /^\d{4,12}$/.test(v) || 'Matrícula deve conter de 4 a 12 dígitos',
}

const regrasMatricula = computed(() =>
  camposDePerfilObrigatorios.value ? [rules.required, rules.matricula] : [rules.matricula],
)

const regrasRegional = computed(() => (camposDePerfilObrigatorios.value ? [rules.required] : []))

function mensagemDeErro(err) {
  const corpo = err?.response?.data
  const codigo = corpo?.error

  // O 403 do próprio Spring Security não passa pelo GlobalExceptionHandler e
  // chega sem corpo — daí o fallback até a mensagem genérica.
  if (codigo && MENSAGENS_POR_ERRO[codigo]) return MENSAGENS_POR_ERRO[codigo]
  if (corpo?.message) return corpo.message
  return MENSAGEM_ERRO_PADRAO
}

async function carregarDados() {
  carregandoDados.value = true
  erroCarregamento.value = ''
  try {
    const requisicoes = [getRegionais()]
    if (regionalTravada.value) requisicoes.push(getUsuarioAutenticado())

    const [respostaRegionais, autenticado] = await Promise.all(requisicoes)
    regionais.value = respostaRegionais.data.content ?? []

    if (regionalTravada.value) {
      usuarioLogado.value = autenticado
      localUser.value.regionalId = autenticado?.regional?.id ?? null
    }
  } catch {
    erroCarregamento.value =
      'Não foi possível carregar as regionais. Feche e abra o formulário para tentar de novo.'
  } finally {
    carregandoDados.value = false
  }
}

// === Salvar Usuário ===
const handleSave = async () => {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  isLoading.value = true
  try {
    const body = {
      name: localUser.value.name.trim(),
      email: localUser.value.email.trim(),
      telefone: localUser.value.telefone?.trim() || null,
      matricula: localUser.value.matricula?.trim() || null,
      perfil: localUser.value.perfil,
      regionalId: localUser.value.regionalId ?? null,
    }

    const response = await createUser(body)
    emit('save', response.data)
    emit('update:modelValue', false)

    // conviteEnviado só vem preenchido no POST e no reenvio. Em GET vem null, e
    // null não é falha: só `false` significa que o e-mail não saiu.
    if (response.data?.conviteEnviado === false) {
      warningDialog.value = true
    } else {
      successDialog.value = true
    }
  } catch (err) {
    mensagemErro.value = mensagemDeErro(err)
    errorDialog.value = true
  } finally {
    isLoading.value = false
  }
}

// Cada abertura começa do zero e recarrega regionais e usuário logado.
watch(
  () => props.modelValue,
  (aberto) => {
    if (!aberto) return
    localUser.value = formVazio()
    form.value?.resetValidation()
    carregarDados()
  },
)
</script>

<style scoped>
.dialog-content {
  padding: 24px !important;
}

.dialog-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cancel-btn {
  color: var(--color-text-muted);
  border-color: var(--color-border-strong);
  font-weight: 600;
  margin-right: 0 !important;
}

.save-btn {
  font-weight: 600;
}

/* Responsividade */
@media (max-width: 600px) {
  .dialog-content {
    padding: 20px !important;
  }
}
</style>
