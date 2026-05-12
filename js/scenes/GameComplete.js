/**
 * GameCompleteScene — Victory screen after completing all levels.
 * Shows final stats and option to restart or go to level select.
 */

export class GameCompleteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameComplete' });
    }

    create(data) {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#0d0d1a');

        // Victory particles
        this.add.rectangle(0, 0, width, height, 0x1a1a00).setOrigin(0);

        // Title
        this.add.text(width / 2, height * 0.2, '🏆', {
            fontSize: '64px'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.35, 'DUNGEON CLEARED!', {
            fontSize: '32px',
            fontFamily: 'Courier New, monospace',
            color: '#d4a840'
        }).setOrigin(0.5);

        const stats = data?.stats || {};

        // Stats panel
        const panelX = width / 2;
        const panelY = height * 0.5;

        const statsText = [
            `Total Moves:  ${stats.totalMoves || 0}`,
            `Total Pushes: ${stats.totalPushes || 0}`,
            `Total Time:   ${this.formatTime(stats.totalTime || 0)}`,
            ``,
            `All ${window.TOTAL_LEVELS || 10} chambers conquered!`,
            `The Forgotten Crypts are yours.`
        ].join('\n');

        this.add.text(panelX, panelY, statsText, {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#a89060',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Buttons
        const btnY = height * 0.75;
        const btnW = 200;

        const menuBtn = this.createButton(width / 2 - btnW / 2 - 10, btnY, '[ MAIN MENU ]', () => {
            this.scene.start('MainMenu');
        });

        const restartBtn = this.createButton(width / 2 + btnW / 2 + 10, btnY, '[ PLAY AGAIN ]', () => {
            this.scene.start('LevelSelect');
        });
    }

    createButton(x, y, text, callback) {
        const btnText = this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#e0d8c0',
            backgroundColor: '#2a2a4a',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnText.on('pointerover', () => {
            btnText.setScale(1.05);
            btnText.setBackgroundColor('#3a3a5a');
        });
        btnText.on('pointerout', () => {
            btnText.setScale(1);
            btnText.setBackgroundColor('#2a2a4a');
        });
        btnText.on('pointerdown', callback);

        return btnText;
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}
