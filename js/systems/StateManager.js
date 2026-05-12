/**
 * StateManager — handles game state, undo history, and localStorage persistence.
 *
 * Patterns (from Delphos research):
 *   - Snapshot-based undo (Feronato pattern)
 *   - localStorage SaveManager with version key
 *   - Immutable copies for history entries
 */

const SAVE_KEY = 'forgotten_crypts_save';
const SAVE_VERSION = 1;

export class StateManager {
    constructor() {
        this.history = [];            // Undo stack of snapshots
        this.currentLevel = 0;        // Current level index
        this.moves = 0;
        this.pushes = 0;
        this.startTime = null;
        this.completedLevels = [];
    this.perLevelStats = [];    // Array of level indices
        this.unlockedLevels = [0];    // Levels the player can access
        this.settings = {
            showDpad: false,
            difficulty: 'normal'
        };
        this._loadFromStorage();
    }

    // ---- Level State ----

    /** Reset state for a new level (called when level starts) */
    resetLevel() {
        this.history = [];
        this.moves = 0;
        this.pushes = 0;
        this.startTime = Date.now();
    }

    /** Save a snapshot before each move for undo */
    snapshot() {
        this.history.push({
            player: { ...this.player },
            boxes: this.boxes.map(b => ({ ...b })),
            moves: this.moves,
            pushes: this.pushes,
            targets: this.targets.map(t => ({ ...t }))
        });
        // Cap undo stack at 500 entries
        if (this.history.length > 500) {
            this.history.shift();
        }
    }

    /** Undo one move. Returns true if successful. */
    undo() {
        if (this.history.length === 0) return false;
        const prev = this.history.pop();
        this.player = { ...prev.player };
        this.boxes = prev.boxes.map(b => ({ ...b }));
        this.targets = prev.targets.map(t => ({ ...t }));
        this.moves = prev.moves;
        this.pushes = prev.pushes;
        return true;
    }

    /** How many undos are available */
    get canUndo() {
        return this.history.length > 0;
    }

    /** How many undos remain */
    get undoDepth() {
        return this.history.length;
    }

    // ---- Stats ----

    get elapsedSeconds() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    get stats() {
        return {
            moves: this.moves,
            pushes: this.pushes,
            elapsed: this.elapsedSeconds,
            level: this.currentLevel,
            levelName: this._currentLevelName || 'Unknown'
        };
    }

    // ---- Progress / Persistence ----

    /** Mark a level as completed */
    completeLevel(levelIndex) {
        if (!this.completedLevels.includes(levelIndex)) {
            this.completedLevels.push(levelIndex);
        }
        // Unlock next level
        const next = levelIndex + 1;
        const totalLevels = window.TOTAL_LEVELS || 10;
        if (next < totalLevels && !this.unlockedLevels.includes(next)) {
            this.unlockedLevels.push(next);
        }
        this._saveToStorage();
    }

    /** Check if a level is completed */
    isLevelCompleted(levelIndex) {
        return this.completedLevels.includes(levelIndex);
    }

    /** Check if a level is unlocked */
    isLevelUnlocked(levelIndex) {
        // Level 0 always unlocked; others unlocked if previous is completed
        if (levelIndex === 0) return true;
        return this.unlockedLevels.includes(levelIndex);
    }

    /** Mark a level as completed (for testing / unlocking all) */
    unlockAll() {
        for (let i = 0; i < (window.TOTAL_LEVELS || 10); i++) {
            this.completeLevel(i);
        }
    }

    // ---- localStorage ----

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.version !== SAVE_VERSION) {
                // Version mismatch — migrate or reset
                console.warn('[StateManager] Save version mismatch, resetting');
                return;
            }
            this.currentLevel = data.currentLevel || 0;
            this.completedLevels = data.completedLevels || [];
            this.unlockedLevels = data.unlockedLevels || [0];
            this.settings = { ...this.settings, ...(data.settings || {}) };
        } catch (e) {
            console.warn('[StateManager] Failed to load save data:', e);
        }
    }

    _saveToStorage() {
        try {
            const data = {
                version: SAVE_VERSION,
                currentLevel: this.currentLevel,
                completedLevels: this.completedLevels,
                unlockedLevels: this.unlockedLevels,
                settings: this.settings
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[StateManager] Failed to save:', e);
        }
    }

    /** Reset all progress */
    resetAllProgress() {
        this.completedLevels = [];
    this.perLevelStats = [];
        this.unlockedLevels = [0];
        this._saveToStorage();
    }
}


StateManager.prototype.updateLevelStats = function(levelIndex, moves, pushes, time) {
    while (this.perLevelStats.length <= levelIndex) {
        this.perLevelStats.push({ moves: 0, pushes: 0, time: 0 });
    }
    this.perLevelStats[levelIndex] = { moves: moves, pushes: pushes, time: time };
};

StateManager.prototype.collectAllStats = function() {
    var stats = this.perLevelStats;
    var totalMoves = 0, totalTime = 0, completed = 0;
    var levels = [];
    for (var i = 0; i < stats.length; i++) {
        if (stats[i] && stats[i].completed) {
            completed++;
            totalMoves += stats[i].moves;
            totalTime += stats[i].time;
        }
        if (stats[i]) {
            levels.push({
                level: i + 1,
                moves: stats[i].moves || 0,
                pushes: stats[i].pushes || 0,
                time: stats[i].time || 0,
                completed: (stats[i].completed || false)
            });
        }
    }
    return {
        totalMoves: totalMoves,
        totalTime: totalTime,
        completedLevels: completed,
        totalLevels: stats.length,
        percentage: stats.length > 0 ? Math.round((completed / stats.length) * 100) : 0,
        avgMovesPerLevel: completed > 0 ? Math.round(totalMoves / completed) : 0,
        levels: levels
    };
};
