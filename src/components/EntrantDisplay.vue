<script lang="ts" setup>
import { useEntrantsStore, type Entrant } from '@/stores/entrants';
import { computed } from 'vue';

const props = defineProps<{
    entrant: Entrant;
}>();

const entrants = useEntrantsStore();

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

const style = computed(() => {
    const entrant = props.entrant;
    const camera = entrants.scene.camera;
    const baseMiddle = entrant.level % 2 === entrants.scene.drawState.totalLevels % 2 ? 46.5 : 51.5;
    const { x: replacedX, y: replacedY } = get_replaced_coordinate(entrant.horizontalPosition);
    const displayLevel = (won.value ? replacedY : 0) + entrant.level;
    const displayHorizontal = won.value ? replacedX : entrant.horizontalPosition;
    const moveAxis = (displayLevel - camera.bottom + 0.25) / camera.levels; // TODO in-place fine-tune
    const scale = won.value ? 1.3 : (entrant.activated ? (1.2 + entrant.activation * 0.3) : (1 + entrant.activation * 0.2));
    const hue = won.value ? 63 : entrant.activation * 100 + 50;
    const saturation = won.value ? 100 : entrant.activation * 60 + 20;

    return {
        'bottom': `${moveAxis * 100}%`,
        'right': `${baseMiddle - displayHorizontal * 10}%`,
        '--color': `hsl(${hue}, ${saturation}%, 70%)`,
        '--scale': `${scale}`,
    };
});
</script>

<template>
    <div class="absolute rounded-lg entrant-display" :style="style">
        <div class="absolute text-xs bg-yellow-200 rounded-full w-4 h-4 text-center" v-show="won">{{ entrant.wonNo }}</div>
        <div class="font-bold w-24 h-12 text-center rounded-xl px-2 py-1 flex flex-col justify-center text-lg">
            <div class="text-xs text-slate-500 -mb-0.5 tracking-wider font-sans">{{ entrant.detail }}</div>
            <div class="text-lg">{{ entrant.name }}</div>
        </div>
    </div>
</template>

<style>
.entrant-display {
    transform: scale(var(--scale, 1));
    transition: bottom 0.4s ease, right 0.4s ease, background-color 0.4s ease, transform 0.4s ease;
    background-color: var(--color, #fff);
}
</style>
