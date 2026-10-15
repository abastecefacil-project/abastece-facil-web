import { montarUrlWhatsapp, normalizarNumeroWhatsapp } from '@/utils/whatsapp.js'

/**
 * URL do WhatsApp da gestão de frota, ou `null` se `VITE_WHATSAPP_SUPORTE`
 * estiver ausente ou inválida. O valor entra no bundle no momento do build.
 *
 * O aviso fica no nível do módulo, que é avaliado uma vez por carga de página;
 * dentro do `<script setup>` ele se repetiria a cada visita à Central de Ajuda.
 */
const { numero, motivo } = normalizarNumeroWhatsapp(import.meta.env.VITE_WHATSAPP_SUPORTE)

if (!numero) {
  const causa = motivo === 'ausente' ? 'não está definida' : 'está em formato inválido'
  console.warn(
    `[Central de Ajuda] VITE_WHATSAPP_SUPORTE ${causa}; o contato por WhatsApp da gestora de frota ` +
      'não será exibido. Formato esperado: só dígitos, com país e DDD (ex.: 5547999999999).',
  )
}

export const URL_WHATSAPP_SUPORTE = numero ? montarUrlWhatsapp(numero) : null
