import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { nanoid } from 'nanoid';

export interface AwardPreset {
  id: string;
  awardName: string;
  totalCount: number;
  totalLevels: number;
  displayLevels: number;
  activationRate: number;
  animateIntervalMs: number;
  attenuation: number;
}

export interface UiParams {
  entrant: {
    baseMiddle: number;
    baseSubMiddle: number;
    elevation: number;
    widthPercentage: number;
    wonScale: number;
    activatedBaseScale: number;
    scaleFactor: number;
    hueFactor: number;
    saturationFactor: number;
    lightness: number;
  };
  level: {
    startHSL: [number, number, number];
    endHSL: [number, number, number];
    cap: number[];
  }
}

export type AwardPresetDescriptor = {
  [K in keyof AwardPreset]: {
    disabled?: boolean;
    label: string;
    description: string;
  } & (AwardPreset[K] extends number ? {
    type: 'number';
    min: number;
    max: number;
    step: number;
  } : {
    type: 'text';
    min?: never;
    max?: never;
    step?: never;
  });
};

type ExchangeableSettings = {
  nameList: string[];
  presets: AwardPreset[];
  activePresetId: string;
}

const AWARD_DESCRIPTOR: AwardPresetDescriptor = {
  id: { disabled: true, label: 'ID', description: '唯一识别标识', type: 'text' },
  awardName: { label: '奖项名称', description: '显示在大屏顶部的内容', type: 'text' },
  totalCount: { label: '抽奖人数', description: '奖品数量', type: 'number', min: 1, max: 100, step: 1 },
  totalLevels: { label: '抽奖层数', description: '级数越多，时间越长', type: 'number', min: 1, max: 100, step: 1 },
  displayLevels: { label: '显示层数', description: '显示在大屏上的层数', type: 'number', min: 1, max: 100, step: 1 },
  activationRate: { label: '激活率', description: '每次上升的大致概率', type: 'number', min: 0, max: 1, step: 0.01 },
  animateIntervalMs: { label: '动画间隔', description: '动画间隔时间', type: 'number', min: 100, max: 1000, step: 10 },
  attenuation: { label: '衰减系数', description: '衰减系数越大，惯性越强', type: 'number', min: 0, max: 1, step: 0.01 },
}

function get_default_award_preset(): AwardPreset {
  return {
    id: nanoid(),
    awardName: '抽奖',
    totalCount: 5,
    totalLevels: 25,
    displayLevels: 7,
    activationRate: 0.2,
    animateIntervalMs: 500,
    attenuation: 0.3,
  };
}

export const useSettingsStore = defineStore('settings', () => {
  const nameList = useLocalStorage('PD_nameList', new Array<string>());
  const presets = useLocalStorage('PD_presets', [get_default_award_preset()]);
  const activePresetId = useLocalStorage('PD_activePresetId', presets.value[0].id);
  const uiParams = useLocalStorage<UiParams>('PD_uiParams', {
    entrant: {
      baseMiddle: 46.5,
      baseSubMiddle: 51.5,
      elevation: 0.25,
      widthPercentage: 10,
      wonScale: 1.3,
      activatedBaseScale: 1.2,
      scaleFactor: 0.3,
      hueFactor: 60,
      saturationFactor: 60,
      lightness: 70,
    },
    level: {
      startHSL: [235, 45, 92],
      endHSL: [1, 85, 92],
      cap: [3, 5, 7, 5, 7],
    }
  });
  const currentPreset = computed(() => {
    return presets.value.find(preset => preset.id === activePresetId.value) ?? get_default_award_preset();
  });

  function add_preset() {
    presets.value.push(get_default_award_preset());
  }

  function delete_preset(id: string) {
    const index = presets.value.findIndex(preset => preset.id === id);
    if (index >= 0) {
      presets.value.splice(index, 1);
    }
  }

  function update_preset(id: string, preset: Partial<AwardPreset>) {
    const index = presets.value.findIndex(p => p.id === id);
    if (index >= 0) {
      presets.value[index] = {
        ...presets.value[index],
        ...preset,
      }
    }
  }

  function export_settings() {
    const data: ExchangeableSettings = {
      nameList: nameList.value,
      presets: presets.value,
      activePresetId: activePresetId.value,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progressive-draw-settings.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function import_settings(settings?: File) {
    if (!settings) {
      return;
    }
    const reader = new FileReader();
    reader.readAsText(settings);
    reader.onload = () => {
      const data: ExchangeableSettings = JSON.parse(reader.result as string);
      nameList.value = data.nameList;
      presets.value = data.presets;
      activePresetId.value = data.activePresetId;
    }
  }

  return {
    AWARD_DESCRIPTOR,
    nameList,
    presets,
    activePresetId,
    currentPreset,
    uiParams,
    add_preset,
    delete_preset,
    update_preset,
    export_settings,
    import_settings,
  }
});
