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

const style = computed(() => {
    const entrant = props.entrant;
    const camera = entrants.scene.camera;
    const { x: replacedX, y: replacedY } = get_replaced_coordinate(entrant.horizontalPosition);
    const displayLevel = (entrant.getWon() ? replacedY : 0) + entrant.level;
    const displayHorizontal = entrant.getWon() ? replacedX : entrant.horizontalPosition;
    const moveAxis = (displayLevel - camera.bottom + 0.2) / camera.levels; // TODO in-place fine-tune
    const isActivated = entrant.activation >= entrants.scene.drawState.activationThreshold;
    const scale = isActivated ? (1.2 + entrant.activation * 0.3) : (1 + entrant.activation * 0.2);
    const hue = entrant.getWon() ? 130 : entrant.activation * 100 + 50;
    const saturation = entrant.getWon() ? 85 : entrant.activation * 60 + 20;

    return {
        'bottom': `${moveAxis * 100}%`,
        'right': `${46.5 - displayHorizontal * 9}%`, // TODO
        '--color': `hsl(${hue}, ${saturation}%, 70%)`,
        '--scale': `${scale}`,
    };
});
</script>

<template>
    <div class="absolute rounded-lg entrant-display" :style="style">
        <div class="font-bold w-20 text-center rounded-xl px-2 py-1">
            {{ entrant.name }}</div>
    </div>
</template>

<style>
.entrant-display {
    transform: scale(var(--scale, 1));
    transition: bottom 0.5s ease, right 0.5s ease, background-color 0.5s ease, transform 0.5s ease;
    background-color: var(--color, #fff);
}
</style>
