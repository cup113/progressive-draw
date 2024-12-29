<script lang="ts" setup>
import { useSettingsStore } from '@/stores/settings';
import { Textarea } from '@/components/ui/textarea';
import { Button } from './ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { computed } from 'vue';

const settings = useSettingsStore();
const params = computed({
  get() {
    return JSON.stringify(settings.uiParams, null, 2);
  },
  set(newParams) {
    settings.uiParams = JSON.parse(newParams);
  }
})
</script>

<template>
  <Popover>
    <PopoverTrigger>
      <Button>参数调整</Button>
    </PopoverTrigger>
    <PopoverContent>
      <Textarea v-model.lazy="params" class="w-80 h-32"></Textarea>
    </PopoverContent>
  </Popover>
</template>
