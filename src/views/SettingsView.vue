<script lang="ts" setup>
import { useSettingsStore } from '@/stores/settings';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { computed } from 'vue';

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

const settingItems = [
    { key: 'changePerSec', label: '每秒次数', type: 'number' },
    { key: 'drawFirstSec', label: '首次抽取时间（秒）', type: 'number' },
    { key: 'drawIntervalSec', label: '抽取间隔（秒）', type: 'number' },
    { key: 'kForceFade', label: '力衰减系数', type: 'number' },
    { key: 'kResistance', label: '阻力系数', type: 'number' },
] satisfies { key: keyof typeof settings.settings, label: string, type: 'number' | 'text' }[]
</script>

<template>
    <main>
        <Card class="max-w-96 mx-auto">
            <CardHeader>
                <CardTitle>设置</CardTitle>
            </CardHeader>
            <CardContent>
                <form @submit.prevent class="max-w-96 flex flex-col gap-2">
                    <div class="flex items-center gap-4">
                        <div class="w-36 text-right">姓名列表</div>
                        <Textarea v-model="nameList" placeholder="姓名列表，一人一行" class="h-72"></Textarea>
                    </div>
                    <div v-for="item in settingItems" :key="item.key" class="flex items-center gap-4">
                        <div class="w-56 text-right">{{ item.label }}</div>
                        <Input v-model="settings.settings[item.key]" :type="item.type" :placeholder="item.label"
                            class="text-lg" />
                    </div>
                </form>
            </CardContent>
        </Card>
    </main>
</template>
