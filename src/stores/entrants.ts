import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { useSettingsStore } from "./settings";

export class Entrant {
    public name: string;
    public distance: number;
    public velocity: number;
    public force: number;
    public won: boolean;

    constructor(name: string) {
        this.name = name;
        this.distance = 0;
        this.velocity = 0;
        this.force = 0;
        this.won = false;
    }

    public reset() {
        this.distance = 0;
        this.velocity = 2;
        this.force = 0;
        this.won = false;
    }

    public updateForce(deltaForce: number, kForceFade: number) {
        this.force *= kForceFade;
        this.force += deltaForce;
        if (this.force < 0) {
            this.force = 0;
        }
    }

    public move(kResistance: number, time: number) {
        this.velocity += (this.force - kResistance * this.velocity * this.velocity) * time;
        if (this.velocity < 0) {
            this.velocity = 0;
        }
        this.distance += this.velocity * time;
    }

    public win() {
        this.won = true;
    }
}

export const useEntrantsStore = defineStore("entrants", () => {
    const settings = useSettingsStore();
    const entrants: Entrant[] = reactive([]);
    const maxDistance = computed(() => Math.max(...entrants.filter(entrant => !entrant.won).map(entrant => entrant.distance)));
    const rankedEntrants = computed(() => entrants.filter(entrant => !entrant.won).sort((a, b) => {
        return b.distance - a.distance;
    }).slice(0, 20 /* TODO magic number */));
    const winners = computed(() => entrants.filter(entrant => entrant.won));
    const nextWinSec = ref<number>(0);
    const handle = ref<ReturnType<typeof setInterval> | undefined>();

    watch(() => settings.settings.nameList, nameList => {
        const newEntrants = nameList.map(name => new Entrant(name));
        entrants.splice(0, entrants.length, ...newEntrants);
    }, { immediate: true, deep: true });

    function start_draw(times: number) {
        if (handle.value) {
            console.warn("Draw already in progress");
            return;
        }
        const winners = new Set<Entrant>();
        entrants.forEach(entrant => entrant.reset());

        nextWinSec.value = settings.settings.drawFirstSec;
        handle.value = setInterval(() => {
            nextWinSec.value -= 1 / settings.settings.changePerSec;
            console.time("update & move");
            for (const entrant of entrants) {
                entrant.updateForce(Math.random() - 0.5, settings.settings.kForceFade);
                entrant.move(settings.settings.kResistance, settings.settings.drawIntervalSec);
            }
            console.timeEnd("update & move");
            console.time("check winner");
            if (nextWinSec.value <= 0) {
                nextWinSec.value += settings.settings.drawIntervalSec;
                const winner = entrants.find(entrant => entrant.distance === maxDistance.value);
                if (!winner) {
                    console.warn("No winner found");
                    return;
                }
                winner.win();
                winners.add(winner);
            }
            if (times && winners.size >= times) {
                clearInterval(handle.value);
                handle.value = undefined;
            }
            console.timeEnd("check winner");
        }, 1000 / settings.settings.changePerSec);
    }

    return {
        entrants,
        rankedEntrants,
        maxDistance,
        winners,
        nextWinSec,
        handle,
        start_draw,
    }
});