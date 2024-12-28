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

    function remove_history(index: number) {
        historyDraws.value.splice(index, 1);
    }

    return {
        historyDraws,
        record_history,
        remove_history,
    }
});