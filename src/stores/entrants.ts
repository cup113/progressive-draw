import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { useSettingsStore } from "./settings";

export class Entrant {
    public name: string;
    public distance: number;
    public velocity: number;
    public force: number;
    public won: boolean;
    public freeAxis: number;

    constructor(name: string) {
        this.name = name;
        this.distance = 0;
        this.velocity = 0;
        this.force = 0;
        this.won = false;
        this.freeAxis = 0.5;
    }

    public reset() {
        this.distance = 0;
        this.velocity = 2;
        this.force = 0;
        this.won = false;
        this.freeAxis = 0.5;
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

    public moveFreeAxis(deltaFreeAxis: number) {
        this.freeAxis += deltaFreeAxis;
    }

    public win() {
        this.won = true;
    }
}


interface SceneDependencies {
    updateDistance(entrant: Entrant, deltaTime: number, deltaForce: number): void;
    getInterval(total: number, remaining: number): number;
    getTargetCamera(distances: number[]): { center: number, radius: number };
}

class Camera {
    public center: number;
    public radius: number;

    public centerVelocity: number;
    public radiusVelocity: number;

    constructor() {
        this.center = 5;
        this.radius = 6;
        this.centerVelocity = 1;
        this.radiusVelocity = 0;
    }

    public reset() {
        this.center = 5;
        this.radius = 6;
        this.centerVelocity = 1;
        this.radiusVelocity = 0;
    }

    public update(deltaTime: number, targetCenter: number, targetRadius: number) {
        const K_NORMAL_APPROACH = 0.15;
        const EXPECTED_INTERVAL = 0.03;

        const expectedCenterVelocity = (targetCenter - this.center) / deltaTime;
        const expectedRadiusVelocity = (targetRadius - this.radius) / deltaTime;

        const approachRate = 1 - (Math.pow((1 - K_NORMAL_APPROACH), deltaTime / EXPECTED_INTERVAL))

        this.centerVelocity += (expectedCenterVelocity - this.centerVelocity) * approachRate;
        this.radiusVelocity += (expectedRadiusVelocity - this.radiusVelocity) * approachRate;

        this.center += this.centerVelocity * deltaTime;
        this.radius += this.radiusVelocity * deltaTime;
    }
}

class Scene {
    public active: boolean;
    public camera: Camera;
    public total: number;
    public totalSec: number;
    public remainingCount: number;
    public remainingSec: number;
    public lastSec: number;
    public entrants: Entrant[];
    public winners: Set<Entrant>;
    public dependencies: SceneDependencies;

    constructor(entrants: Entrant[], dependencies: SceneDependencies) {
        this.active = false;
        this.camera = new Camera();
        this.total = 1;
        this.totalSec = 1;
        this.remainingCount = 0;
        this.remainingSec = 0;
        this.lastSec = 0;
        this.entrants = entrants;
        this.winners = new Set();
        this.dependencies = dependencies;
    }

    public start_animate(total: number) {
        this.active = true;
        this.total = total;
        this.camera.center = 0.5;
        this.camera.radius = 1;
        this.remainingCount = total;
        this.winners.clear();
        this.lastSec = performance.now();
        this.totalSec = this.dependencies.getInterval(total, total);
        this.remainingSec = this.totalSec;

        this.entrants.forEach(entrant => entrant.reset());
        this.entrants.forEach(entrant => entrant.freeAxis = Math.random() * 0.6 + 0.2);
        requestAnimationFrame(this.animate_core.bind(this));
    }

    public animate_core() {
        const deltaTime = (performance.now() - this.lastSec) / 1000;
        this.remainingSec -= deltaTime;
        this.lastSec = performance.now();
        const maxForceIncrement = deltaTime * 0.5;

        for (const entrant of this.entrants) {
            if (entrant.won) {
                continue;
            }
            const force = Math.random() * maxForceIncrement;
            this.dependencies.updateDistance(entrant, deltaTime, force);
        }

        const distances = this.entrants.filter(entrant => !entrant.won).map(entrant => entrant.distance);
        const targetCamera = this.dependencies.getTargetCamera(distances);

        this.camera.update(deltaTime, targetCamera.center, targetCamera.radius);

        if (this.remainingSec <= 0) {
            const maxDistance = Math.max(...distances);
            const winner = this.entrants.find(entrant => entrant.distance === maxDistance);
            if (winner) {
                winner.win();
                this.winners.add(winner);
            }
            this.remainingCount--;
            if (this.remainingCount <= 0) {
                this.active = false;
                return;
            } else {
                this.totalSec = this.dependencies.getInterval(this.total, this.remainingCount);
                this.remainingSec += this.totalSec;
            }
        }

        requestAnimationFrame(this.animate_core.bind(this));
        // TODO 等待UI刷新
    }
}

export const useEntrantsStore = defineStore("entrants", () => {
    const settings = useSettingsStore();
    const entrants: Entrant[] = reactive([]);
    const displayedEntrants = computed(() => entrants
        .filter(entrant => !entrant.won)
        .sort((a, b) => b.distance - a.distance)
        .slice(0, Math.min(settings.settingsUI.entrantsRendered, entrants.length)));

    const scene = reactive(new Scene(entrants, {
        updateDistance(entrant, deltaTime, deltaForce) {
            entrant.updateForce(deltaForce, Math.pow(settings.settings.kForceFade, deltaTime));
            entrant.move(settings.settings.kResistance, settings.settings.drawIntervalSec);
        },
        getInterval(total, remaining) {
            if (total === remaining) {
                return settings.settings.drawFirstSec;
            } else {
                return settings.settings.drawIntervalSec;
            }
        },
        getTargetCamera(distances) {
            const descentDistances = distances.slice().sort((a, b) => b - a);
            const maxDistance = descentDistances[0];
            const minDistance = descentDistances[Math.min(
                settings.settingsUI.entrantsDisplayed,
                descentDistances.length
            ) - 1];
            const distanceGap = maxDistance - minDistance;
            const upperBound = maxDistance + distanceGap * 0.1;
            const lowerBound = minDistance - distanceGap * 0.1;

            return {
                center: (upperBound + lowerBound) / 2,
                radius: (upperBound - lowerBound) / 2,
            }
        }
    }));

    const winners = computed(() => entrants.filter(entrant => entrant.won).sort((a, b) => a.distance - b.distance)); // FIXME Sort according to time

    watch(() => settings.settings.nameList, nameList => {
        const newEntrants = nameList.map(name => new Entrant(name));
        entrants.splice(0, entrants.length, ...newEntrants);
    }, { immediate: true, deep: true });

    return {
        entrants,
        displayedEntrants,
        scene,
        winners,
    }
});