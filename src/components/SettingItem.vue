<script lang="ts" setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import type { AwardPreset, AwardPresetDescriptor } from '@/stores/settings';

import { Input } from '@/components/ui/input';

const props = defineProps<{
    preset: AwardPreset;
    attribute: keyof AwardPresetDescriptor;
}>();

const settings = useSettingsStore();

const basicInfo = computed(() => settings.AWARD_DESCRIPTOR[props.attribute]);

const model = computed({
    get() {
        return props.preset[props.attribute];
    },
    set(value) {
        settings.update_preset(props.preset.id, { [props.attribute]: value });
    }
});
</script>

<template>
    <div class="flex flex-col gap-0.5">
        <div class="flex gap-2 items-center">
            <div class="w-24">{{ basicInfo.label }}</div>
            <Input v-model="model" :disabled="basicInfo.disabled" :type="basicInfo.type" :min="basicInfo.min"
                :max="basicInfo.max" :step="basicInfo.step" />
        </div>
        <div class="text-sm text-slate-500 text-right">{{ basicInfo.description }}</div>
    </div>
</template>
