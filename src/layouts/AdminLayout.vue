<template>
  <AppShell contexto="admin" />
</template>

<script setup>
/*
 * Casca fina. Todo o shell — barra superior, drawer, modo rail, comportamento
 * mobile e CSS — vive em `AppShell.vue`; aqui só se escolhe o contexto, e o menu
 * correspondente sai de `config/navegacao.js`.
 *
 * Este arquivo continua existindo, e com este nome, porque `router/index.js` o
 * importa e o usa como `component` do grupo `/admin`. O router foi validado no
 * P0.5 com 23 casos de navegação, e virar wrapper é justamente o que permitiu
 * unificar a casca sem reabrir aquele arquivo.
 *
 * SEM bloco <style> aqui, de propósito. Um `<style scoped>` neste arquivo
 * geraria um `data-v` que alcançaria apenas o elemento raiz do `AppShell`, e os
 * seletores da casca escritos sem `:deep()` — `.v-navigation-drawer` e
 * `.drawer-item:hover` — deixariam de resolver, matando a transição de largura
 * do drawer e o hover dos itens. Estilo da casca é assunto do `AppShell.vue`.
 */
import AppShell from '@/layouts/AppShell.vue'
</script>
