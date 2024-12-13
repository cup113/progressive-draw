<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue';
</script>

<template>
  <div class="app py-2">
    <header class="flex gap-2 justify-center items-center">
      <div class="flex gap-2 items-center">
        <img src="/favicon.ico" class="w-8 h-8">
        <h1 class="font-bold">Progressive Draw</h1>
      </div>
      <NavBar></NavBar>
    </header>
    <RouterView />
  </div>
</template>

<style>
</style>
