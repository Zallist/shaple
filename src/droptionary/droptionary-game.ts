import { createSignal, createMemo, Accessor, Setter, batch } from "solid-js";
import * as prand from 'pure-rand';
import { createStore, SetStoreFunction } from "solid-js/store";
import { loadGameState, numberToString, saveGameState } from "../utils/seed";
import getAllValidWords from "./words";

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
  
export const LETTER_FREQUENCIES: Record<string, number> = { // Rounded hard so we get the lower numbers too
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2,
    I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2,
    Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1,
    Y: 2, Z: 1
};

let VALID_WORDS: Set<string> = new Set();

const LETTERS = Object.keys(LETTER_FREQUENCIES);
const VOWELS = ['A','E','I','O','U'];
const CONSONANTS = LETTERS.filter(l => !VOWELS.includes(l));

const VOWEL_PROBS = VOWELS.map(v => LETTER_FREQUENCIES[v] / VOWELS.reduce((acc, l) => acc + LETTER_FREQUENCIES[l], 0));
const CONSONANT_PROBS = CONSONANTS.map(c => LETTER_FREQUENCIES[c] / CONSONANTS.reduce((acc, l) => acc + LETTER_FREQUENCIES[l], 0));

function generateFloat64(rng: prand.RandomGenerator) {
    const g1 = prand.unsafeUniformIntDistribution(0, (1 << 26) - 1, rng);
    const g2 = prand.unsafeUniformIntDistribution(0, (1 << 27) - 1, rng);
    const value = (g1 * Math.pow(2, 27) + g2) * Math.pow(2, -53);
    return value;
}

function pickLetterFromGroup(from: 'vowel' | 'consonant', rng: prand.RandomGenerator): string {
    const group = from === 'vowel' ? VOWELS : CONSONANTS;
    const probs = from === 'vowel' ? VOWEL_PROBS : CONSONANT_PROBS;
    const p = generateFloat64(rng);

    let acc = 0;

    for (let i = 0; i < group.length; i++) {
        acc += probs[i];
        if (p <= acc) return group[i];
    }

    return group[group.length - 1];
}

let cell_id_count: number = 0;

export type Cell = {
    readonly id: number;
    readonly createdTurn: number | null;
    row: number;
    column: number;
    letter: string;
    isMatched: boolean;
};

export type FoundWord = {
    word: string;
    score: number;
    chain: number;
    chainBonus: number;
    manuallyFound: boolean;
    coords: { row: number, column: number }[];
};

function createCell(row: number, column: number, letter: string, createdTurn: number | null): Cell {
    return {
        id: cell_id_count++,
        row,
        column,
        letter,
        createdTurn,
        isMatched: false
    };
};

export class Game {
    private rng: prand.RandomGenerator = {} as prand.RandomGenerator;
    private seed: number = 0;
    private initialized: boolean = false;

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

    private storedMoves: { from: { row: number, column: number }, to: { row: number, column: number } }[] = [];

    public async loadState() {
        const storedMoves = loadGameState<{ from: { row: number, column: number }, to: { row: number, column: number } }[]>('droptionary_moves', this.seed);

        if (storedMoves && storedMoves.length > 0) {
            this.storedMoves = storedMoves;
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
        this.storedMoves.push({ from: { row: from.row, column: from.column }, to: { row: to.row, column: to.column } });
        saveGameState('droptionary_moves', this.seed, this.storedMoves);
    }

    public canUndo() {
        return this.storedMoves.length > 0 && 
            !this.isProcessing() &&
            !this.lastMoveCausedMatches();
    };

    public async undoLastMove(): Promise<boolean> {
        if (!this.canUndo()) return false;

        // Remove the last move
        this.storedMoves.pop();
        saveGameState('droptionary_moves', this.seed, this.storedMoves);

        await this.initialize(this.seed);
        await this.loadState();

        return true;
    }

    public isWord(word: string): boolean {
        return VALID_WORDS.has(word.toUpperCase());
    }

    public calculateWordScore(word: string): number {
        let score = 0;
        
        // Calculate base score from letter values
        for (const letter of word) {
            const letterScore = LETTER_VALUES[letter] || 1;
            score += letterScore;
        }
        
        return score
    }

    private getRandomLetter(row: number, col: number): string {
        prand.unsafeSkipN(this.rng, Math.abs(row) * this.colCount + Math.abs(col));

        const pickVowel = generateFloat64(this.rng) < 0.45; // 45% chance vowel
        return pickLetterFromGroup(pickVowel ? 'vowel' : 'consonant', this.rng);
    }

    private async setupGrid() {
        let grid: Cell[] = [];

        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.colCount; c++) {
                grid.push(createCell(r, c, this.getRandomLetter(r, c), null));
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
        const matches: { 
            coords: { 
            r: number; 
            c: number }[]; 
            word: string;
            anyCellCreatedThisTurn: boolean;
        }[] = [];
    
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
                    let anyCellCreatedThisTurn = false;
                    let coords: { r: number; c: number }[] = [];
                    let word = '';
    
                    let curR = r;
                    let curC = c;
    
                    while (curR >= 0 && curR < this.rowCount && curC >= 0 && curC < this.colCount) {
                        const cell = grid[curR][curC];
                        const letter = cell?.letter;
                        if (!letter) break;
    
                        coords.push({ r: curR, c: curC });
                        word += letter;
    
                        if (cell.createdTurn === this.movesRemaining()) {
                            anyCellCreatedThisTurn = true;
                        }
    
                        if (word.length >= minLength && this.isWord(word)) {
                            matches.push({ coords: [...coords], word, anyCellCreatedThisTurn });
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
                        if (match.word) {
                            let totalScore;
                            let chainBonus = 1;
                            const wordScore = this.calculateWordScore(match.word);

                            if (!match.anyCellCreatedThisTurn) {
                                chainBonus = chainCount >= 1 ? (chainCount * 0.5) + 1 : 1;
                                totalScore = Math.round(wordScore * chainBonus);
                            }
                            else {
                                // Word score is irrelevant, we just award the number of the chain
                                totalScore = Math.min(chainCount, wordScore);
                            }
                            
                            this.setScore(s => s + totalScore);
                            
                            this.setFoundWords(prev => [
                                ...prev,
                                { 
                                    word: match.word, 
                                    score: totalScore, 
                                    chain: chainCount, 
                                    chainBonus: chainBonus, 
                                    manuallyFound: !match.anyCellCreatedThisTurn,
                                    coords: match.coords.map(c => ({ row: c.r, column: c.c })) 
                                }
                            ]);
                        }
                    }
                });
            }

            
            // Step 1 : Mark all words as matched AND spawn new cells in the negative rows
            const matchedCoords: Set<[r: number, c: number]> = new Set();

            for (const match of matches) {
                for (let cellIndex = 0; cellIndex < this.cells.length; cellIndex++) {
                    if (match.coords.some(coord => coord.r === this.cells[cellIndex].row && coord.c === this.cells[cellIndex].column)) {
                        this.setCells(cellIndex, { isMatched: true });
                    }
                }

                for (const coord of match.coords) {
                    matchedCoords.add([coord.r, coord.c]);
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
                    newCells.push(createCell(r, c, this.getRandomLetter(r, c), this.movesRemaining()));
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
        return true;
    }
};