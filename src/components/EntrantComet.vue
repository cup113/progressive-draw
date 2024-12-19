<script lang="ts" setup>
import type { Entrant } from '@/stores/entrants';
import { useSettingsStore } from '@/stores/settings';
import { computed } from 'vue';

const props = defineProps<{
    entrant: Entrant;
    index: number;
}>();

const settings = useSettingsStore();

const style = computed(() => {
    return {
        'right': `${(1 - props.entrant.x) * 100}%`,
        'top': `${props.entrant.y * 100}%`,
        'z-index': 200 - props.index,
        '--duration': `${1 / (settings.settings.changePerSec + 1)}s`, // to avoid flickering
        '--scale': (1 + Math.pow(props.entrant.x, 3) * 0.3).toString(),
    }
});

const bgColorClass = computed(() => {
    const rank = props.index + 1;
    if (rank === 1) {
        return 'bg-lime-200';
    } else if (rank <= 3) {
        return 'bg-cyan-300';
    } else {
        return 'bg-slate-200';
    }
});
</script>

<template>
    <div class="absolute" :style="style">
        <div class="comet">
            <!--TODO 居中对齐-->
            <div class="comet-tail"></div>
            <!--TODO 宽度可调-->
            <!--TODO 结束后第一不变绿-->
            <div class="font-bold w-28 text-center rounded-xl px-2 py-1" :class="bgColorClass">
                {{ entrant.name }}</div>
        </div>
    </div>
</template>

<style>
.comet {
    transform: scale(var(--scale, 1));
    transition: transform var(--duration, 0.5s) ease-in-out;
}

.comet-tail {
    @apply absolute top-4 -left-12 w-16 h-2 -z-10;
    filter: blur(1px);
    background-image: linear-gradient(to right, transparent, rgb(226 232 240 / var(--tw-bg-opacity, 1)));
}
</style>
