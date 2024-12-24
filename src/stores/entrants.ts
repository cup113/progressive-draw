import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { useSettingsStore } from "./settings";

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
    }
}

type Camera = { bottom: number, levels: number };

type DrawState = {
    totalLevels: number;
    levels: Map<number, Level>;
    activationRate: number;
    activationThreshold: number;
    totalCount: number;
    remainingCount: number;
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
        this.entrants = entrants;
        const size = entrants.size;
        if (size % 2 === 0) {
            this.leftMost = -size / 2;
            this.rightMost = size / 2 - 1;
        } else {
            this.leftMost = (size - 1) / 2;
            this.rightMost = (size + 1) / 2;
        }
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
        const placeRight = (-this.leftMost) > this.rightMost;
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
            levels: 7, // TODO configurable
        }
        this.drawState = {
            totalLevels: 25, // TODO configurable
            activationRate: 0.3, // TODO configurable
            activationThreshold: 1,
            totalCount: 0,
            remainingCount: 0,
            winners: new Set<Entrant>(),
            levels: new Map<number, Level>(),
        };
        this.entrants = entrants;
    }

    public reset(total: number) {
        this.active = true;
        this.camera.bottom = 1;
        this.drawState.activationThreshold = 1;
        this.drawState.totalCount = total;
        this.drawState.remainingCount = total;
        this.drawState.winners.clear();
        this.drawState.levels.clear();
        this.drawState.levels.set(1, new Level(new Set(this.entrants)));

        this.entrants.forEach(entrant => entrant.reset());
    }

    public async start_animate(total: number) {
        this.reset(total);

        while (this.active) {
            this.step_activate();
            await sleep(500); // TODO configurable
            this.step_motion();
            await sleep(500);
            this.step_home();
            await sleep(300);
        }
    }

    public step_activate() {
        this.drawState.activationThreshold = 1 - this.drawState.activationRate;

        this.entrants.forEach(entrant => {
            entrant.activation += Math.random();
        });
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
            if (entrant.level > this.drawState.totalLevels) {
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
                entrant.activation /= 3;
            } else {
                entrant.activation /= 10; // TODO configurable
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
        for (let i = scene.camera.bottom; i <= scene.camera.bottom + scene.camera.levels - 1; i++) {
            _levels.push(i);
        }
        return _levels.reverse();
    })

    watch(() => settings.settings.nameList, nameList => {
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