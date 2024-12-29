<script setup lang="ts">
import { useEntrantsStore } from '@/stores/entrants';
import { useSettingsStore } from '@/stores/settings';
import { useHistoryStore } from '@/stores/history';
import { useFullscreen } from '@vueuse/core';
import { useMediaControls } from '@vueuse/core';

import EntrantDisplay from '@/components/EntrantDisplay.vue';
import LevelDisplay from '@/components/LevelDisplay.vue';
import { Button } from '@/components/ui/button';
import { computed, ref, watch } from 'vue';

const entrants = useEntrantsStore();
const settings = useSettingsStore();
const history = useHistoryStore();

const main = ref();
const bgMusic = ref();

const { isFullscreen, enter, exit } = useFullscreen(main);
const { playing, volume } = useMediaControls(bgMusic);

watch(() => entrants.scene.active, (newValue) => {
  if (!newValue) {
    const handle = setInterval(() => {
      volume.value = Math.max(0, volume.value - 0.01);
      if (volume.value === 0) {
        clearInterval(handle);
        playing.value = false;
      }
    }, 150);
  }
  if (newValue) {
    playing.value = true;
    volume.value = 0;
    const handle = setInterval(() => {
      volume.value += 0.01;
      if (volume.value >= 0.12) {
        clearInterval(handle);
      }
    }, 150);
  }
})

const styleVar = computed(() => {
  return {
    '--duration': `${entrants.scene.drawState.currentDurationMs}ms`,
  };
});

function start_animate() {
  entrants.scene.start_animate(settings.currentPreset, settings.uiParams, new Set(history.historyDraws.map(record => record.winners.map(history.to_full_name)).flat()), history.record_history);
}
</script>

<template>
  <main class="flex flex-col gap-4 items-center bg-white" ref="main" :style="styleVar">
    <audio src="/Super Mario Remix.mp3" loop controls class="absolute top-0 left-0" ref="bgMusic"></audio>
    <form @submit.prevent class="flex flex-col gap-2 justify-center items-center" v-show="!entrants.scene.active">
      <div class="flex flex-wrap justify-center gap-4">
        <div v-for="preset in settings.presets" :key="preset.id" @click="settings.activePresetId = preset.id"
          class="flex flex-col items-center rounded-xl cursor-pointer"
          :class="settings.activePresetId === preset.id ? 'bg-lime-300' : 'bg-slate-200'">
          <div class="text-xs rounded-xl px-2 py-1 w-full text-center font-mono">ID: {{ preset.id.slice(0, 5) }}</div>
          <h4 class="font-bold">{{ preset.awardName }}</h4>
          <div class="mx-4 mb-1">{{ preset.totalCount }} 人 / {{ preset.totalLevels }} 级</div>
        </div>
      </div>
      <Button @click="start_animate()">开始抽奖</Button>
    </form>
    <section v-show="entrants.scene.active" class="flex flex-col gap-4 items-center">
      <h2 class="text-center text-3xl font-bold">{{ settings.currentPreset.awardName }}</h2>
    </section>
    <section class="flex flex-col gap-4">
      <div class="relative min-w-[96vw] min-h-[90vh] mx-auto overflow-hidden bg-slate-50" ref="main">
        <TransitionGroup tag="div" class="flex flex-col justify-center" name="fade">
          <LevelDisplay v-for="level in entrants.levels" :key="level" :level-no="level"></LevelDisplay>
        </TransitionGroup>
        <div>
          <EntrantDisplay v-for="entrant in entrants.entrants" :key="entrant.name + entrant.detail" :entrant="entrant">
          </EntrantDisplay>
        </div>
      </div>
    </section>
    <section v-show="(!entrants.scene.active) && (history.historyDraws.length)"
      class="flex flex-col gap-4 items-center">
      <h2 class="text-center text-2xl font-bold">历史记录</h2>
      <ul class="grid grid-cols-2 gap-2">
        <li v-for="record, index in history.historyDraws" :key="record.awardName + record.durationSec"
          class="flex items-center gap-1 bg-slate-200 rounded-xl px-4 py-2">
          <div class="flex items-center gap-1">
            <div class="font-bold">{{ record.awardName }}</div>
            <div>{{ record.durationSec.toFixed(0) }}秒</div>
            <div>{{ record.winners.length }}人</div>
            <div><Button class="bg-sky-600 hover:bg-sky-500" @click="history.remove_history(index)">删除</Button></div>
          </div>
        </li>
      </ul>
      <div><Button @click="history.export_history()">导出历史记录</Button></div>
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
  transition: opacity var(--duration, 0.4s) ease;
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
  transition: transform var(--duration, 0.4s) ease;
}
</style>
