import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { useSettingsStore } from "./settings";
import type { AwardPreset, UiParams } from "./settings";
import type { HistoryDraw } from "./history";

export class Entrant {
    public name: string;
    public detail?: string;
    public level: number;
    public activation: number;
    public activated: boolean;
    public wonNo: number;
    public horizontalPosition: number;

    constructor(fullName: string) {
        const [name, detail] = fullName.split(":", 2);
        this.name = name;
        this.detail = detail;
        this.level = 1;
        this.activation = 0;
        this.activated = false;
        this.wonNo = 0;
        this.horizontalPosition = 0;
    }

    public getWon() {
        return this.wonNo > 0;
    }

    public getFullName() {
        if (this.detail) {
            return `${this.detail} ${this.name}`
        } else {
            return this.name;
        }
    }

    public reset() {
        this.level = 1;
        this.activation = 0;
        this.activated = false;
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
    baseDurationMs: number;
    currentDurationMs: number;
    attenuation: number;
    startTimestamp: number;
    levelCountCap: number[];
    winners: Set<Entrant>;
    pastWinners: Set<string>;
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
            baseDurationMs: 500,
            currentDurationMs: 500,
            startTimestamp: Date.now(),
            winners: new Set<Entrant>(),
            pastWinners: new Set<string>(),
            levels: new Map<number, Level>(),
            levelCountCap: [3, 5, 7, 5, 7],
            topLevel: new Level(new Set()),
        };
        this.entrants = entrants;
    }

    public get_participated_entrants() {
        return this.entrants.filter(entrant => !this.drawState.pastWinners.has(entrant.getFullName()));
    }

    public get_underway_entrants() {
        return this.get_participated_entrants().filter(entrant => !entrant.getWon());
    }

    public get_max_level() {
        return Math.max.apply(null, this.get_participated_entrants().map(entrant => entrant.level));
    }

    public reset(preset: AwardPreset, uiParams: UiParams, pastWinners: Set<string>) {
        this.active = true;
        this.camera.bottom = 1;
        this.camera.levels = preset.displayLevels;
        this.drawState.activationRate = preset.activationRate;
        this.drawState.activationThreshold = 1;
        this.drawState.baseDurationMs = preset.animateIntervalMs;
        this.drawState.currentDurationMs = preset.animateIntervalMs;
        this.drawState.totalLevels = preset.totalLevels;
        this.drawState.totalCount = preset.totalCount;
        this.drawState.remainingCount = preset.totalCount;
        this.drawState.attenuation = preset.attenuation;
        this.drawState.startTimestamp = Date.now();
        this.drawState.winners.clear();
        this.drawState.levels.clear();
        this.drawState.pastWinners = pastWinners;
        this.drawState.levelCountCap = uiParams.level.cap;
        this.drawState.topLevel = new Level(new Set());
        this.drawState.levels.set(1, new Level(new Set(this.get_participated_entrants())));

        this.get_participated_entrants().forEach(entrant => entrant.reset());
    }

    public async start_animate(preset: AwardPreset, uiParams: UiParams, pastWinners: Set<string>, onFinish: (draw: HistoryDraw) => void) {
        this.reset(preset, uiParams, pastWinners);
        await sleep(this.drawState.baseDurationMs * 2);

        while (this.active) {
            this.drawState.currentDurationMs = this.drawState.baseDurationMs * (0.6 + this.get_max_level() / this.drawState.totalLevels * 0.7);
            this.step_activate();
            await sleep(this.drawState.currentDurationMs);
            this.step_motion();
            await sleep(this.drawState.currentDurationMs);
            this.step_home();
            await sleep(this.drawState.currentDurationMs);
        }

        this.step_fall();
        await sleep(this.drawState.baseDurationMs * 2);

        const historyDraw: HistoryDraw = {
            awardName: preset.awardName,
            durationSec: (Date.now() - this.drawState.startTimestamp) / 1000,
            winners: Array.from(this.drawState.winners),
        };
        onFinish(historyDraw);
    }

    public step_activate() {
        this.drawState.activationThreshold = 1 - this.drawState.activationRate;

        this.get_underway_entrants().forEach(entrant => {
            entrant.activation += Math.random();
            if (entrant.activation >= this.drawState.activationThreshold) {
                entrant.activated = true;
            }
        });

        const maxLevel = this.get_max_level();
        let nextLevelEntrantsCount = 0;
        Array.from(this.drawState.levels)
            .sort(([aNo], [bNo]) => bNo - aNo)
            .filter(([levelNo]) => levelNo < maxLevel && levelNo >= maxLevel - this.drawState.levelCountCap.length)
            .forEach(([levelNo, level]) => {
                const activatedEntrants = new Array<Entrant>();
                level.entrants.forEach(entrant => {
                    if (entrant.activated) {
                        activatedEntrants.push(entrant);
                    }
                });

                // Check to avoid excessive winners
                if (levelNo === this.drawState.totalLevels - 1) {
                    if (this.drawState.remainingCount < activatedEntrants.length) {
                        activatedEntrants.sort((a, b) => b.activation - a.activation);
                        activatedEntrants.slice(this.drawState.remainingCount).forEach(entrant => {
                            entrant.activated = false;
                        });
                        activatedEntrants.splice(this.drawState.remainingCount);
                    }
                    nextLevelEntrantsCount = level.entrants.size - activatedEntrants.length;
                } else if (levelNo < maxLevel) {
                    // curbs on top levels
                    const cap = this.drawState.levelCountCap[maxLevel - levelNo - 1];
                    const vacancy = cap - nextLevelEntrantsCount;
                    if (activatedEntrants.length > vacancy) {
                        activatedEntrants.sort((a, b) => b.activation - a.activation);
                        activatedEntrants.slice(vacancy).forEach(entrant => {
                            entrant.activated = false;
                        });
                        activatedEntrants.splice(vacancy);
                    }
                    nextLevelEntrantsCount = level.entrants.size - activatedEntrants.length;
                }
            });
    }

    public step_motion() {
        const activatedEntrant = new Set<Entrant>();

        this.get_underway_entrants().forEach(entrant => {
            if (entrant.activated) {
                activatedEntrant.add(entrant);
                entrant.activated = false;
            }
        });

        activatedEntrant.forEach(async entrant => {
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
        const maxLevel = this.get_max_level();
        if (this.camera.bottom + this.camera.levels - 2 <= maxLevel) {
            this.camera.bottom += 1;
        }
        this.get_participated_entrants().forEach(entrant => {
            if (entrant.activated) {
                entrant.activation -= this.drawState.activationThreshold;
            } else {
                entrant.activation *= this.drawState.attenuation;
            }
        });
    }

    public step_fall() {
        this.get_participated_entrants().filter(entrant => !entrant.getWon()).forEach(entrant => {
            entrant.level = Math.max(0, this.camera.bottom - 1);
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