/**
 * GamePlayScene — Core Sokoban gameplay scene.
 *
 * Handles:
 *   - Grid rendering with Phaser sprites
 *   - Player movement (WASD + arrows + touch swipe + D-pad)
 *   - Box pushing with Sokoban rules (push-only, one box at a time)
 *   - Target detection (box on target = solved)
 *   - Win condition check
 *   - Undo system (full history, unlimited)
 *   - Move counter & timer
 *   - Level complete transition
 *
 * Design patterns from Delphos research:
 *   - Feronato's 2D array approach with sprite mapping
 *   - Tween-based smooth movement
 *   - Input locking during animations
 */

import { InputManager } from '../systems/InputManager.js';
import { StateManager } from '../systems/StateManager.js';
import { LevelManager } from '../systems/LevelManager.js';

// Tile type constants
const TILE = {
    EMPTY: 0,
    WALL: 1,
    FLOOR: 2,
    TARGET: 4,
    BOX: 8,
    BOX_ON_TARGET: 12,  // BOX | TARGET
    PLAYER: 16,
    PLAYER_ON_TARGET: 20 // PLAYER | TARGET
};

const isWall = (t) => (t & TILE.WALL) !== 0;
const isFloor = (t) => (t & (TILE.FLOOR | TILE.TARGET)) !== 0;
const isBox = (t) => (t & TILE.BOX) !== 0;
const isTarget = (t) => (t & TILE.TARGET) !== 0;
const isPlayer = (t) => (t & TILE.PLAYER) !== 0;
const isWalkable = (t) => !isWall(t);

export class GamePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GamePlay' });
    }

    init(data) {
        this.levelIndex = data.levelIndex || 0;
        this.levelManager = this.game.levelManager;
        this.stateManager = this.game.stateManager;

        // Load the level
        const levelDef = this.levelManager.loadLevel(this.levelIndex);
        if (!levelDef) {
            console.error('Failed to load level', this.levelIndex);
            this.scene.start('LevelSelect');
            return;
        }

        this.levelData = levelDef;
        this.stateManager._currentLevelName = levelDef.name;
        this.stateManager.currentLevel = this.levelIndex;
        this.stateManager.resetLevel();
        this.stateManager.player = { ...levelDef.player };
        this.stateManager.boxes = levelDef.boxes.map(b => ({ ...b }));
        this.stateManager.targets = levelDef.targets.map(t => ({ ...t }));

        // Build the tile grid
        this.buildGrid(levelDef);

        // Dimensions
        this.tileSize = 0;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;

        // UI elements (created after scale ready)
        this.uiContainer = null;
        this.moveText = null;
        this.pushText = null;
        this.timerText = null;
        this.levelNameText = null;
        this.storyText = null;
    }

    /** Build the tile grid from the level definition */
    buildGrid(levelDef) {
        this.grid = [];
        for (let y = 0; y < levelDef.rows; y++) {
            const row = [];
            for (let x = 0; x < levelDef.cols; x++) {
                const ch = y < levelDef.grid.length && x < levelDef.grid[y].length
                    ? levelDef.grid[y][x] : '.';

                let tile = TILE.FLOOR;

                switch (ch) {
                    case '#':
                        tile = TILE.WALL;
                        break;
                    case '.':
                        tile = TILE.FLOOR;
                        break;
                    case 'o':
                        tile = TILE.TARGET;
                        break;
                    case '@':
                        tile = TILE.PLAYER;
                        break;
                    case '+':
                        tile = TILE.PLAYER_ON_TARGET;
                        break;
                    case '$':
                        tile = TILE.BOX;
                        break;
                    case '*':
                        tile = TILE.BOX_ON_TARGET;
                        break;
                    default:
                        tile = TILE.EMPTY; // void or unknown
                }
                row.push(tile);
            }
            this.grid.push(row);
        }
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#0d0d1a');

        // Calculate tile size to fit on screen with padding
        const padding = 60; // UI padding
        const hudHeight = 60;
        const storyHeight = 50;
        const availW = width - padding * 2;
        const availH = height - hudHeight - storyHeight - padding * 2;
        const cols = this.levelData.cols;
        const rows = this.levelData.rows;
        this.tileSize = Math.floor(Math.min(availW / cols, availH / rows));

        // Center the grid
        const gridPixelW = cols * this.tileSize;
        const gridPixelH = rows * this.tileSize;
        this.gridOffsetX = (width - gridPixelW) / 2;
        this.gridOffsetY = hudHeight + (availH - gridPixelH) / 2;

        // ---- Render the grid ----
        this.createTilemap();

        // ---- Player sprite ----
        this.createPlayer();

        // ---- Box sprites ----
        this.createBoxes();

        // ---- HUD ----
        this.createHUD();

        // ---- Input ----
        this.inputManager = new InputManager(this, {
            move: (dir) => this.handleMove(dir),
            undo: () => this.handleUndo(),
            restart: () => this.restartLevel(),
            menu: () => this.showMenu()
        });

        // Detect mobile and show D-Pad
        if (this.sys.game.device.input.touch) {
            this.inputManager.setDpadVisible(true);
        }

        // ---- Story text ----
        if (this.levelData.story) {
            this.storyText = this.add.text(width / 2, height - 20, this.levelData.story, {
                fontSize: '13px',
                fontFamily: 'Courier New, monospace',
                color: '#555',
                word: { width: width - 40 }
            }).setOrigin(0.5);
        }

        // ---- Flash hint briefly ----
        if (this.levelData.hint) {
            const hintText = this.add.text(width / 2, this.gridOffsetY - 10, this.levelData.hint, {
                fontSize: '11px',
                fontFamily: 'Courier New, monospace',
                color: '#888'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: hintText,
                alpha: 0,
                duration: 3000,
                delay: 2000,
                ease: 'Power1'
            });
        }
    }

    /** Create the tilemap layer with procedural graphics (no external assets needed) */
    createTilemap() {
        // Use Graphics objects for procedural tile rendering
        // Cache the graphics for reuse
        if (!this.sys.game.textures.exists('tiles')) {
            this.generateTileTextures();
        }

        const textures = this.textures;

        for (let y = 0; y < this.levelData.rows; y++) {
            for (let x = 0; x < this.levelData.cols; x++) {
                const tile = this.grid[y][x];
                const px = this.gridOffsetX + x * this.tileSize;
                const py = this.gridOffsetY + y * this.tileSize;

                if (isWall(tile)) {
                    this.add.image(px + this.tileSize / 2, py + this.tileSize / 2, 'tile_wall')
                        .setDisplaySize(this.tileSize, this.tileSize);
                } else {
                    // Floor or target
                    const hasTarget = isTarget(tile);
                    const img = this.add.image(px + this.tileSize / 2, py + this.tileSize / 2,
                        hasTarget ? 'tile_target' : 'tile_floor');
                    img.setDisplaySize(this.tileSize, this.tileSize);

                    // Draw crosshair for targets
                    if (hasTarget) {
                        const g = this.add.graphics();
                        const cx = px + this.tileSize / 2;
                        const cy = py + this.tileSize / 2;
                        const s = this.tileSize * 0.15;
                        g.lineStyle(1, 0x886633, 0.6);
                        g.lineBetween(cx - s, cy, cx + s, cy);
                        g.lineBetween(cx, cy - s, cx, cy + s);
                        g.lineBetween(cx - s, cy - s, cx + s, cy + s);
                        g.lineBetween(cx + s, cy - s, cx - s, cy + s);
                        g.setDepth(-1);
                    }
                }
            }
        }
    }

    /** Generate procedural tile textures using Phaser Graphics */
    generateTileTextures() {
        const createTile = (key, drawFn) => {
            const g = this.make.graphics({ add: false });
            g.fillStyle(0x000000, 1);
            g.fillRect(0, 0, this.tileSize, this.tileSize);
            drawFn(g);
            g.generateTexture(key, this.tileSize, this.tileSize);
            g.destroy();
        };

        // Wall tile - dark stone
        createTile('tile_wall', (g) => {
            const ts = this.tileSize;
            g.fillStyle(0x2a2a35, 1);
            g.fillRect(0, 0, ts, ts);
            g.lineStyle(1, 0x3a3a45, 1);
            g.strokeRect(0, 0, ts, ts);
            // Stone pattern lines
            g.lineStyle(1, 0x333340, 0.4);
            g.lineBetween(0, ts * 0.5, ts, ts * 0.5);
            g.lineBetween(ts * 0.5, 0, ts * 0.5, ts * 0.5);
            g.lineBetween(ts * 0.25, ts * 0.5, ts * 0.25, ts);
        });

        // Floor tile - cobble
        createTile('tile_floor', (g) => {
            const ts = this.tileSize;
            g.fillStyle(0x1a1a24, 1);
            g.fillRect(0, 0, ts, ts);
            g.lineStyle(1, 0x252530, 0.5);
            g.strokeRect(1, 1, ts - 2, ts - 2);
        });

        // Target tile - floor + glow
        createTile('tile_target', (g) => {
            const ts = this.tileSize;
            g.fillStyle(0x1a1a24, 1);
            g.fillRect(0, 0, ts, ts);
            g.lineStyle(1, 0x252530, 0.5);
            g.strokeRect(1, 1, ts - 2, ts - 2);
            // Glow circle
            g.lineStyle(2, 0x665522, 0.5);
            g.fillCircle(ts / 2, ts / 2, ts * 0.25);
            g.lineStyle(1, 0x665522, 0.3);
            g.strokeCircle(ts / 2, ts / 2, ts * 0.25);
        });
    }

    /** Create the player sprite (knight represented by a circle) */
    createPlayer() {
        this.playerSprite = this.add.circle(
            this.gridOffsetX + this.stateManager.player.x * this.tileSize + this.tileSize / 2,
            this.gridOffsetY + this.stateManager.player.y * this.tileSize + this.tileSize / 2,
            this.tileSize * 0.3,
            0x4488cc
        );
        this.playerSprite.setStrokeStyle(2, 0x88aadd);
        this.playerSprite.setDepth(10);
    }

    /** Create box sprites */
    createBoxes() {
        this.boxSprites = [];
        this.stateManager.boxes.forEach((box, i) => {
            const px = this.gridOffsetX + box.x * this.tileSize + this.tileSize / 2;
            const py = this.gridOffsetY + box.y * this.tileSize + this.tileSize / 2;
            const onTarget = this.isOnTarget(box, i);

            const sprite = this.add.rectangle(
                px, py,
                this.tileSize * 0.7, this.tileSize * 0.7,
                onTarget ? 0x886622 : 0x664422
            );
            sprite.setStrokeStyle(2, onTarget ? 0xaa8833 : 0x886644);
            sprite.setDepth(5);
            sprite.setData('boxIndex', i);

            // Draw an 'X' on boxes to make them look like crates
            const g = this.add.graphics();
            g.lineStyle(1, 0x443311, 0.6);
            g.lineBetween(px - this.tileSize * 0.2, py - this.tileSize * 0.2,
                         px + this.tileSize * 0.2, py + this.tileSize * 0.2);
            g.lineBetween(px + this.tileSize * 0.2, py - this.tileSize * 0.2,
                         px - this.tileSize * 0.2, py + this.tileSize * 0.2);
            g.setDepth(6);

            this.boxSprites.push(sprite);
        });
    }

    /** Check if a box is on a target */
    isOnTarget(box, boxIndex) {
        return this.stateManager.targets.some(t => t.x === box.x && t.y === box.y);
    }

    /** Update box sprite positions and colors */
    updateBoxSprites() {
        this.stateManager.boxes.forEach((box, i) => {
            const sprite = this.boxSprites[i];
            if (!sprite) return;

            const targetPx = this.gridOffsetX + box.x * this.tileSize + this.tileSize / 2;
            const targetPy = this.gridOffsetY + box.y * this.tileSize + this.tileSize / 2;
            const onTarget = this.isOnTarget(box, i);

            sprite.x = targetPx;
            sprite.y = targetPy;
            sprite.setFillStyle(onTarget ? 0x886622 : 0x664422);
            sprite.setStrokeStyle(2, onTarget ? 0xddaa44 : 0x886644);
        });
    }

    /** Create the HUD overlay */
    createHUD() {
        const { width } = this.scale;

        this.uiContainer = this.add.container(0, 0);

        // Background bar
        const bg = this.add.rectangle(0, 30, width, 60, 0x0d0d1a, 0.9)
            .setOrigin(0, 0.5).setDepth(100);

        this.levelNameText = this.add.text(15, 18, `Chamber ${this.levelIndex + 1}: ${this.levelData.name}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#d4a840'
        }).setDepth(101);

        this.moveText = this.add.text(width - 15, 10, `Moves: ${this.stateManager.moves}`, {
            fontSize: '13px',
            fontFamily: 'Courier New, monospace',
            color: '#a89060'
        }).setDepth(101).setOrigin(1, 0);

        this.pushText = this.add.text(width - 15, 28, `Pushes: ${this.stateManager.pushes}`, {
            fontSize: '13px',
            fontFamily: 'Courier New, monospace',
            color: '#a89060'
        }).setDepth(101).setOrigin(1, 0);

        this.timerText = this.add.text(15, 36, `Time: 0:00`, {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666'
        }).setDepth(101);

        // Back button
        const backBtn = this.add.text(15, 18, '← MENU', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666',
            backgroundColor: '#1a1a2e',
            padding: { x: 8, y: 4 }
        }).setDepth(101).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#aaa'));
        backBtn.on('pointerout', () => backBtn.setColor('#666'));
        backBtn.on('pointerdown', () => this.showMenu());

        // Undo button (mobile-friendly)
        const undoBtn = this.add.text(width - 80, 18, '↶ UNDO', {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#888',
            backgroundColor: '#1a1a2e',
            padding: { x: 8, y: 4 }
        }).setDepth(101).setInteractive({ useHandCursor: true });

        undoBtn.on('pointerdown', () => this.handleUndo());

        // Restart button
        const restartBtn = this.add.text(width - 170, 18, '↻ RESTART', {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#888',
            backgroundColor: '#1a1a2e',
            padding: { x: 8, y: 4 }
        }).setDepth(101).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => this.restartLevel());
    }

    /** Update HUD text elements */
    updateHUD() {
        if (this.moveText) {
            this.moveText.setText(`Moves: ${this.stateManager.moves}`);
        }
        if (this.pushText) {
            this.pushText.setText(`Pushes: ${this.stateManager.pushes}`);
        }
        if (this.timerText) {
            const s = this.stateManager.elapsedSeconds;
            const m = Math.floor(s / 60);
            const sec = s % 60;
            this.timerText.setText(`Time: ${m}:${sec.toString().padStart(2, '0')}`);
        }
    }

    /** Handle a move command (up/down/left/right) */
    handleMove(direction) {
        if (this.inputManager.busy) return;

        const dirs = {
            up:    { dx: 0, dy: -1 },
            down:  { dx: 0, dy: 1 },
            left:  { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };

        const dir = dirs[direction];
        if (!dir) return;

        const player = this.stateManager.player;
        const targetX = player.x + dir.dx;
        const targetY = player.y + dir.dy;

        // Check bounds and walls
        if (targetX < 0 || targetX >= this.levelData.cols ||
            targetY < 0 || targetY >= this.levelData.rows) {
            return; // Out of bounds
        }

        const targetTile = this.grid[targetY][targetX];
        if (isWall(targetTile)) {
            return; // Wall
        }

        // Check if there's a box at the target position
        const boxIndex = this.stateManager.boxes.findIndex(
            b => b.x === targetX && b.y === targetY
        );

        if (boxIndex !== -1) {
            // There's a box - check if we can push it
            const box = this.stateManager.boxes[boxIndex];
            const behindX = box.x + dir.dx;
            const behindY = box.y + dir.dy;

            // Check bounds and wall behind box
            if (behindX < 0 || behindX >= this.levelData.cols ||
                behindY < 0 || behindY >= this.levelData.rows) {
                return; // Out of bounds
            }
            if (isWall(this.grid[behindY][behindX])) {
                return; // Wall behind box
            }

            // Check if there's another box behind
            const anotherBox = this.stateManager.boxes.findIndex(
                b => b.x === behindX && b.y === behindY && b !== box
            );
            if (anotherBox !== -1) {
                return; // Another box blocks
            }

            // Valid push - save snapshot before moving
            this.stateManager.snapshot();
            this.stateManager.pushes++;

            // Move box
            box.x = behindX;
            box.y = behindY;

            // Update target occupation
            this.stateManager.boxes.forEach(b => {
                b.onTarget = this.isOnTarget(b, this.stateManager.boxes.indexOf(b));
            });

            // Move player into box's old position
            const prevX = player.x;
            const prevY = player.y;
            player.x = targetX;
            player.y = targetY;

            this.stateManager.moves++;

            // Animate both box and player
            // Lock input for the entire box push sequence
            this.inputManager.lock((unlock) => {
                this.animateMove(player, prevX, prevY, dir.dx, dir.dy, () => {
                    // Animate box after player starts moving
                    this.animateBoxMove(box, targetX, targetY, dir.dx, dir.dy, () => {
                        unlock(); // Unlock only when box animation completes
                        this.checkWin();
                    });
                }, true); // true = skipLocking flag
            });

        } else {
            // Simple move - no box involved
            this.stateManager.snapshot();

            // Move player
            const prevX = player.x;
            const prevY = player.y;
            player.x = targetX;
            player.y = targetY;

            this.stateManager.moves++;

            this.animateMove(player, prevX, prevY, dir.dx, dir.dy, () => {
                this.checkWin();
            });
        }

        this.updateHUD();
    }

    /** Smooth tween animation for player movement */
    animateMove(player, prevX, prevY, dx, dy, onComplete, skipLocking = false) {
        const targetPx = this.gridOffsetX + player.x * this.tileSize + this.tileSize / 2;
        const targetPy = this.gridOffsetY + player.y * this.tileSize + this.tileSize / 2;
        const prevPx = this.gridOffsetX + prevX * this.tileSize + this.tileSize / 2;
        const prevPy = this.gridOffsetY + prevY * this.tileSize + this.tileSize / 2;

        this.playerSprite.x = prevPx;
        this.playerSprite.y = prevPy;

        if (skipLocking) {
            // Don't manage locking - caller handles it
            this.tweens.add({
                targets: this.playerSprite,
                x: targetPx,
                y: targetPy,
                duration: 100,
                ease: 'Power1',
                onComplete: () => {
                    if (onComplete) onComplete();
                }
            });
        } else {
            // Normal behavior: manage locking
            this.inputManager.lock((unlock) => {
                this.tweens.add({
                    targets: this.playerSprite,
                    x: targetPx,
                    y: targetPy,
                    duration: 100,
                    ease: 'Power1',
                    onComplete: () => {
                        unlock();
                        if (onComplete) onComplete();
                    }
                });
            });
        }
    }

    /** Smooth tween animation for box movement */
    animateBoxMove(box, prevX, prevY, dx, dy, onComplete) {
        const targetPx = this.gridOffsetX + box.x * this.tileSize + this.tileSize / 2;
        const targetPy = this.gridOffsetY + box.y * this.tileSize + this.tileSize / 2;
        const prevPx = this.gridOffsetX + prevX * this.tileSize + this.tileSize / 2;
        const prevPy = this.gridOffsetY + prevY * this.tileSize + this.tileSize / 2;

        const sprite = this.boxSprites[this.stateManager.boxes.indexOf(box)];
        if (!sprite) {
            if (onComplete) onComplete();
            return;
        }

        sprite.x = prevPx;
        sprite.y = prevPy;

        this.tweens.add({
            targets: sprite,
            x: targetPx,
            y: targetPy,
            duration: 100,
            ease: 'Power1',
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });

        this.updateBoxSprites();
    }

    /** Handle undo command */
    handleUndo() {
        if (!this.stateManager.canUndo) return;

        // Restore state from snapshot
        this.stateManager.undo();

        // Sync player position
        this.stateManager.player = { ...this.stateManager.player };

        // Sync box positions
        this.updateBoxSprites();

        // Sync target states
        this.stateManager.targets.forEach(t => {
            const boxOnTarget = this.stateManager.boxes.some(b =>
                b.x === t.x && b.y === t.y
            );
            t.occupied = boxOnTarget;
        });

        // Update player sprite position
        const playerPx = this.gridOffsetX + this.stateManager.player.x * this.tileSize + this.tileSize / 2;
        const playerPy = this.gridOffsetY + this.stateManager.player.y * this.tileSize + this.tileSize / 2;
        this.playerSprite.x = playerPx;
        this.playerSprite.y = playerPy;

        this.updateHUD();
    }

    /** Restart the current level */
    restartLevel() {
        this.scene.start('GamePlay', { levelIndex: this.levelIndex });
    }

    /** Show the main menu */
    showMenu() {
        this.inputManager.destroy();
        this.scene.start('MainMenu');
    }

    /** Check if all targets are covered by boxes */
    checkWin() {
        const allCovered = this.stateManager.targets.every(t => {
            return this.stateManager.boxes.some(b => b.x === t.x && b.y === t.y);
        });

        if (allCovered) {
            this.levelComplete();
        }
    }

    /** Handle level completion */
    levelComplete() {
        // Mark as completed
        this.stateManager.completeLevel(this.levelIndex);

        // Stop input
        this.inputManager.unlock();

        // Show level complete message
        const { width, height } = this.scale;

        const overlay = this.add.container(width / 2, height / 2).setDepth(200);
        const bg = this.add.rectangle(0, 0, width * 0.8, height * 0.6, 0x0d0d1a, 0.95);
        overlay.add(bg);

        const title = this.add.text(0, -height * 0.15, 'CHAMBER CLEARED!', {
            fontSize: '28px',
            fontFamily: 'Courier New, monospace',
            color: '#d4a840'
        }).setOrigin(0.5);
        overlay.add(title);

        const stats = [
            `Moves: ${this.stateManager.moves}`,
            `Pushes: ${this.stateManager.pushes}`,
            `Time: ${this.formatTime(this.stateManager.elapsedSeconds)}`,
            this.stateManager.moves <= this.levelData.minMoves
                ? `★ Optimal solution! ★`
                : `Min moves: ${this.levelData.minMoves}`
        ].join('\n');

        const statsText = this.add.text(0, 0, stats, {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#a89060',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);
        overlay.add(statsText);

        // Next level button
        const nextIdx = this.levelIndex + 1;
        const hasNext = nextIdx < this.levelData.metadata.totalLevels;

        if (hasNext) {
            const nextBtn = this.add.text(0, height * 0.1, '[ NEXT CHAMBER ]', {
                fontSize: '18px',
                fontFamily: 'Courier New, monospace',
                color: '#e0d8c0',
                backgroundColor: '#2a2a4a',
                padding: { x: 15, y: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            nextBtn.on('pointerover', () => nextBtn.setScale(1.05));
            nextBtn.on('pointerout', () => nextBtn.setScale(1));
            nextBtn.on('pointerdown', () => {
                overlay.destroy();
                this.scene.start('GamePlay', { levelIndex: nextIdx });
            });

            overlay.add(nextBtn);
        }

        // Level select button
        const lsBtn = this.add.text(0, height * 0.2, '[ LEVEL SELECT ]', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#888',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        lsBtn.on('pointerdown', () => {
            overlay.destroy();
            this.scene.start('LevelSelect');
        });

        overlay.add(lsBtn);

        // Flash effect - use a temporary overlay instead of camera fade
        const flash = this.add.rectangle(0, 0, width, height, 0xd4a840, 0)
            .setOrigin(0).setDepth(199);

        this.tweens.add({
            targets: flash,
            alpha: 0.3,
            duration: 200,
            yoyo: true
        });

        // Check if this was the last level
        if (nextIdx >= window.TOTAL_LEVELS) {
            // All levels complete!
            const allStats = this.collectAllStats();
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 400,
                delay: 600,
                onComplete: () => {
                    this.scene.start('GameComplete', { stats: allStats });
                }
            });
        }
    }

    /** Collect stats from all completed levels */
    collectAllStats() {
        // In a full implementation, we'd track per-level stats.
        // For now, return the current level's stats.
        const s = this.stateManager.stats;
        return {
            totalMoves: s.moves,
            totalPushes: s.pushes,
            totalTime: s.elapsed
        };
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    shutdown() {
        // Cleanup
        if (this.inputManager) {
            this.inputManager.destroy();
        }
    }

    destroy() {
        this.shutdown();
    }
}
