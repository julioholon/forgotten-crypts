/**
 * InputManager — unified keyboard + touch/swipe input.
 *
 * Patterns (from Delphos research):
 *   - Keyboard event delegation with action mapping
 *   - Touch swipe detection with minimum distance threshold
 *   - D-Pad buttons for mobile
 */

export class InputManager {
    /**
     * @param {Phaser.Scene} scene - The Phaser scene instance
     * @param {object} callbacks - Action callbacks
     */
    constructor(scene, callbacks) {
        this.scene = scene;
        this.callbacks = callbacks || {};
        this.busy = false;        // Lock input during animations
        this.touchStart = null;
        this.minSwipeDistance = 30; // px minimum for swipe detection

        // Direction mapping
        this.directions = {
            up:    { dx:  0, dy: -1 },
            down:  { dx:  0, dy:  1 },
            left:  { dx: -1, dy:  0 },
            right: { dx:  1, dy:  0 }
        };

        this.setupKeyboard();
        this.setupSwipe();
        this.createDpad();
    }

    // ---- Keyboard ----

    setupKeyboard() {
        const keys = this.scene.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.UP,
            down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
            left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            w:     Phaser.Input.Keyboard.KeyCodes.W,
            s:     Phaser.Input.Keyboard.KeyCodes.S,
            a:     Phaser.Input.Keyboard.KeyCodes.A,
            d:     Phaser.Input.Keyboard.KeyCodes.D,
            z:     Phaser.Input.Keyboard.KeyCodes.Z,
            r:     Phaser.Input.Keyboard.KeyCodes.R,
            u:     Phaser.Input.Keyboard.KeyCodes.U
        });

        this.scene.input.keyboard.on('keydown', (event) => {
            if (this.busy) return;

            switch (event.code) {
                case 'ArrowUp':    case 'KeyW': this.fire('move', 'up'); break;
                case 'ArrowDown':  case 'KeyS': this.fire('move', 'down'); break;
                case 'ArrowLeft':  case 'KeyA': this.fire('move', 'left'); break;
                case 'ArrowRight': case 'KeyD': this.fire('move', 'right'); break;
                case 'KeyZ':       case 'KeyU': this.fire('undo'); break;
                case 'KeyR':       this.fire('restart'); break;
            }
        });
    }

    // ---- Touch Swipe ----

    setupSwipe() {
        const scene = this.scene;

        scene.input.on('pointerdown', (pointer) => {
            this.touchStart = { x: pointer.x, y: pointer.y };
        });

        scene.input.on('pointerup', (pointer) => {
            if (!this.touchStart) return;

            const dx = pointer.x - this.touchStart.x;
            const dy = pointer.y - this.touchStart.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.minSwipeDistance) return;

            // Determine primary axis
            let direction;
            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }
            this.fire('move', direction);
            this.touchStart = null;
        });
    }

    // ---- D-Pad (HTML overlay buttons) ----

    createDpad() {
        // D-Pad is created as HTML overlay elements; we bind
        // Phaser.input.on('gameobjectdown') for touch-friendly buttons.
        // This method creates the DOM elements if they don't exist.
        const existing = document.getElementById('dpad-container');
        if (existing) return; // already created

        const dpad = document.createElement('div');
        dpad.id = 'dpad-container';
        dpad.className = 'dpad';

        const buttons = [
            { cls: 'dpad-up',    label: '▲', action: 'move', dir: 'up' },
            { cls: 'dpad-down',  label: '▼', action: 'move', dir: 'down' },
            { cls: 'dpad-left',  label: '◀', action: 'move', dir: 'left' },
            { cls: 'dpad-right', label: '▶', action: 'move', dir: 'right' },
            { cls: 'dpad-undo',  label: '↶', action: 'undo', dir: null },
            { cls: 'dpad-restart', label: '↻', action: 'restart', dir: null }
        ];

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = `dpad-btn ${b.cls}`;
            btn.textContent = b.label;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (b.action === 'move') {
                    this.fire('move', b.dir);
                } else {
                    this.fire(b.action);
                }
            }, { passive: false });
            // Also handle mouse for desktop testing
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (b.action === 'move') {
                    this.fire('move', b.dir);
                } else {
                    this.fire(b.action);
                }
            });
            dpad.appendChild(btn);
        });

        document.body.appendChild(dpad);
    }

    /** Show/hide the D-Pad overlay */
    setDpadVisible(visible) {
        const dpad = document.getElementById('dpad-container');
        if (dpad) {
            dpad.classList.toggle('dpad-visible', visible);
        }
    }

    // ---- Input Locking ----

    /** Lock input during animation, unlock after callback */
    lock(callback) {
        this.busy = true;
        if (callback) {
            callback(() => { this.busy = false; });
        }
    }

    /** Force-unlock input (safety) */
    unlock() {
        this.busy = false;
    }

    // ---- Event Dispatch ----

    fire(action, data) {
        const handler = this.callbacks[action];
        if (handler) handler(data);
    }

    /** Cleanup */
    destroy() {
        this.scene.input.keyboard.removeAllListeners();
        const dpad = document.getElementById('dpad-container');
        if (dpad) dpad.remove();
    }
}
