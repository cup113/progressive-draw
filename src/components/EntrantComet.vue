<script lang="ts" setup>
import { useEntrantsStore, type Entrant } from '@/stores/entrants';
import { computed } from 'vue';

const props = defineProps<{
    entrant: Entrant;
    index: number;
}>();

const entrants = useEntrantsStore();

const style = computed(() => {
    const entrant = props.entrant;
    const camera = entrants.scene.camera;
    const moveAxis = ((entrant.distance - camera.center) / camera.radius + 1) / 2;

    return {
        'bottom': `${moveAxis * 100}%`,
        'right': `${entrant.freeAxis * 100}%`,
        'z-index': 200 - props.index,
        '--scale': Math.min(1 + Math.pow(moveAxis, 2), 2).toString(),
    }
});
</script>

<template>
    <div class="absolute" :style="style">
        <div class="comet">
            <!--TODO 结束后第一不变绿-->
            <div class="font-bold w-20 text-center rounded-xl px-2 py-1 bg-slate-200">
                {{ entrant.name }}</div>
        </div>
    </div>
</template>

<style>
.comet {
    transform: scale(var(--scale, 1));
}
</style>
