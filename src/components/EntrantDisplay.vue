<script lang="ts" setup>
import { useEntrantsStore, type Entrant } from '@/stores/entrants';
import { computed } from 'vue';

const props = defineProps<{
    entrant: Entrant;
}>();

const entrants = useEntrantsStore();

const style = computed(() => {
    const entrant = props.entrant;
    const camera = entrants.scene.camera;
    const moveAxis = (entrant.level - camera.bottom + 0.25) / camera.levels;
    const isActivated = entrant.activation >= entrants.scene.drawState.activationThreshold;
    const scale = isActivated ? (1.2 + entrant.activation * 0.3) : (1 + entrant.activation * 0.2);

    return {
        'bottom': `${moveAxis * 100}%`,
        'right': `${50 - entrant.horizontalPosition * 9}%`, // TODO
        '--color': `hsl(${entrant.activation * 100 + 50}, ${entrant.activation * 60 + 20}%, 70%)`,
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
