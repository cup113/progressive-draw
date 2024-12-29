<script lang="ts" setup>
import { useEntrantsStore, type Entrant } from '@/stores/entrants';
import { useSettingsStore } from '@/stores/settings';
import { computed } from 'vue';

const props = defineProps<{
    entrant: Entrant;
}>();

const entrants = useEntrantsStore();
const settings = useSettingsStore();

function get_replaced_coordinate(horizontalPosition: number) {
    // 0 -> (0, 2)
    // 1 -> (0, 1)
    // -1 -> (0, 0)
    // 2 -> (1, 2)
    // -2 -> (1, 1)
    // 3 -> (1, 0)
    // -3 -> (-1, 2)
    // 4 -> (-1, 1)
    // -4 -> (-1, 0)
    const unifiedIndex = (horizontalPosition > 0 ? (horizontalPosition * 2 - 1) : (
        horizontalPosition < 0 ? (-horizontalPosition * 2) : 0
    ));
    const y = 2 - unifiedIndex % 3;
    const columnIndex = Math.floor(unifiedIndex / 3);
    const x = (columnIndex % 2 === 0) ? (-columnIndex / 2) : ((columnIndex + 1) / 2);
    return { x, y };
}

const won = computed(() => props.entrant.wonNo !== 0);

const hidden = computed(() => {
    return entrants.scene.drawState.pastWinners.has(props.entrant.getFullName());
})

const style = computed(() => {
    const entrant = props.entrant;
    const params = settings.uiParams;
    const camera = entrants.scene.camera;

    const ratio = entrant.level / entrants.scene.drawState.totalLevels;
    const f = (index: 0 | 1 | 2) => (settings.uiParams.level.endHSL[index] - settings.uiParams.level.startHSL[index]) * ratio + settings.uiParams.level.startHSL[index];

    const baseMiddle = entrant.level % 2 === entrants.scene.drawState.totalLevels % 2 ? params.entrant.baseMiddle : params.entrant.baseSubMiddle;
    const { x: replacedX, y: replacedY } = get_replaced_coordinate(entrant.horizontalPosition);
    const displayLevel = (won.value ? replacedY : 0) + entrant.level;
    const displayHorizontal = won.value ? replacedX : entrant.horizontalPosition;
    const moveAxis = (displayLevel - camera.bottom + params.entrant.elevation) / camera.levels;
    const scale = won.value ? params.entrant.wonScale : ((entrant.activated ? params.entrant.activatedBaseScale : 1) + entrant.activation * params.entrant.scaleFactor);
    const hue = won.value ? 63 : entrant.activation * params.entrant.hueFactor + (f(0) - params.entrant.hueFactor * 0.8);
    const saturation = won.value ? 100 : entrant.activation * params.entrant.saturationFactor + Math.max(f(1) - 35, 0);

    return {
        'bottom': `${moveAxis * 100}%`,
        'right': `${baseMiddle - displayHorizontal * params.entrant.widthPercentage}%`,
        '--color': `hsl(${hue}, ${saturation}%, ${params.entrant.lightness}%)`,
        '--scale': `${scale}`,
    };
});
</script>

<template>
    <div class="absolute rounded-lg entrant-display" :style="style" :class="{ 'hidden': hidden }">
        <div class="absolute text-xs bg-yellow-200 rounded-full w-4 h-4 text-center" v-show="won">{{ entrant.wonNo }}
        </div>
        <div class="font-bold w-24 h-12 text-center rounded-xl px-2 py-1 flex flex-col justify-center text-lg">
            <div class="text-xs text-slate-600 -mb-0.5 tracking-widest">{{ entrant.detail }}</div>
            <div class="text-lg">{{ entrant.name }}</div>
        </div>
    </div>
</template>

<style>
.entrant-display {
    transform: scale(var(--scale, 1));
    background-color: var(--color, #fff);
    transition-property: bottom, right, background-color, transform;
    transition-duration: var(--duration, 0.4s);
    transition-timing-function: ease;
}
</style>
