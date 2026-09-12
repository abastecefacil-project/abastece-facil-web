<template>
  <AppShell contexto="user" />
</template>

<script setup>
/*
 * Casca fina — vale igual o comentário de `AdminLayout.vue`: o shell está em
 * `AppShell.vue`, o menu em `config/navegacao.js`, este arquivo existe com este
 * nome porque `router/index.js` o usa como `component` do grupo `/user`, e não
 * pode ter bloco <style>.
 *
 * O contexto `user` é o único cujo menu precisa funcionar com `perfil === null`:
 * `/user/*` é alcançável por visitante não autenticado, porque o usuário final
 * não faz login (§1 do CLAUDE.md). É por isso que nenhum item dele declara
 * `perfis` em `config/navegacao.js` — e por isso que "completar" a lista com os
 * três perfis esvaziaria o menu de quem chega sem sessão.
 */
import AppShell from '@/layouts/AppShell.vue'
</script>
