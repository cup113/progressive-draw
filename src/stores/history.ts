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

    function export_history() {
        const content = historyDraws.value.map(({ awardName, durationSec, winners }) => {
            const winnerStr = winners.map((w, i) => `\t\t(${i + 1}) ${w}`).join("\n");
            return `Award: ${awardName}\n\tDuration: ${durationSec} seconds\n\tWinners:\n${winnerStr}`;
        }).join("\n\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "history_export.txt";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    return {
        historyDraws,
        record_history,
        remove_history,
        export_history,
    };
});