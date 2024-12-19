<script setup lang="ts">
import { useEntrantsStore } from '@/stores/entrants';
import { useSettingsStore } from '@/stores/settings';
import { useLocalStorage } from '@vueuse/core';

import EntrantStar from '@/components/EntrantComet.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { computed } from 'vue';

const entrants = useEntrantsStore();
const settings = useSettingsStore();

const times = useLocalStorage('PD_times', 5);
const prizeName = useLocalStorage('PD_prizeName', '抽奖');

const cameraStyle = computed(() => {
  return {
    '--bg-x': `${-entrants.viewportRange.end * 2}%`
  }
});

function start_draw() {
  entrants.start_draw(times.value);
}
</script>

<template>
  <main class="flex flex-col gap-4 items-center">
    <form @submit.prevent class="flex gap-2 justify-center items-center" v-show="!entrants.handle">
      <div>奖项：</div>
      <Input v-model="prizeName" type="text" placeholder="请输入奖项名称" class="w-40"></Input>
      <div>人数：</div>
      <Input v-model="times" type="number" min="1" max="100" step="1" placeholder="请输入抽奖次数" class="w-20"></Input>
      <Button @click="start_draw">开始抽奖</Button>
    </form>
    <section v-show="entrants.handle && prizeName" class="flex flex-col gap-4 items-center">
      <h2 class="text-center text-3xl font-bold">{{ prizeName }}</h2>
    </section>
    <section>
      <TransitionGroup tag="ol" class="flex flex-wrap justify-center gap-2" name="fade">
        <li v-for="entrant, i in entrants.winners" :key="entrant.name"
          class="relative flex items-center gap-1 bg-lime-300 rounded-xl px-4 py-2">
          <div class="absolute w-8 h-6 text-xs -left-2 -top-2 rounded-full bg-slate-200 p-1 text-center">#{{ i + 1 }}</div>
          <div>{{ entrant.name }}</div>
        </li>
      </TransitionGroup>
    </section>
    <section class="flex flex-col gap-4">
      <div class="text-center mb-4 flex items-center justify-center gap-4 text-sm text-slate-700">
        <div>
          <Progress :model-value="entrants.nextWinSec / settings.settings.changePerSec * 100" :max="100" class="w-40"></Progress>
        </div>
        <div>
          <Progress :model-value="entrants.winners.length / times * 100" :max="100" class="w-40"></Progress>
        </div>
        <div>{{ entrants.viewportRange.start.toFixed(1) }} - {{ entrants.viewportRange.end.toFixed(1) }}</div>
      </div>
      <div class="sky-box relative w-[48rem] h-[50vh] mx-auto overflow-hidden border-8 border-slate-100 rounded-2xl" :style="cameraStyle">
        <TransitionGroup tag="div" class="" name="fade">
          <!--TODO 背景动画-->
          <!--TODO 摄像机追踪 速度不突变-->
          <EntrantStar v-for="entrant, i in entrants.rankedEntrants" :key="entrant.name" :entrant="entrant" :index="i">
          </EntrantStar>
        </TransitionGroup>
      </div>
    </section>
  </main>
</template>

<style>
.sky-box {
  background-image: linear-gradient(to right, skyblue 0%, skyblue 90%, white 92%, white 98%, skyblue 100%);
  background-size: var(--bg-size-x, 10%) 100%;
  background-position: var(--bg-x, 0);
  transition: background-position var(--duration, 0.5s) ease-in-out, background-size var(--duration, 0.5s) ease-in-out;
}

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
  transition: transform var(--duration, 0.5s) ease-in-out;
}
</style>
