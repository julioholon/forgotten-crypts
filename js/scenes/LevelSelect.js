/**
 * LevelSelectScene — Level browser with progress indicators.
 * Shows completed levels with green borders, locked levels faded out.
 */

export class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelect' });
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#0d0d1a');

        // Title
        this.add.text(width / 2, 50, 'SELECT CHAMBER', {
            fontSize: '28px',
            fontFamily: 'Courier New, monospace',
            color: '#d4a840'
        }).setOrigin(0.5);

        // Back button
        const backBtn = this.add.text(20, 20, '← BACK', {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#888',
            backgroundColor: '#1a1a2e',
            padding: { x: 12, y: 6 }
        }).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ccc'));
        backBtn.on('pointerout', () => backBtn.setColor('#888'));
        backBtn.on('pointerdown', () => this.scene.start('MainMenu'));

        // Get level data from shared managers on the game instance
        const levelManager = this.game.levelManager;
        const stateManager = this.game.stateManager;
        const allLevels = levelManager.getAllLevels();

        // Calculate grid layout
        const cols = Math.min(4, Math.floor(width / 120));
        const btnWidth = Math.min(100, (width - 40) / cols - 10);
        const btnHeight = btnWidth;
        const gridWidth = cols * (btnWidth + 10) - 10;
        const startX = (width - gridWidth) / 2;
        const startY = 90;

        // Create level buttons
        allLevels.forEach((level, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (btnWidth + 10) + btnWidth / 2;
            const y = startY + row * (btnHeight + 15) + btnHeight / 2;

            const isCompleted = stateManager.isLevelCompleted(i);
            const isUnlocked = stateManager.isLevelUnlocked(i);
            const btnText = isCompleted ? `✦ ${i + 1}` : `${i + 1}`;

            const btn = this.add.text(x, y, btnText, {
                fontSize: `${btnWidth * 0.35}px`,
                fontFamily: 'Courier New, monospace',
                color: isCompleted ? '#4a8' : (isUnlocked ? '#a89060' : '#333')
            }).setOrigin(0.5);

            const bg = this.add.rectangle(x, y, btnWidth, btnHeight, 
                isCompleted ? 0x1a2a1a : (isUnlocked ? 0x1a1a2e : 0x111122)
            ).setOrigin(0.5).setStrokeStyle(2, 
                isCompleted ? 0x4a8a4a : (isUnlocked ? 0x2a2a4a : 0x222222)
            );

            const nameText = this.add.text(x, y + btnHeight * 0.35, level.name || 'Chamber ' + (i + 1), {
                fontSize: `${Math.max(9, btnWidth * 0.12)}px`,
                fontFamily: 'Courier New, monospace',
                color: isUnlocked ? '#666' : '#333'
            }).setOrigin(0.5);

            const group = this.add.container(x, y);
            group.add([bg, btn, nameText]);
            group.setSize(btnWidth, btnHeight + 20);

            if (isUnlocked) {
                group.setInteractive({ useHandCursor: true });
                group.on('pointerover', () => {
                    bg.setFillStyle(isCompleted ? 0x2a3a2a : 0x2a2a4a);
                });
                group.on('pointerout', () => {
                    bg.setFillStyle(isCompleted ? 0x1a2a1a : 0x1a1a2e);
                });
                group.on('pointerdown', () => {
                    const level = levelManager.loadLevel(i);
                    if (level) {
                        this.scene.start('GamePlay', { levelIndex: i });
                    }
                });
            }
        });

        // Difficulty legend
        const legendY = startY + Math.ceil(allLevels.length / cols) * (btnHeight + 15) + 30;
        this.add.text(width / 2, legendY, 'Completed: ✦    Locked: grayed out', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#444'
        }).setOrigin(0.5);
    }
}
