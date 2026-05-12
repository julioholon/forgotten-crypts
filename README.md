# Forgotten Crypts — Medieval Sokoban

A dark-themed Sokoban puzzle game built with [Phaser 3](https://phaser.io/). Explore 10 progressively harder dungeon crypts, pushing treasure chests onto ancient altars to unlock the way forward.

> **Author:** Athena Architecture
> **Live Demo:** [julioholon.github.io/forgotten-crypts](https://julioholon.github.io/forgotten-crypts)

---

## 🖼️ Screenshots

*Game runs directly in your browser — no installation required.*

| Main Menu | Gameplay | Level Complete |
|:--:|:--:|:--:|
| *Screenshot placeholder* | *Screenshot placeholder* | *Screenshot placeholder* |

---

## ▶️ How to Play

### Option 1 — Open Directly
Simply open `index.html` in any modern browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

### Option 2 — Local Static Server
For CORS-safe loading (recommended):

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```

Then visit **http://localhost:8000** in your browser.

---

## 🎮 Controls

| Action | Keys |
|:--|:--|
| Move | `↑` `↓` `←` `→` or `W` `A` `S` `D` |
| Push chest | Walk into it (automatically pushes if the space beyond is free) |
| Undo / Reset | Via on-screen buttons |

---

## ✨ Features

- **10 handcrafted Sokoban puzzles** — from introductory tutorials to expert-level finales
- **Level progression system** — complete a level to unlock the next; your progress persists via `localStorage`
- **Move & time tracking** — per-level statistics with optimal move targets
- **Rich UI** — Main Menu, Level Select (with lock/unlock), Game Over, and Game Complete screens
- **Dark medieval aesthetic** — atmospheric dungeon visuals with thematic sprites (stone walls, treasure chests, altar pedestals)
- **Story-driven levels** — each crypt includes narrative flavor text and hints
- **Mobile responsive** — viewport-locked layout that works on phones and tablets (touch controls via UI buttons)
- **Balanced puzzles** — every level has box ✕ target parity verified (equal number of chests and altars)

---

## 🗺️ Level Overview

| # | Level | Difficulty | Min Moves |
|:--|:--|:--:|:--:|
| 1 | The Awakening | ★ | 2 |
| 2 | First Steps | ★ | 3 |
| 3 | The Narrow Corridor | ★★ | 4 |
| 4 | The Twin Chambers | ★★ | 10 |
| 5 | The Antechamber | ★★★ | 15 |
| 6 | The Spiral Descent | ★★★ | 11 |
| 7 | The Guardian's Test | ★★★★ | 16 |
| 8 | The Crucible | ★★★★ | 20 |
| 9 | The Master's Chamber | ★★★★★ | 24 |
| 10 | The Forgotten Vault | ★★★★★ | 28 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:--|:--|
| Game engine | [Phaser 3.87](https://phaser.io/) (via CDN) |
| Language | Vanilla JavaScript, ES6 modules |
| Styling | Custom CSS with responsive design |
| State management | `StateManager.js` (moves, time, level, stats) |
| Level data | `levels.js` — JSON-embedded Sokoban maps |

### Project Structure

```
├── index.html          # Entry point
├── styles.css          # UI styling
└── js/
    ├── game.js         # Game bootstrap & Phaser config
    ├── scenes/         # Phaser scenes
    │   ├── MainMenu.js
    │   ├── LevelSelect.js
    │   ├── GamePlay.js
    │   └── GameComplete.js
    ├── systems/        # Core systems
    │   ├── StateManager.js
    │   ├── LevelManager.js
    │   └── InputManager.js
    └── data/
        └── levels.js   # Level definitions & metadata
```

---

## 📜 License

This project is released under the [MIT License](LICENSE). See the `LICENSE` file for details.

---

## 🙏 Credits

- **Game Engine:** [Phaser](https://phaser.io/) — HTML5 game framework
- **Sprite assets:** Kenney.nl, OpenGameArt (or custom — update as needed)
- **CDN:** jsDelivr for Phaser 3.87 delivery

---

*Built with Phaser 3 and vanilla JS — no build step, no dependencies to install. Just open and play.*
