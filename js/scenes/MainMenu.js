/**
 * MainMenuScene — Title screen with start button, level select, controls info.
 * 
 * Pattern: Phaser scene with DOM-based buttons and Phaser text/buttons.
 * Delphos research recommends Boot -> Menu -> Game pattern.
 */

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {
        const { width, height } = this.scale;

        // Dark dungeon background
        this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0);

        // Title with glow effect
        this.add.text(width / 2, height * 0.25, 'FORGOTTEN', {
            fontSize: `${Math.min(width * 0.08, 48)}px`,
            fontFamily: 'Courier New, monospace',
            color: '#d4a840'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.33, 'CRYPTS', {
            fontSize: `${Math.min(width * 0.12, 72)}px`,
            fontFamily: 'Courier New, monospace',
            color: '#a89060'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height * 0.42, 'A Medieval Sokoban Puzzle', {
            fontSize: `${Math.min(width * 0.03, 18)}px`,
            fontFamily: 'Courier New, monospace',
            color: '#666'
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.text(width / 2, height * 0.55, '[ START GAME ]', {
            fontSize: `${Math.min(width * 0.045, 24)}px`,
            fontFamily: 'Courier New, monospace',
            color: '#e0d8c0',
            backgroundColor: '#2a2a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => {
            startBtn.setScale(1.05);
            startBtn.setBackgroundColor('#3a3a5a');
        });
        startBtn.on('pointerout', () => {
            startBtn.setScale(1);
            startBtn.setBackgroundColor('#2a2a4a');
        });
        startBtn.on('pointerdown', () => {
            this.scene.start('LevelSelect');
        });

        // Controls info
        const controlsText = [
            'CONTROLS:',
            'WASD / Arrows — Move',
            'Z / U         — Undo',
            'R             — Restart',
            'Swipe on mobile',
            '',
            'Push treasure chests onto altars'
        ].join('\n');

        this.add.text(width / 2, height * 0.72, controlsText, {
            fontSize: `${Math.min(width * 0.025, 14)}px`,
            fontFamily: 'Courier New, monospace',
            color: '#555',
            align: 'center'
        }).setOrigin(0.5);

        // Credits
        this.add.text(width / 2, height * 0.92, 'Built with Phaser 3 — Zero build tools', {
            fontSize: `${Math.min(width * 0.02, 12)}px`,
            fontFamily: 'Courier New, monospace',
            color: '#333'
        }).setOrigin(0.5);
    }
}
