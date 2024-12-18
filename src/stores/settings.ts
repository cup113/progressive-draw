import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const settings = useLocalStorage('PD_settings', {
    nameList: new Array<string>(),
    drawFirstSec: 5,
    drawIntervalSec: 2,
    kResistance: 0.05,
    kForceFade: 0.9,
    changePerSec: 2,
  });

  const settingsUI = useLocalStorage('PD_settings_ui', {
    entrantsRendered: 35,
    entrantsDisplayed: 25,
    columns: 8,
  });

  return {
    settings,
    settingsUI,
  }
});
