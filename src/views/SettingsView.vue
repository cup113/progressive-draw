<script lang="ts" setup>
import { useSettingsStore } from '@/stores/settings';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { computed } from 'vue';

type Exclude<T, U> = T extends U ? never : T;

interface SettingItem<V extends 'settings' | 'settingsUI', Ex = 'nameList'> {
    key: Exclude<keyof typeof settings[V], Ex>;
    label: string;
    type: 'number' | 'text';
    min: number;
    max: number;
    step: number;
}

const settings = useSettingsStore();

const nameList = computed({
    get() {
        return settings.settings.nameList.join('\n');
    },
    set(value: string) {
        const newNameList = value.trim().split('\n');
        settings.settings.nameList.splice(0, settings.settings.nameList.length, ...newNameList);
    }
});

const settingItems: SettingItem<'settings'>[] = [
    { key: 'changePerSec', label: '每秒次数', type: 'number', min: 1, max: 30, step: 0.2 },
    { key: 'drawFirstSec', label: '首次抽取时间（秒）', type: 'number', min: 1, max: 30, step: 1 },
    { key: 'drawIntervalSec', label: '抽取间隔（秒）', type: 'number', min: 0.2, max: 10, step: 0.2 },
    { key: 'kForceFade', label: '力衰减系数', type: 'number', min: 0, max: 1, step: 0.01 },
    { key: 'kResistance', label: '阻力系数', type: 'number', min: 0, max: 0.3, step: 0.005 },
];

const settingItemsUI: SettingItem<'settingsUI'>[] = [
    { key: 'entrantsRendered', label: '渲染人数', type: 'number', min: 5, max: 100, step: 1 },
    { key: 'entrantsDisplayed', label: '界面显示人数', type: 'number', min: 5, max: 50, step: 1 },
    { key: 'columns', label: '显示列数', type: 'number', min: 1, max: 15, step: 1 },
];
</script>

<template>
    <main>
        <Card class="max-w-96 mx-auto">
            <CardHeader>
                <CardTitle>设置</CardTitle>
            </CardHeader>
            <CardContent>
                <form @submit.prevent class="max-w-96 flex flex-col gap-2">
                    <div class="flex flex-col items-center gap-4">
                        <div class="text-center">姓名列表</div>
                        <Textarea v-model="nameList" placeholder="姓名列表，一人一行" class="h-72"></Textarea>
                    </div>
                    <div v-for="item in settingItems" :key="item.key" class="flex items-center gap-4">
                        <div class="w-56 text-right">{{ item.label }}</div>
                        <Input v-model="settings.settings[item.key]" :type="item.type" :placeholder="item.label"
                            class="text-lg" />
                    </div>
                    <hr>
                    <div v-for="item in settingItemsUI" :key="item.key" class="flex items-center gap-4">
                        <div class="w-56 text-right">{{ item.label }}</div>
                        <Input v-model="settings.settingsUI[item.key]" :type="item.type" :placeholder="item.label"
                            class="text-lg" />
                    </div>
                </form>
            </CardContent>
        </Card>
    </main>
</template>
