/**
 * game.js — Main game bootstrap.
 *
 * Creates the Phaser game instance and registers all scenes.
 * Zero build tools - pure ES6 modules loaded from CDN.
 *
 * Pattern from Delphos research: Boot → Menu → Game pipeline.
 */

import { MainMenuScene } from './scenes/MainMenu.js';
import { LevelSelectScene } from './scenes/LevelSelect.js';
import { GamePlayScene } from './scenes/GamePlay.js';
import { GameCompleteScene } from './scenes/GameComplete.js';
import { StateManager } from './systems/StateManager.js';
import { LevelManager } from './systems/LevelManager.js';

/**
 * Create and start the Phaser game.
 * @param {string} containerId - DOM element ID to render into
 */
export function createGame(containerId) {
    // Shared managers (injected into scene registries)
    const stateManager = new StateManager();
    const levelManager = new LevelManager(stateManager);

    // Get config from window or use defaults
    const config = window.PHASER_CONFIG || {
        type: Phaser.AUTO,           // Use WebGL if available, else Canvas
        width: '100%',               // Full window width
        height: '100%',              // Full window height
        parent: containerId,         // DOM container
        backgroundColor: '#0d0d1a',  // Dark dungeon background
        scale: {
            mode: Phaser.Scale.RESIZE,  // Auto-resize to fit viewport
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [
            MainMenuScene,
            LevelSelectScene,
            GamePlayScene,
            GameCompleteScene
        ],
        input: {
            activePointers: [1]    // Single touch for mobile
        },
        physics: {
            default: 'arcade',      // Arcade physics (we use grid-based, but keep for tweens)
            arcade: {
                debug: false
            }
        }
    };

    // Create the Phaser game instance
    const game = new Phaser.Game(config);

    // Attach managers to game registry for scene access
    // Phaser 3.87+ allows custom properties on the game object
    game.stateManager = stateManager;
    game.levelManager = levelManager;

    // Set total levels globally for scene access
    window.TOTAL_LEVELS = levelManager.totalLevels;

    // Inject managers into scene config via Scene.initialize hook
    // We override Scene.create to inject registries
    const originalCreate = Phaser.Scene.prototype.create;
    Phaser.Scene.prototype.create = function (...args) {
        // Pass managers via registry if not already set
        if (!this.registry.get('levelManager')) {
            this.registry.set('levelManager', levelManager);
        }
        if (!this.registry.get('stateManager')) {
            this.registry.set('stateManager', stateManager);
        }

        // Call original create if it exists
        if (originalCreate) {
            originalCreate.call(this, ...args);
        }
    };

    // Log startup
    console.log(`[Game] Started — ${levelManager.totalLevels} chambers loaded`);
    console.log(`[Game] Completed: ${stateManager.completedLevels.length}/${levelManager.totalLevels}`);

    return game;
}

// Allow runtime config override via window.PHASER_CONFIG
// e.g., for debug mode: window.PHASER_CONFIG = { ...config, physics: { ... } }
