<script setup lang="ts">
import { useEntrantsStore } from '@/stores/entrants';
import { useSettingsStore } from '@/stores/settings';
import { useHistoryStore } from '@/stores/history';
import { useFullscreen } from '@vueuse/core';

import EntrantDisplay from '@/components/EntrantDisplay.vue';
import LevelDisplay from '@/components/LevelDisplay.vue';
import { Button } from '@/components/ui/button';
import { ref } from 'vue';

const entrants = useEntrantsStore();
const settings = useSettingsStore();
const history = useHistoryStore();

const main = ref();

const { isFullscreen, enter, exit } = useFullscreen(main);

function start_animate() {
  entrants.scene.start_animate(settings.currentPreset, history.record_history);
}
</script>

<template>
  <main class="flex flex-col gap-4 items-center bg-white" ref="main">
    <form @submit.prevent class="flex flex-col gap-2 justify-center items-center" v-show="!entrants.scene.active">
      <div class="flex flex-wrap justify-center gap-4">
        <div v-for="preset in settings.presets" :key="preset.id" @click="settings.activePresetId = preset.id" class="flex flex-col items-center rounded-xl cursor-pointer" :class="settings.activePresetId === preset.id ? 'bg-lime-300' : 'bg-slate-200'">
          <div class="text-xs rounded-xl border-2 px-2 border-slate-500 w-full text-center font-mono">ID: {{ preset.id.slice(0, 5) }}</div>
          <h4 class="font-bold">{{ preset.awardName }}</h4>
          <div class="mx-4 mb-1">{{ preset.totalCount }} 人 / {{ preset.totalLevels }} 级</div>
        </div>
      </div>
      <Button @click="start_animate()">开始抽奖</Button>
    </form>
    <section v-show="entrants.scene.active" class="flex flex-col gap-4 items-center">
      <h2 class="text-center text-3xl font-bold">{{ settings.currentPreset.awardName }}</h2>
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
