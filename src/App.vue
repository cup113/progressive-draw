<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue';
</script>

<template>
  <div class="app">
    <NavBar></NavBar>
    <RouterView />
  </div>
</template>

<style>
</style>
