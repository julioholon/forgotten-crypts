/**
 * LevelManager — handles level loading, progression, and transitions.
 */

import { LEVEL_DATA, parseLevel } from '../data/levels.js';

export class LevelManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.rawLevels = LEVEL_DATA.levels;
        this.parsedLevels = [];
        this.currentLevelIndex = 0;
        this.totalLevels = this.rawLevels.length;

        // Pre-parse all levels
        for (const raw of this.rawLevels) {
            this.parsedLevels.push(parseLevel(raw));
        }

        window.TOTAL_LEVELS = this.totalLevels;
    }

    /** Get all level metadata for the level select screen */
    getAllLevels() {
        return this.rawLevels.map((raw, i) => ({
            ...raw,
            completed: this.stateManager.isLevelCompleted(i),
            unlocked: this.stateManager.isLevelUnlocked(i)
        }));
    }

    /** Get the current parsed level */
    getCurrentLevel() {
        return this.parsedLevels[this.currentLevelIndex] || null;
    }

    /** Load a specific level by index */
    loadLevel(index) {
        if (index < 0 || index >= this.parsedLevels.length) return null;
        if (!this.stateManager.isLevelUnlocked(index)) return null;
        this.currentLevelIndex = index;
        return this.parsedLevels[index];
    }

    /** Advance to the next level. Returns the level or null if done. */
    nextLevel() {
        const next = this.currentLevelIndex + 1;
        if (next >= this.parsedLevels.length) return null; // game complete
        this.stateManager.currentLevel = next;
        return this.parsedLevels[next];
    }

    /** Get level index from level id */
    indexById(id) {
        return this.rawLevels.findIndex(l => l.id === id);
    }
}
