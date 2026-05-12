
function parseLevel(rawLevel) {
    var grid = rawLevel.grid;
    var rows = grid.length;
    var cols = grid[0].length;
    var gridArray = [];
    var player = null;
    var boxes = [];
    var targets = [];
    for (var y = 0; y < rows; y++) {
        var rowChars = [];
        var row = grid[y];
        for (var x = 0; x < cols; x++) {
            var ch = (x < row.length) ? row[x] : '#';
            rowChars.push(ch);
            if (ch === '@') {
                player = { x: x, y: y };
            } else if (ch === '$') {
                boxes.push({ x: x, y: y, onTarget: false });
            } else if (ch === 'o') {
                targets.push({ x: x, y: y, occupied: false });
            } else if (ch === '*') {
                boxes.push({ x: x, y: y, onTarget: true });
                targets.push({ x: x, y: y, occupied: true });
            } else if (ch === '+') {
                player = { x: x, y: y };
                targets.push({ x: x, y: y, occupied: false });
            }
        }
        gridArray.push(rowChars);
    }
    return {
        id: rawLevel.id,
        name: rawLevel.name,
        difficulty: rawLevel.difficulty,
        minMoves: rawLevel.minMoves,
        rows: rows,
        cols: cols,
        grid: gridArray,
        player: player,
        boxes: boxes,
        targets: targets,
        hint: (rawLevel.metadata && rawLevel.metadata.hint) || '',
        story: (rawLevel.metadata && rawLevel.metadata.story) || '',
        metadata: {
            totalLevels: LEVEL_DATA.levels.length,
            tags: (rawLevel.metadata && rawLevel.metadata.tags) || []
        }
    };
}

export const LEVEL_DATA = {
    "formatVersion": "1.0",
    "metadata": {
        "title": "The Forgotten Crypts",
        "author": "Athena Architecture",
        "description": "A progressive set of Sokoban puzzles in the depths of an ancient dungeon",
        "totalLevels": 10
    },
    "legend": {
        "#": {
            "type": "wall",
            "sprite": "stone_wall"
        },
        ".": {
            "type": "floor",
            "sprite": "stone_floor"
        },
        "@": {
            "type": "player_start",
            "sprite": "knight"
        },
        "$": {
            "type": "box",
            "sprite": "treasure_chest"
        },
        "*": {
            "type": "box_on_target",
            "sprite": "treasure_chest_placed"
        },
        "o": {
            "type": "target",
            "sprite": "altar_pedestal"
        },
        "+": {
            "type": "player_on_target",
            "sprite": "knight_on_altar"
        },
        "~": {
            "type": "void",
            "sprite": "darkness"
        }
    },
    "levels": [
        {
            "id": "crypt_01",
            "name": "The Awakening",
            "difficulty": 1,
            "minMoves": 2,
            "grid": [
                "#####",
                "#@..#",
                "#.$.#",
                "#.o.#",
                "#####"
            ],
            "metadata": {
                "tags": [
                    "tutorial",
                    "intro"
                ],
                "hint": "Move right, then push the chest down onto the altar",
                "story": "You awaken in a sealed chamber. A single treasure chest blocks your path."
            }
        },
        {
            "id": "crypt_02",
            "name": "First Steps",
            "difficulty": 1,
            "minMoves": 3,
            "grid": [
                "######",
                "#@...#",
                "#.$.o#",
                "#....#",
                "#....#",
                "######"
            ],
            "metadata": {
                "tags": [
                    "tutorial",
                    "movement"
                ],
                "hint": "Navigate around and push the chest from the left",
                "story": "The chamber opens. Ancient magic still courses through these stones."
            }
        },
        {
            "id": "crypt_03",
            "name": "The Narrow Corridor",
            "difficulty": 2,
            "minMoves": 4,
            "grid": [
                "#######",
                "#@....#",
                "#.#$#.#",
                "#.....#",
                "#.#o#.#",
                "#.....#",
                "#######"
            ],
            "metadata": {
                "tags": [
                    "beginner",
                    "navigation"
                ],
                "hint": "Go around the pillars to reach the correct pushing position",
                "story": "Crumbling pillars create a maze-like passage. Think before you push."
            }
        },
        {
            "id": "crypt_04",
            "name": "The Twin Chambers",
            "difficulty": 2,
            "minMoves": 10,
            "grid": [
                "########",
                "#......#",
                "#.$$...#",
                "#.oo...#",
                "#......#",
                "#....@.#",
                "########"
            ],
            "metadata": {
                "tags": [
                    "beginner",
                    "multiple_boxes"
                ],
                "hint": "Handle one chest at a time. Order matters!",
                "story": "Twin altars await their offerings. The ancients valued symmetry."
            }
        },
        {
            "id": "crypt_05",
            "name": "The Antechamber",
            "difficulty": 3,
            "minMoves": 15,
            "grid": [
                "#########",
                "#.......#",
                "#.......#",
                "#..$....#",
                "#..o....#",
                "#.......#",
                "#...@...#",
                "#.......#",
                "#########"
            ],
            "metadata": {
                "tags": [
                    "intermediate",
                    "strategy"
                ],
                "hint": "Move one chest away from the altar first to create space",
                "story": "The antechamber tests your patience. Not all obvious moves lead to victory."
            }
        },
        {
            "id": "crypt_06",
            "name": "The Spiral Descent",
            "difficulty": 3,
            "minMoves": 11,
            "grid": [
                "##########",
                "#........#",
                "#.######.#",
                "#.#....#.#",
                "#.#.$$.#.#",
                "#.#.oo.#.#",
                "#.#....#.#",
                "#.#....#.#",
                "#.@......#",
                "##########"
            ],
            "metadata": {
                "tags": [
                    "intermediate",
                    "spiral",
                    "planning"
                ],
                "hint": "Work from the outside in. The spiral creates natural order.",
                "story": "A spiral staircase descends into darkness. Each level holds its own challenge."
            }
        },
        {
            "id": "crypt_07",
            "name": "The Guardian's Test",
            "difficulty": 4,
            "minMoves": 16,
            "grid": [
                "##########",
                "#........#",
                "#.######.#",
                "#.#.o..$.#",
                "#.#.o$...#",
                "#....#.#.#",
                "#..###.#.#",
                "#...@..#.#",
                "#......#.#",
                "##########"
            ],
            "metadata": {
                "tags": [
                    "advanced",
                    "corridors"
                ],
                "hint": "Push crates carefully around obstacles",
                "story": "The guardian awaits, testing your worth."
            }
        },
        {
            "id": "crypt_08",
            "name": "The Crucible",
            "difficulty": 4,
            "minMoves": 20,
            "grid": [
                "##########",
                "#........#",
                "#.######.#",
                "#.#.o.$$.#",
                "#.#..$...#",
                "#.#.oo...#",
                "#.#......#",
                "#.########",
                "#...@....#",
                "##########"
            ],
            "metadata": {
                "tags": [
                    "advanced",
                    "multi-box"
                ],
                "hint": "Plan pushes carefully - corners trap boxes",
                "story": "The crucible fires await."
            }
        },
        {
            "id": "crypt_09",
            "name": "The Master's Chamber",
            "difficulty": 5,
            "minMoves": 24,
            "grid": [
                "##########",
                "#........#",
                "#.######.#",
                "#.#..$$$.#",
                "#.#.ooo..#",
                "#.#......#",
                "#.########",
                "#...@....#",
                "#........#",
                "##########"
            ],
            "metadata": {
                "tags": [
                    "expert",
                    "maze"
                ],
                "hint": "Three crates, three pedestals",
                "story": "The master's final test."
            }
        },
        {
            "id": "crypt_10",
            "name": "The Forgotten Vault",
            "difficulty": 5,
            "minMoves": 28,
            "grid": [
                "##########",
                "#........#",
                "#.######.#",
                "#.#.o...o#",
                "#.#..$$$.#",
                "#.#..o...#",
                "#.#......#",
                "#.########",
                "#...@....#",
                "##########"
            ],
            "metadata": {
                "tags": [
                    "expert",
                    "finale"
                ],
                "hint": "The deepest vault - precision matters",
                "story": "The deepest secrets of the dungeon."
            }
        }
    ]
};
export { parseLevel };
