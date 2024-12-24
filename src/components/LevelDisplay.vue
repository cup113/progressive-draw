<script lang="ts" setup>
import { computed } from 'vue';
import { useEntrantsStore } from '@/stores/entrants';

const props = defineProps<{
    levelNo: number;
}>();

const entrants = useEntrantsStore();

const vibrantBg = [
    'bg-red-200',
    'bg-yellow-200',
    'bg-green-200',
    'bg-blue-200',
    'bg-purple-200',
]

const bgClass = computed(() => {
    const index = props.levelNo % vibrantBg.length;
    return vibrantBg[index];
});

const style = computed(() => {
    return {
        'bottom': `${(props.levelNo - entrants.scene.camera.bottom) / entrants.scene.camera.levels * 100}%`,
        'height': `${100 / entrants.scene.camera.levels}%`,
    }
});
</script>

<template>
    <div class="w-full absolute flex items-center text-gray-500" :class="bgClass" :style="style">
        <div class="text-sm font-bold">{{ levelNo }}</div>
    </div>
</template>
