<script lang="ts" setup>
import { useSettingsStore } from '@/stores/settings';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { computed } from 'vue';

import SettingItem from '@/components/SettingItem.vue';

const nameList = computed({
    get() {
        return settings.nameList.join('\n');
    },
    set(value: string) {
        const newNameList = value.trim().split('\n');
        settings.nameList.splice(0, settings.nameList.length, ...newNameList);
    }
});

const settings = useSettingsStore();
</script>

<template>
    <main>
        <Card class="max-w-[30rem] mx-auto">
            <CardHeader>
                <CardTitle>设置</CardTitle>
            </CardHeader>
            <CardContent>
                <form @submit.prevent class="flex flex-col gap-6">
                    <div class="flex flex-col items-center gap-4">
                        <h4 class="text-center font-bold text-lg">姓名列表</h4>
                        <Textarea v-model="nameList" placeholder="姓名列表，一人一行" class="h-72"></Textarea>
                    </div>
                    <div class="flex flex-col items-center gap-4">
                        <h4 class="text-center font-bold text-lg">预设</h4>
                        <Tabs v-model="settings.activePresetId">
                            <TabsList class="grid grid-cols-1">
                                <TabsTrigger v-for="preset in settings.presets" :key="preset.id" :value="preset.id">
                                    {{ preset.awardName }} <span class="font-mono">({{ preset.id.slice(0, 5) }})</span>
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent v-for="preset in settings.presets" :key="preset.id" :value="preset.id">
                                <div class="border-2 px-6 py-4 rounded-xl flex flex-col gap-4">
                                    <div class="flex justify-center gap-2">
                                        <Button variant="destructive" v-if="settings.presets.length > 1"
                                            @click="settings.delete_preset(preset.id)">删除</Button>
                                        <Button @click="settings.add_preset()">添加新预设</Button>
                                    </div>
                                    <SettingItem :preset="preset" v-for="_, key in settings.AWARD_DESCRIPTOR"
                                        :attribute="key" :key="key" />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </form>
            </CardContent>
        </Card>
    </main>
</template>
