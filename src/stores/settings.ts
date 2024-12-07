import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const settings = useLocalStorage('PD_settings', {
    nameList: new Array<string>(),
    drawFirstSec: 3,
    drawIntervalSec: 1,
    kResistance: 0.01,
    kForceFade: 0.9,
    changePerSec: 5,
  });

  return {
    settings,
  }
});
