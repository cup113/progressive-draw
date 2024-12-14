<script setup lang="ts">
import { useEntrantsStore } from '@/stores/entrants';

import { ref } from 'vue';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const entrants = useEntrantsStore();

const times = ref(1);
const prizeName = ref('');
const transitionElements = ref<HTMLElement[]>([]);

function storeRef(el: unknown) {
  transitionElements.value.push(el as HTMLElement);
}

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
          <div class="absolute w-6 h-6 text-xs -left-2 -top-2 rounded-full bg-slate-200 p-1">#{{ i + 1 }}</div>
          <div>{{ entrant.name }}</div>
        </li>
      </TransitionGroup>
    </section>
    <section class="flex flex-col gap-4">
      <div class="text-center mb-4 flex items-center justify-center gap-4 text-sm text-slate-700">
        <div>
          <span v-if="entrants.handle">{{ entrants.nextWinSec.toFixed(1) }}</span>
          <span v-else>--</span>
          <span>&nbsp;s</span>
        </div>
        <div>{{ entrants.winners.length }} / {{ times }}</div>
      </div>
      <TransitionGroup tag="div"
        class="relative w-[48rem] h-[50vh] mx-auto overflow-hidden border-8 border-slate-100 rounded-2xl" name="fade">
        <div v-for="entrant, i in entrants.rankedEntrants" :key="entrant.name" :ref="storeRef" class="absolute"
          :style="{ 'right': `${(1 - entrant.x) * 100}%`, 'top': `${entrant.y * 100}%`, 'z-index': 100 - i }">
          <div class="comet-tail"></div>
          <div class="font-bold w-28 text-center rounded-xl px-2 py-1"
            :class="{ 'bg-lime-200': i === 0, 'bg-cyan-300': i > 0 && i < 3, 'bg-slate-200': i >= 3 }"
            :style="{ 'transition': 'background-color 0.4s ease-in-out' }">
            {{ entrant.name }}</div>
        </div>
      </TransitionGroup>
      <div class="flex justify-between text-slate-500 text-sm">
        <div v-for="i in 6" :key="i">
          {{ ((entrants.viewportRange.start * (5 - i) + entrants.viewportRange.end * i) / 5).toFixed(0) }}
        </div>
      </div>
    </section>
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
  transition: transform 0.3s ease-in-out;
}

.comet-tail {
  @apply absolute top-4 -left-12 w-16 h-2 -z-10;
  filter: blur(1px);
  background-image: linear-gradient(to right, transparent, rgb(226 232 240 / var(--tw-bg-opacity, 1)));
}
</style>
