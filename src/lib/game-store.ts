'use client';

export interface PlacedObject {
    id: string;
    type: string;
    x: number;
    y: number;
    rotation?: number;
}

export interface PlacedZone {
    id: string;
    type: 'HUB' | 'LAB' | 'LOUNGE' | 'PRODUCTION' | 'OFFICE' | 'REST';
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
}

export interface GameState {
    level: number;
    xp: number;
    maxXp: number;
    gold: number;
    inventoryAlerts: number;
    completedQuests: string[];
    placedObjects: PlacedObject[];
    placedZones: PlacedZone[];
}

const STORAGE_KEY = 'business_rpg_state';

const INITIAL_STATE: GameState = {
    level: 1,
    xp: 0,
    maxXp: 100,
    gold: 500000,
    inventoryAlerts: 3,
    completedQuests: [],
    placedObjects: [
        { id: 'pc-frank', type: 'COMPUTER_SET', x: 25, y: 30 },
        { id: 'pc-alice', type: 'COMPUTER_SET', x: 70, y: 15 },
        { id: 'pc-bob', type: 'COMPUTER_SET', x: 65, y: 27 },
        { id: 'pc-charlie', type: 'COMPUTER_SET', x: 20, y: 75 },
        { id: 'pc-diana', type: 'COMPUTER_SET', x: 32, y: 75 },
        { id: 'pc-eve', type: 'COMPUTER_SET', x: 75, y: 70 },
        { id: 'cabinet-1', type: 'CABINET_STACK', x: 42, y: 15 },
        { id: 'plant-1', type: 'PLANT', x: 5, y: 15 }
    ],
    placedZones: []
};

export function getGameState(): GameState {
    if (typeof window === 'undefined') return INITIAL_STATE;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_STATE;
    try {
        const parsed = JSON.parse(saved);
        // Ensure migration for older save files
        if (!parsed.placedObjects) {
            parsed.placedObjects = INITIAL_STATE.placedObjects;
        }
        if (!parsed.placedZones) {
            parsed.placedZones = INITIAL_STATE.placedZones;
        }
        return parsed;
    } catch (e) {
        return INITIAL_STATE;
    }
}

export function saveGameState(state: GameState): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addXp(amount: number): GameState {
    const state = getGameState();
    let newXp = state.xp + amount;
    let newLevel = state.level;
    let newMaxXp = state.maxXp;

    while (newXp >= newMaxXp) {
        newLevel++;
        newXp -= newMaxXp;
        newMaxXp = Math.floor(newMaxXp * 1.2);
    }

    const newState = { ...state, xp: newXp, level: newLevel, maxXp: newMaxXp };
    saveGameState(newState);
    return newState;
}

export function addGold(amount: number): GameState {
    const state = getGameState();
    const newState = { ...state, gold: state.gold + amount };
    saveGameState(newState);
    return newState;
}

export function placeObject(object: PlacedObject): GameState {
    const state = getGameState();
    const newState = {
        ...state,
        placedObjects: [...state.placedObjects, object]
    };
    saveGameState(newState);
    return newState;
}

export function moveObject(id: string, x: number, y: number): GameState {
    const state = getGameState();
    const newState = {
        ...state,
        placedObjects: state.placedObjects.map(obj =>
            obj.id === id ? { ...obj, x, y } : obj
        )
    };
    saveGameState(newState);
    return newState;
}

export function removeObject(id: string): GameState {
    const state = getGameState();
    const newState = {
        ...state,
        placedObjects: state.placedObjects.filter(obj => obj.id !== id)
    };
    saveGameState(newState);
    return newState;
}

export function placeZone(zone: PlacedZone): GameState {
    const state = getGameState();
    const newState = {
        ...state,
        placedZones: [...state.placedZones, zone]
    };
    saveGameState(newState);
    return newState;
}

export function moveZone(id: string, x: number, y: number): GameState {
    const state = getGameState();
    const newState = {
        ...state,
        placedZones: state.placedZones.map(zone =>
            zone.id === id ? { ...zone, x, y } : zone
        )
    };
    saveGameState(newState);
    return newState;
}

export function resizeZone(id: string, width: number, height: number): GameState {
    const state = getGameState();
    const newState = {
        ...state,
        placedZones: state.placedZones.map(zone =>
            zone.id === id ? { ...zone, width, height } : zone
        )
    };
    saveGameState(newState);
    return newState;
}

export function removeZone(id: string): GameState {
    const state = getGameState();
    const newState = {
        ...state,
        placedZones: state.placedZones.filter(zone => zone.id !== id)
    };
    saveGameState(newState);
    return newState;
}

export function completeQuest(questId: string, xpReward: number, goldReward: number): GameState {
    const state = getGameState();
    if (state.completedQuests.includes(questId)) return state;

    const newState = {
        ...state,
        completedQuests: [...state.completedQuests, questId],
        xp: state.xp + xpReward,
        gold: state.gold + goldReward
    };

    let finalLevel = newState.level;
    let finalXp = newState.xp;
    let finalMaxXp = newState.maxXp;

    while (finalXp >= finalMaxXp) {
        finalLevel++;
        finalXp -= finalMaxXp;
        finalMaxXp = Math.floor(finalMaxXp * 1.2);
    }

    const finalState = { ...newState, level: finalLevel, xp: finalXp, maxXp: finalMaxXp };
    saveGameState(finalState);
    return finalState;
}
