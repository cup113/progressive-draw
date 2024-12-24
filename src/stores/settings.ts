import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';

export interface AwardPreset {
  awardName: string;
  totalCount: number;
  totalLevels: number;
  activationRate: number;
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = useLocalStorage('PD_settings', {
    nameList: new Array<string>(),
    drawFirstSec: 5,
    drawIntervalSec: 2,
    kResistance: 0.05,
    kForceFade: 0.7,
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
