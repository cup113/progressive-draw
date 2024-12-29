<script lang="ts" setup>
import { computed } from 'vue';
import { useEntrantsStore } from '@/stores/entrants';
import { useSettingsStore } from '@/stores/settings';

const props = defineProps<{
    levelNo: number;
}>();

const entrants = useEntrantsStore();
const settings = useSettingsStore();

const isTopLevel = computed(() => props.levelNo === entrants.scene.drawState.totalLevels);

const style = computed(() => {
    const basicPercentage = 100 / entrants.scene.camera.levels;
    const ratio = props.levelNo / entrants.scene.drawState.totalLevels;
    const f = (index: 0 | 1 | 2) => (settings.uiParams.level.endHSL[index] - settings.uiParams.level.startHSL[index]) * ratio + settings.uiParams.level.startHSL[index];
    const bgHSL = `hsl(${f(0)}, ${f(1)}%, ${f(2)}%)`;
    const borderHSL = `hsl(${f(0)}, ${f(1) - 10}%, ${f(2) - 30}%)`;
    const heightPercentage = (isTopLevel.value? 3 : 1) * basicPercentage;
    return {
        'bottom': `${(props.levelNo - entrants.scene.camera.bottom) * basicPercentage}%`,
        'height': `${heightPercentage}%`,
        'background-color': bgHSL,
        'border-color': borderHSL,
    }
});
</script>

<template>
    <div class="w-full absolute flex items-center justify-between px-12 text-gray-500 border-t-2 border-dashed" :style="style">
        <div class="text-2xl font-bold opacity-50">{{ levelNo }}</div>
        <div class="text-2xl font-bold opacity-50">{{ levelNo }}</div>
    </div>
</template>
