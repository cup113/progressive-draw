<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import { useEntrantsStore } from '@/stores/entrants';

import { computed, ref } from 'vue';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const settings = useSettingsStore();
const entrants = useEntrantsStore();

const times = ref(1);
const transitionElements = ref<HTMLElement[]>([]);

const nameList = computed({
  get() {
    return settings.settings.nameList.join('\n');
  },
  set(value: string) {
    const newNameList = value.trim().split('\n');
    settings.settings.nameList.splice(0, settings.settings.nameList.length, ...newNameList);
  }
});

function storeRef(el: unknown) {
  transitionElements.value.push(el as HTMLElement);
}

function start_draw() {
  entrants.start_draw(times.value);
}
</script>

<template>
  <main class="flex flex-col gap-4">
    <h1>Progressive Draw</h1>
    <Textarea v-model="nameList"></Textarea>
    <form @submit.prevent class="flex gap-2 justify-center">
      <Input v-model="times" type="number" min="1" max="100" step="1" placeholder="请输入抽奖次数" class="w-20"></Input>
      <Button @click="start_draw">开始抽奖</Button>
    </form>
    <section>
      <TransitionGroup tag="ol" class="flex flex-col gap-2" name="fade">
        <li v-for="entrant in entrants.rankedEntrants" :key="entrant.name" :ref="storeRef"
          class="flex items-center gap-1 px-2 py-1 rounded-md border-2 border-slate-200">
          <div class="font-bold w-36">{{ entrant.name }}</div>
          <Badge v-if="entrant.won">Won</Badge>
          <Progress :model-value="Math.min(entrant.distance, entrants.maxDistance) / (entrants.maxDistance || 1) * 100"
            :max="100" class="[&>div]:transition-transform [&>div]:duration-300 [&>div]:ease-in-out"></Progress>
        </li>
      </TransitionGroup>
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
  transition: transform 0.3s ease;
}
</style>
