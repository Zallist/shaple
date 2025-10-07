import { createSignal, createMemo, Accessor, Setter, batch } from "solid-js";
import * as prand from 'pure-rand';
import { createStore, SetStoreFunction } from "solid-js/store";
import { numberToString } from "../utils/seed";
import getAllValidWords from "./words";
import GameState from "../utils/game-state";

export class DroptionaryState {
    public storedMoves: { from: { row: number, column: number }, to: { row: number, column: number } }[];
    constructor() {
        this.storedMoves = [];
    }
}

// Letter values based on Scrabble scoring
export const LETTER_VALUES: Record<string, number> = {
    'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1, 'L': 1, 'N': 1, 'S': 1, 'T': 1, 'R': 1,
    'D': 2, 'G': 2,
    'B': 3, 'C': 3, 'M': 3, 'P': 3,
    'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
    'K': 5,
    'J': 8, 'X': 8,
    'Q': 10, 'Z': 10
}

export type CELL_MODIFIER = '2x word' | '3x word' | '4x word' | '5x word' | 
                            '2x letter' | '3x letter' | '4x letter' | '5x letter' | 
                            '+1' | '+2' | '+5' | '+10' |
                            'none';

let VALID_WORDS: Set<string> = new Set();

class CONSTANTS {
    static LETTER_WEIGHTS: Record<string, number> = { // Rounded hard so we get the lower numbers too
        A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2,
        I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2,
        Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1,
        Y: 2, Z: 1
    };

    static MODIFIER_WEIGHTS: Record<CELL_MODIFIER, number> = {
        '5x word': 0.5,
        '4x word': 2,
        '3x word': 6,
        '2x word': 14,
        '5x letter': 4,
        '4x letter': 9,
        '3x letter': 18,
        '2x letter': 32,
        '+10': 4,
        '+5': 9,
        '+2': 18,
        '+1': 32,
        // slightly higher chance of nothing than something
        'none': 200
    };

    static LETTERS = Object.keys(CONSTANTS.LETTER_WEIGHTS);
    static VOWELS = ['A','E','I','O','U'];
    static CONSONANTS = CONSTANTS.LETTERS.filter(l => !CONSTANTS.VOWELS.includes(l));

    static MODIFIERS = Object.keys(CONSTANTS.MODIFIER_WEIGHTS) as CELL_MODIFIER[];

    static VOWEL_TOTAL = CONSTANTS.VOWELS.reduce((acc, l) => acc + CONSTANTS.LETTER_WEIGHTS[l], 0);
    static CONSONANT_TOTAL = CONSTANTS.CONSONANTS.reduce((acc, l) => acc + CONSTANTS.LETTER_WEIGHTS[l], 0);

    static VOWEL_PROBS = CONSTANTS.VOWELS.map(v => CONSTANTS.LETTER_WEIGHTS[v] / CONSTANTS.VOWEL_TOTAL);
    static CONSONANT_PROBS = CONSTANTS.CONSONANTS.map(c => CONSTANTS.LETTER_WEIGHTS[c] / CONSTANTS.CONSONANT_TOTAL);

    static MODIFIER_TOTAL = CONSTANTS.MODIFIERS.reduce((acc, w) => acc + CONSTANTS.MODIFIER_WEIGHTS[w], 0);
    static MODIFIER_PROBS = CONSTANTS.MODIFIERS.map(w => CONSTANTS.MODIFIER_WEIGHTS[w] / CONSTANTS.MODIFIER_TOTAL);

    static generateFloat64(rng: prand.RandomGenerator) {
        const g1 = prand.unsafeUniformIntDistribution(0, (1 << 26) - 1, rng);
        const g2 = prand.unsafeUniformIntDistribution(0, (1 << 27) - 1, rng);
        const value = (g1 * Math.pow(2, 27) + g2) * Math.pow(2, -53);
        return value;
    }

    static pickLetterFromGroup(from: 'vowel' | 'consonant', rng: prand.RandomGenerator): string {
        const group = from === 'vowel' ? CONSTANTS.VOWELS : CONSTANTS.CONSONANTS;
        const probs = from === 'vowel' ? CONSTANTS.VOWEL_PROBS : CONSTANTS.CONSONANT_PROBS;
        const p = CONSTANTS.generateFloat64(rng);
    
        let acc = 0;
    
        for (let i = 0; i < group.length; i++) {
            acc += probs[i];
            if (p <= acc) return group[i];
        }
    
        return 'A';
    }

    static pickModifier(rng: prand.RandomGenerator): CELL_MODIFIER {
        const p = CONSTANTS.generateFloat64(rng);
        let acc = 0;
        for (let i = 0; i < CONSTANTS.MODIFIERS.length; i++) {
            acc += CONSTANTS.MODIFIER_PROBS[i];
            if (p <= acc) return CONSTANTS.MODIFIERS[i];
        }
        return 'none';
    }
};

let cell_id_count: number = 0;

export type Cell = {
    readonly id: number;
    readonly createdTurn: number | null;
    row: number;
    column: number;
    letter: string;
    isMatched: boolean;
    modifier: CELL_MODIFIER;
};

export type FoundWord = {
    word: string;
    score: number;
    chain: number;
    chainBonus: number;
    manuallyFound: boolean;
    coords: { row: number, column: number }[];
};

export class Game {
    private rng: prand.RandomGenerator = {} as prand.RandomGenerator;
    private seed: number = 0;
    private initialized: boolean = false;
    private gameState: GameState<DroptionaryState> = {} as GameState<DroptionaryState>;

    public readonly cells: Cell[];
    private readonly setCells: SetStoreFunction<Cell[]>;

    public readonly movesRemaining: Accessor<number>;
    private readonly setMovesRemaining: Setter<number>;

    public readonly isProcessing: Accessor<boolean>;
    private readonly setIsProcessing: Setter<boolean>;

    public readonly score: Accessor<number>;
    private readonly setScore: Setter<number>;

    public readonly foundWords: Accessor<FoundWord[]>;
    private readonly setFoundWords: Setter<FoundWord[]>;

    public readonly cellsAsGrid: Accessor<Record<number, Record<number, (Cell | null)>>>;
    public readonly isDone: Accessor<boolean>;

    public readonly lastMoveCausedMatches: Accessor<boolean>;
    private readonly setLastMoveCausedMatches: Setter<boolean>;

    public getGameState(): GameState<DroptionaryState> { return this.gameState; }

    constructor(public readonly rowCount: number = 8,
                public readonly colCount: number = 8,
                public readonly initialMoveCount: number = 25,
                public readonly chainMultiplier: number = 1.5) {
    
        [this.cells, this.setCells] = createStore<Cell[]>([]);

        [this.movesRemaining, this.setMovesRemaining] = createSignal(initialMoveCount);
        [this.isProcessing, this.setIsProcessing] = createSignal(false);
        [this.score, this.setScore] = createSignal(0);
        [this.foundWords, this.setFoundWords] = createSignal<FoundWord[]>([]);
        [this.lastMoveCausedMatches, this.setLastMoveCausedMatches] = createSignal(false);

        this.cellsAsGrid = createMemo(() => this.convertCellsToGrid(this.cells));
        this.isDone = createMemo(() => this.movesRemaining() <= 0);
    }

    public async initialize(seed: number) {
        this.initialized = false;
        this.seed = seed;
        this.gameState = GameState.Get(seed, 'droptionary', DroptionaryState);

        if (VALID_WORDS.size === 0) {
            const wordList = await getAllValidWords();
            VALID_WORDS = new Set(wordList.filter(w => w.length >= 4).map(w => w.toUpperCase()));
        }

        this.rng = prand.xoroshiro128plus(seed);

        this.setMovesRemaining(this.initialMoveCount);
        this.setCells([]);
        this.setIsProcessing(false);
        this.setScore(0);
        this.setFoundWords([]);
        this.setLastMoveCausedMatches(false);

        await this.setupGrid();

        this.initialized = true;
    }

    public getSeedString(): string {
        return numberToString(this.seed);
    }

    public async playStoredMoves() {
        if (!this.gameState.getData() || this.gameState.getData().storedMoves.length === 0) {
            try {
                // see if we can load it from old data
                const storedMoves = JSON.parse(localStorage.getItem(`droptionary_moves_${this.seed}`) || '[]');
                if (storedMoves && storedMoves.length > 0)
                    this.gameState.updateData((data) => {
                        data.storedMoves = storedMoves;
                    });
            }
            catch (ex) {
                console.error('Failed to load stored moves:', ex);
            }
        }

        const storedMoves = this.gameState.getData().storedMoves || [];
        
        if (storedMoves.length > 0) {
            for (const move of storedMoves) {
                const cellGrid = this.cellsAsGrid();
                const fromCell = cellGrid[move.from.row]?.[move.from.column];
                const toCell = cellGrid[move.to.row]?.[move.to.column];
                
                if (!fromCell || !toCell) {
                    alert('Invalid move stored: no cell found');
                    return;
                }

                await this.moveCell(fromCell, toCell, true);
            }
        }
    }

    private recordMove(from: Cell, to: Cell) {
        this.gameState.startGame();
        this.gameState.updateData((data) => {
            data.storedMoves.push({ from: { row: from.row, column: from.column }, to: { row: to.row, column: to.column } });
        });
    }

    public canUndo() {
        return !this.lastMoveCausedMatches() &&
            !this.isProcessing() &&
            this.gameState.getData().storedMoves && 
            this.gameState.getData().storedMoves.length > 0;
    };

    public async undoLastMove(): Promise<boolean> {
        if (!this.canUndo()) return false;

        // Remove the last move
        this.gameState.updateData((data) => {
            data.storedMoves.pop();
        });

        await this.initialize(this.seed);
        await this.playStoredMoves();

        return true;
    }

    public isWord(word: string): boolean {
        return VALID_WORDS.has(word.toUpperCase());
    }

    private createCell(row: number, column: number): Cell {
        prand.unsafeSkipN(this.rng, Math.abs(row) * this.colCount + Math.abs(column));

        const pickVowel = CONSTANTS.generateFloat64(this.rng) < 0.45; // 45% chance vowel
        const letter = CONSTANTS.pickLetterFromGroup(pickVowel ? 'vowel' : 'consonant', this.rng);
        const modifier = CONSTANTS.pickModifier(this.rng);

        return {
            id: cell_id_count++,
            row,
            column,
            letter,
            createdTurn: this.initialized ? this.movesRemaining() : null,
            isMatched: false,
            modifier: modifier
        };
    };
    
    private async setupGrid() {
        let grid: Cell[] = [];

        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.colCount; c++) {
                grid.push(this.createCell(r, c));
            }
        }

        this.setCells(grid);
        await this.processMatches(true);
    }

    private convertCellsToGrid(cells: Cell[]): Record<number, Record<number, (Cell | null)>> {
        const grid: Record<number, Record<number, (Cell | null)>> = {};

        for (let r = 0; r < this.rowCount; r++) { // fill with nulls
            grid[r] = {};
            for (let c = 0; c < this.colCount; c++) {
                grid[r][c] = null;
            }
        }

        for (const cell of cells) {
            const row = cell.row;
            const col = cell.column;

            if (!grid[row]) // In case the row is negative or something
                grid[row] = {};

            grid[row][col] = cell;
        }

        return grid;
    }

    public findLineMatches(minLength: number = 1) {
        const grid = this.cellsAsGrid();
        const matches: Cell[][] = [];
    
        const directions = [
            { dr: 0, dc: 1 },    // right
            { dr: 1, dc: 0 },    // down
            { dr: 1, dc: 1 },    // down-right
            { dr: 1, dc: -1 },   // down-left
            { dr: -1, dc: 1 },   // up-right
            { dr: -1, dc: -1 },  // up-left
            { dr: -1, dc: 0 },   // up
            { dr: 0, dc: -1 }    // left
        ];
    
        for (const { dr, dc } of directions) {
            for (let r = 0; r < this.rowCount; r++) {
                for (let c = 0; c < this.colCount; c++) {
                    let cells: Cell[] = [];
                    let word = '';
    
                    let curR = r;
                    let curC = c;
    
                    while (curR >= 0 && curR < this.rowCount && curC >= 0 && curC < this.colCount) {
                        const cell = grid[curR][curC];
                        const letter = cell?.letter;
                        if (!letter) break;
    
                        cells.push(cell);
                        word += letter;
    
                        if (word.length >= minLength && this.isWord(word)) {
                            matches.push([...cells]);
                        }
    
                        curR += dr;
                        curC += dc;
                    }
                }
            }
        }
        return matches;
    }
    

    public async processMatches(instant: boolean = false): Promise<number> {
        let matchCount = 0;
        let chainCount = 0;
        this.setIsProcessing(true);

        while (true) {
            const matches = this.findLineMatches(this.initialized ? (chainCount >= 1 ? 4 : 5) : 1);
            
            if (matches.length === 0) 
                break;

            matchCount += matches.length;

            // Step 0 : Add score
            if (this.initialized) {
                batch(() => {
                    for (const match of matches) {
                        const manuallyFound = !match.every(c => c.createdTurn === this.movesRemaining());
                        const modifiers: CELL_MODIFIER[] = [];

                        let wordScore = 0;
                        let word = '';
                        
                        // Calculate base score from letter values, including modifiers
                        for (const cell of match) {
                            const letter = cell.letter;
                            let letterScore = LETTER_VALUES[letter] || 0;

                            if (manuallyFound) {
                                modifiers.push(cell.modifier);

                                switch (cell.modifier) {
                                    case '+1': letterScore += 1; break;
                                    case '+2': letterScore += 2; break;
                                    case '+5': letterScore += 5; break;
                                    case '+10': letterScore += 10; break;
                                    case '2x letter': letterScore *= 2; break;
                                    case '3x letter': letterScore *= 3; break;
                                    case '4x letter': letterScore *= 4; break;
                                    case '5x letter': letterScore *= 5; break;
                                }
                            }

                            word += letter;
                            wordScore += letterScore;
                        }

                        // And now any word bonuses
                        for (const modifier of modifiers) {
                            switch (modifier) {
                                case '2x word': wordScore *= 2; break;
                                case '3x word': wordScore *= 3; break;
                                case '4x word': wordScore *= 4; break;
                                case '5x word': wordScore *= 5; break;
                            }
                        }

                        let chainBonus: number = 1;

                        if (manuallyFound) {
                            chainBonus = chainCount >= 1 ? (chainCount * 0.5) + 1 : 1;
                            wordScore = Math.round(wordScore * chainBonus);
                        }
                        else {
                            // Word score is irrelevant, we just award the number of the chain
                            wordScore = Math.min(chainCount, wordScore);
                        }
                        
                        this.setScore(s => s + wordScore);
                        
                        this.setFoundWords(prev => [
                            ...prev,
                            { 
                                word: word, 
                                score: wordScore, 
                                chain: chainCount, 
                                chainBonus: chainBonus, 
                                manuallyFound: manuallyFound,
                                coords: match.map(c => ({ row: c.row, column: c.column })) 
                            }
                        ]);
                    }
                });
            }

            
            // Step 1 : Mark all words as matched AND spawn new cells in the negative rows
            const matchedCoords: Set<[r: number, c: number]> = new Set();

            for (const match of matches) {
                for (const cell of match) {
                    this.setCells(c => c.id === cell.id, { isMatched: true });
                    matchedCoords.add([cell.row, cell.column]);
                }
            }

            // For each column, count the number of matched cells
            const addPerColumn: number[] = Array(this.colCount).fill(0);
            for (const [r, c] of matchedCoords) {
                addPerColumn[c]++;
            }

            // Spawn new cells in the negative rows
            const newCells: Cell[] = [];
            for (let c = 0; c < addPerColumn.length; c++) {
                for (let r = -1; r >= -addPerColumn[c]; r--) {
                    newCells.push(this.createCell(r, c));
                }
            }
            this.setCells([...this.cells, ...newCells]);

            // And wait for animations
            if (!instant) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Step 2 : Remove matched cells and cause all cells above to collapse
            this.setCells(this.cells.filter(cell => !cell.isMatched));

            let currentCellGrid = this.convertCellsToGrid(this.cells);
            for (let c = 0; c < this.colCount; c++) {
                for (let r = this.rowCount - 1; r >= 0; r--) {
                    // If this cell is empty, then we need to find the first NON EMPTY cell above it and move EVERY cell equal or above that down by that distance
                    if (currentCellGrid[r][c] === null) {
                        let firstNonEmptyRow = r - 1;
                        while (currentCellGrid[firstNonEmptyRow][c] === null) {
                            firstNonEmptyRow--;
                        }
                        if (!currentCellGrid[firstNonEmptyRow][c]) {
                            console.error('No cell found at', firstNonEmptyRow, c);
                            continue;
                        }
                        
                        const distance = r - firstNonEmptyRow;
                        for (let i = r; i >= 0 || (currentCellGrid[i - distance] && currentCellGrid[i - distance]?.[c] !== undefined); i--) {
                            const cell = currentCellGrid[i - distance][c];

                            if (cell)
                                this.setCells(c => c.id === cell.id, { row: i });
                            
                            currentCellGrid[i][c] = cell;
                            currentCellGrid[i - distance][c] = null;
                        }
                    }
                }
            }

            // And wait for animations
            if (!instant) {
                await new Promise(resolve => setTimeout(resolve, 240));
            }

            chainCount++;
        }

        this.setIsProcessing(false);

        return matchCount;
    }

    public isAdjacent(a: Cell, b: Cell): boolean {
        const dr = Math.abs(a.row - b.row);
        const dc = Math.abs(a.column - b.column);
        return (dr === 1 && dc === 0) || (dr === 0 && dc === 1) || (dr === 1 && dc === 1);
    }

    public async moveCell(a: Cell, b: Cell, loadingState: boolean = false): Promise<boolean> {
        if (this.isProcessing()) return false;
        if (this.movesRemaining() <= 0) return false;
        if (!this.isAdjacent(a, b)) return false;
        
        // Swap cells
        batch(() => {
            const [aRow, aCol] = [a.row, a.column];
            const [bRow, bCol] = [b.row, b.column];
            
            this.setCells(c => c.id === a.id, { row: bRow, column: bCol });
            this.setCells(c => c.id === b.id, { row: aRow, column: aCol });
        });

        // And wait for animations
        if (!loadingState) {
            await new Promise(resolve => setTimeout(resolve, 240));
            this.recordMove(a, b);
        }

        const matchCount = await this.processMatches(loadingState);

        this.setLastMoveCausedMatches(matchCount > 0);
        this.setMovesRemaining(c => c - 1);

        if (this.movesRemaining() <= 0)
            this.gameState.endGame();

        return true;
    }
};