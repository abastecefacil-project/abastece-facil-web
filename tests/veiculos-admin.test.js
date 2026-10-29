import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

// Veículos do admin (R15). A linha não tem formatação a centralizar (placa e
// modelo saem crus, o status é o booleano `active`), então não há função de
// apresentação: o que se protege aqui é o código-fonte da tela e do diálogo.

const ler = (caminho) => readFileSync(new URL(`../src/${caminho}`, import.meta.url), 'utf8')

const TELA = 'views/admin/VehicleManagement.vue'
const DIALOGO = 'components/admin/VehicleDialog.vue'

test('nenhuma cor literal nem elevation em Veículos', () => {
  for (const arquivo of [TELA, DIALOGO]) {
    const fonte = ler(arquivo)
    assert.doesNotMatch(fonte, /#[0-9a-fA-F]{3,8}\b/, `hex em ${arquivo}`)
    assert.doesNotMatch(fonte, /\brgba?\(/, `rgb em ${arquivo}`)
    assert.doesNotMatch(fonte, /\belevation=/, `elevation em ${arquivo}`)
  }
})

test('o VehicleCard foi removido e a tela não o importa', () => {
  assert.equal(existsSync(new URL('../src/components/admin/VehicleCard.vue', import.meta.url)), false)
  assert.doesNotMatch(ler(TELA), /VehicleCard/)
})

test('as ações da linha nomeiam o veículo pela placa', () => {
  const tela = ler(TELA)
  assert.match(tela, /:aria-label="`Editar veículo \$\{veiculo\.plate\}`"/)
  assert.match(tela, /`Excluir veículo \$\{veiculo\.plate\}`/)
})

test('excluir vale também para veículo inativo (exclusão física)', () => {
  // F4: desabilitar em linha inativa removia uma funcionalidade que o backend
  // aceita (CarService.deleteCar não olha o status).
  const tela = ler(TELA)
  assert.doesNotMatch(tela, /:disabled=/)
  assert.doesNotMatch(tela, /não pode ser excluído/)
})

test('o veículo novo começa com status booleano, não com a string "ativo"', () => {
  const tela = ler(TELA)
  assert.doesNotMatch(tela, /status: 'ativo'/)
  assert.match(tela, /const resetForm = \(\) => \{[\s\S]*?status: true,/)
})

test('falha ao excluir abre o modal de erro em Veículos e em Postos', () => {
  for (const arquivo of [TELA, 'views/admin/StationManagement.vue']) {
    const fonte = ler(arquivo)
    assert.match(fonte, /from '@\/utils\/exclusao'/, arquivo)
    assert.match(fonte, /mensagemErroExclusao\(err\)/, arquivo)
    assert.match(
      fonte,
      /<BaseStatusModal\s+v-model="modalErroExclusao"[\s\S]*?@after-leave="aoFecharDialogo"/,
      arquivo,
    )
  }
})

test('o diálogo emite `fechado` no formulário e nos dois modais de status', () => {
  const dialogo = ler(DIALOGO)
  assert.equal(dialogo.match(/@after-leave="\$emit\('fechado'\)"/g)?.length, 3)
  assert.match(dialogo, /defineEmits\(\[[^\]]*'fechado'/)
})

test('o corpo enviado continua { licensePlate, model, isActive }', () => {
  const dialogo = ler(DIALOGO)
  assert.match(
    dialogo,
    /licensePlate: localVeiculo\.value\.plate\.replace\('-', ''\),\s*model: localVeiculo\.value\.model,\s*isActive: localVeiculo\.value\.active/,
  )
})

test('a tela devolve o foco com utils/foco.js em todos os diálogos', () => {
  const tela = ler(TELA)
  assert.match(tela, /from '@\/utils\/foco'/)
  assert.match(tela, /<VehicleDialog[\s\S]*?@fechado="aoFecharDialogo"/)
  assert.match(tela, /<ConfirmDialog[\s\S]*?@after-leave="aoFecharDialogo"/)
})

test('Ocorrências usa utils/foco.js, sem cópia local da devolução de foco', () => {
  const ocorrencias = ler('views/admin/OccurrencesAnalysis.vue')
  assert.match(ocorrencias, /import \{ devolverFoco \} from '@\/utils\/foco'/)
  assert.doesNotMatch(ocorrencias, /function devolverFoco/)
})
