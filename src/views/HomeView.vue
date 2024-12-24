<script setup lang="ts">
import { useEntrantsStore } from '@/stores/entrants';
import { useLocalStorage, useFullscreen } from '@vueuse/core';

import EntrantDisplay from '@/components/EntrantDisplay.vue';
import LevelDisplay from '@/components/LevelDisplay.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ref } from 'vue';

const entrants = useEntrantsStore();

const total = useLocalStorage('PD_times', 5);
const prizeName = useLocalStorage('PD_prizeName', '抽奖');

const main = ref();

const { isFullscreen, enter, exit } = useFullscreen(main);
</script>

<template>
  <main class="flex flex-col gap-4 items-center bg-white" ref="main">
    <form @submit.prevent class="flex gap-2 justify-center items-center" v-show="!entrants.scene.active">
      <div>奖项：</div>
      <Input v-model="prizeName" type="text" placeholder="请输入奖项名称" class="w-40"></Input>
      <div>人数：</div>
      <Input v-model="total" type="number" min="1" max="100" step="1" placeholder="请输入总人数" class="w-20"></Input>
      <Button @click="entrants.scene.start_animate(total)">开始抽奖</Button>
    </form>
    <section v-show="entrants.scene.active && prizeName" class="flex flex-col gap-4 items-center">
      <h2 class="text-center text-3xl font-bold">{{ prizeName }}</h2>
    </section>
    <section>
      <TransitionGroup tag="ol" class="flex flex-wrap justify-center gap-2" name="fade">
        <li v-for="entrant, i in entrants.winners" :key="entrant.name"
          class="relative flex items-center gap-1 bg-lime-300 rounded-xl px-4 py-2">
          <div class="absolute w-8 h-6 text-xs -left-2 -top-2 rounded-full bg-slate-200 p-1 text-center">#{{ i + 1 }}
          </div>
          <div>{{ entrant.name }}</div>
        </li>
      </TransitionGroup>
    </section>
    <section class="flex flex-col gap-4">
      <div class="relative min-w-[80vw] min-h-[50vh] mx-auto overflow-hidden bg-slate-50" ref="main">
        <TransitionGroup tag="div" class="flex flex-col justify-center" name="fade">
          <LevelDisplay v-for="level in entrants.levels" :key="level" :level-no="level"></LevelDisplay>
        </TransitionGroup>
        <div>
          <EntrantDisplay v-for="entrant in entrants.entrants" :key="entrant.name" :entrant="entrant"></EntrantDisplay>
        </div>
      </div>
    </section>
    <div>
      <Button v-if="isFullscreen" @click="exit" class="absolute top-2 right-2">退出全屏</Button>
      <Button v-else @click="enter" class="absolute top-2 right-2">全屏</Button>
    </div>
  </main>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from,
.fade-leave {
  opacity: 1;
}

.fade-move {
  transition: transform 0.5s ease;
}
</style>
