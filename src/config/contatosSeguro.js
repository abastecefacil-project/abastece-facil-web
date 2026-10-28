// Contatos do seguro da frota própria. Fonte única para a Início, o card de
// contatos (`ContactSection`) e o banner da Central de Ajuda (`SeguroInfo`),
// que até o R8 repetiam os números à mão. Mudou o número, muda só aqui.
//
// Os contatos da gestão de frota não moram aqui: vêm do backend, por regional
// (`GET /api/users/me/gestores-frota`).

import { hrefTelefone } from '../utils/formatacao.js'
import { montarUrlWhatsapp, normalizarNumeroWhatsapp } from '../utils/whatsapp.js'

export const MENSAGEM_WHATSAPP_SEGURO =
  'Olá! Preciso de atendimento do seguro para um veículo da frota.'

const TELEFONE_ASSISTENCIA = '0800 602 0088'
const TELEFONE_WHATSAPP = '(51) 99993-1300'

export const ASSISTENCIA_24H = Object.freeze({
  rotulo: 'Assistência 24h (seguro)',
  telefone: TELEFONE_ASSISTENCIA,
  href: hrefTelefone(TELEFONE_ASSISTENCIA),
})

export const WHATSAPP_SEGURO = Object.freeze({
  rotulo: 'WhatsApp do seguro',
  telefone: TELEFONE_WHATSAPP,
  href: montarUrlWhatsapp(
    normalizarNumeroWhatsapp(TELEFONE_WHATSAPP).numero,
    MENSAGEM_WHATSAPP_SEGURO,
  ),
})
