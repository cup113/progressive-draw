import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { useSettingsStore } from "./settings";
import type { AwardPreset } from "./settings";
import type { HistoryDraw } from "./history";

export class Entrant {
    public name: string;
    public level: number;
    public activation: number;
    public wonNo: number;
    public horizontalPosition: number;

    constructor(name: string) {
        this.name = name;
        this.level = 1;
        this.activation = 0;
        this.wonNo = 0;
        this.horizontalPosition = 0;
    }

    public getWon() {
        return this.wonNo > 0;
    }

    public reset() {
        this.level = 1;
        this.activation = 0;
        this.wonNo = 0;
    }

    public win(no: number) {
        this.wonNo = no;
        this.activation = 0;
    }
}

type Camera = { bottom: number, levels: number };

type DrawState = {
    totalLevels: number;
    levels: Map<number, Level>;
    topLevel: Level;
    activationRate: number;
    activationThreshold: number;
    totalCount: number;
    remainingCount: number;
    attenuation: number;
    startTimestamp: number;
    winners: Set<Entrant>;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Level {
    public leftMost: number;
    public rightMost: number;
    public entrants: Set<Entrant>;

    constructor(entrants: Set<Entrant>) {
        this.entrants = new Set();
        this.leftMost = 1;
        this.rightMost = 0;
        entrants.forEach(entrant => {
            this.addEntrant(entrant);
        });
    }

    public removeEntrant(entrant: Entrant) {
        this.entrants.delete(entrant);
        const moveToRight = entrant.horizontalPosition > (this.leftMost + this.rightMost) / 2;
        if (moveToRight) {
            this.leftMost += 1;
        } else {
            this.rightMost -= 1;
        }
        this.entrants.forEach(other => {
            if (moveToRight) {
                if (other.horizontalPosition < entrant.horizontalPosition) {
                    other.horizontalPosition += 1;
                }
            } else {
                if (other.horizontalPosition > entrant.horizontalPosition) {
                    other.horizontalPosition -= 1;
                }
            }
        });
    }

    public addEntrant(entrant: Entrant) {
        this.entrants.add(entrant);
        const placeRight = (-this.leftMost) >= this.rightMost;
        if (placeRight) {
            this.rightMost += 1;
            entrant.horizontalPosition = this.rightMost;
        } else {
            this.leftMost -= 1;
            entrant.horizontalPosition = this.leftMost;
        }
    }
}

class Scene {
    public active: boolean;
    public camera: Camera;
    public drawState: DrawState;
    public entrants: Entrant[];

    constructor(entrants: Entrant[]) {
        this.active = false;
        this.camera = {
            bottom: 1,
            levels: 7,
        }
        this.drawState = {
            totalLevels: 25,
            activationRate: 0.3,
            activationThreshold: 1,
            totalCount: 0,
            remainingCount: 0,
            attenuation: 0.3,
            startTimestamp: Date.now(),
            winners: new Set<Entrant>(),
            levels: new Map<number, Level>(),
            topLevel: new Level(new Set()),
        };
        this.entrants = entrants;
    }

    public reset(preset: AwardPreset) {
        this.active = true;
        this.camera.bottom = 1;
        this.camera.levels = preset.displayLevels;
        this.drawState.activationRate = preset.activationRate;
        this.drawState.activationThreshold = 1;
        this.drawState.totalCount = preset.totalCount;
        this.drawState.remainingCount = preset.totalCount;
        this.drawState.attenuation = preset.attenuation;
        this.drawState.startTimestamp = Date.now();
        this.drawState.winners.clear();
        this.drawState.levels.clear();
        this.drawState.levels.set(1, new Level(new Set(this.entrants)));
        this.drawState.topLevel = new Level(new Set());

        this.entrants.forEach(entrant => entrant.reset());
    }

    public async start_animate(preset: AwardPreset, onFinish: (draw: HistoryDraw) => void) {
        this.reset(preset);
        await sleep(500);

        while (this.active) {
            this.step_activate();
            await sleep(500); // TODO configurable
            this.step_motion();
            await sleep(500);
            this.step_home();
            await sleep(300);
        }

        const historyDraw: HistoryDraw = {
            awardName: preset.awardName,
            durationSec: (Date.now() - this.drawState.startTimestamp) / 1000,
            winners: Array.from(this.drawState.winners).map(entrant => entrant.name),
        };
        onFinish(historyDraw);
    }

    public step_activate() {
        this.drawState.activationThreshold = 1 - this.drawState.activationRate;

        this.entrants.filter(entrant => !entrant.getWon()).forEach(entrant => {
            entrant.activation += Math.random();
        });

        // Check to avoid excessive winners
        this.drawState.levels.forEach((level, levelNo) => {
            if (levelNo === this.drawState.totalLevels - 1) {
                const activatedWinners = new Array<Entrant>();
                level.entrants.forEach(entrant => {
                    if (entrant.activation >= this.drawState.activationThreshold) {
                        activatedWinners.push(entrant);
                    }
                });
                if (this.drawState.remainingCount < activatedWinners.length) {
                    activatedWinners.sort((a, b) => b.activation - a.activation);
                    activatedWinners.slice(this.drawState.remainingCount).forEach(entrant => {
                        entrant.activation = this.drawState.activationThreshold * 0.9;
                    });
                }
            }
        })
    }

    public step_motion() {
        const activatedEntrant = new Set<Entrant>();

        this.entrants.forEach(entrant => {
            if (entrant.activation >= this.drawState.activationThreshold) {
                activatedEntrant.add(entrant);
            }
        });

        activatedEntrant.forEach(entrant => {
            if (entrant.getWon()) {
                return;
            }
            const currentLevel = this.drawState.levels.get(entrant.level);
            if (!currentLevel) {
                throw TypeError(`Level ${entrant.level} not found`);
            }
            currentLevel.removeEntrant(entrant);

            entrant.level += 1;
            if (entrant.level >= this.drawState.totalLevels) {
                this.drawState.topLevel.addEntrant(entrant);
                entrant.win(this.drawState.winners.size + 1);
                this.drawState.winners.add(entrant);
                this.drawState.remainingCount -= 1;
                if (this.drawState.remainingCount === 0) {
                    this.active = false;
                }
                return;
            }

            if (!this.drawState.levels.has(entrant.level)) {
                this.drawState.levels.set(entrant.level, new Level(new Set()));
            }
            const newLevel = this.drawState.levels.get(entrant.level);
            if (!newLevel) {
                throw TypeError(`Level ${entrant.level} not found`);
            }

            newLevel.addEntrant(entrant);
        });
    }

    public step_home() {
        const maxLevel = Math.max.apply(null, this.entrants.map(entrant => entrant.level));
        if (this.camera.bottom + this.camera.levels - 2 <= maxLevel) {
            this.camera.bottom += 1;
        }
        this.entrants.forEach(entrant => {
            if (entrant.activation >= this.drawState.activationThreshold) {
                entrant.activation -= this.drawState.activationThreshold;
            } else {
                entrant.activation *= this.drawState.attenuation;
            }
        });
    }
}

export const useEntrantsStore = defineStore("entrants", () => {
    const settings = useSettingsStore();
    const entrants: Entrant[] = reactive([]);

    const scene = reactive(new Scene(entrants));

    const winners = computed(() => entrants.filter(entrant => entrant.getWon()).sort((a, b) => a.wonNo - b.wonNo));

    const levels = computed(() => {
        const _levels = new Array<number>();
        for (let i = scene.camera.bottom; i <= scene.drawState.totalLevels && _levels.length < scene.camera.levels; i++) {
            _levels.push(i);
        }
        return _levels.reverse();
    })

    watch(() => settings.nameList, nameList => {
        const newEntrants = nameList.map(name => new Entrant(name));
        entrants.splice(0, entrants.length, ...newEntrants);
    }, { immediate: true, deep: true });

    return {
        entrants,
        scene,
        winners,
        levels,
    }
});