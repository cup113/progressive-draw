import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

export interface HistoryDraw {
    awardName: string;
    durationSec: number
    winners: string[];
}

export const useHistoryStore = defineStore("history", () => {
    const historyDraws = useLocalStorage("PD_historyDraws", new Array<HistoryDraw>());

    function record_history(historyDraw: HistoryDraw) {
        historyDraws.value.push(historyDraw);
    }

    return {
        historyDraws,
        record_history,
    }
});