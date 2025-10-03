import { GRID_ROWS, GRID_COLS, WORD_LENGTH, LETTER_VALUES, LETTER_FREQUENCIES } from '../constants'
import * as prand from 'pure-rand'
import AllWordsRawList from '../words/5-letter-words.json'

export const AllWords = new Set<string>(AllWordsRawList.map(w => w.word.toUpperCase()))

export type Cell = { r: number; c: number; id: string; letter: string }

const LETTERS = Object.keys(LETTER_FREQUENCIES);
const TOTAL = Object.values(LETTER_FREQUENCIES).reduce((a, b) => a + b, 0);
const LETTER_PROBS = LETTERS.map(l => LETTER_FREQUENCIES[l] / TOTAL);

function generateFloat64(rng: prand.RandomGenerator) {
  const g1 = prand.unsafeUniformIntDistribution(0, (1 << 26) - 1, rng);
  const g2 = prand.unsafeUniformIntDistribution(0, (1 << 27) - 1, rng);
  const value = (g1 * Math.pow(2, 27) + g2) * Math.pow(2, -53);
  return value;
}
function weightedRandom(rng: prand.RandomGenerator): string {
  const p = generateFloat64(rng);
  let acc = 0;
  for (let i = 0; i < LETTERS.length; i++) {
    acc += LETTER_PROBS[i];
    if (p <= acc) return LETTERS[i];
  }
  return LETTERS[LETTERS.length - 1]; // fallback
}

const rng = prand.xoroshiro128plus(Date.now());

export function randomLetter(row: number, col: number): string {
  prand.unsafeSkipN(rng, row * GRID_COLS + col);
  return weightedRandom(rng);
}

export function makeGrid(rows = GRID_ROWS, cols = GRID_COLS): Cell[][] {
  const g: Cell[][] = []
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = []
    for (let c = 0; c < cols; c++) {
      row.push({ r, c, id: `${r}-${c}`, letter: randomLetter(r, c) })
    }
    g.push(row)
  }
  return g
}

// Swap two cells (adjacent) and return new grid copy
// Check if two cells are adjacent (horizontally or vertically)
export function isAdjacent(a: Cell, b: Cell): boolean {
  const dr = Math.abs(a.r - b.r)
  const dc = Math.abs(a.c - b.c)
  return (dr === 0 && dc === 1) || (dr === 1 && dc === 0)
}

export function swap(grid: Cell[][], a: Cell, b: Cell) {
  const g = grid.map(row => row.map(cell => ({ ...cell })))
  const ac = g[a.r][a.c]
  const bc = g[b.r][b.c]
  const temp = ac.letter
  ac.letter = bc.letter
  bc.letter = temp
  return g
}

// Find all line matches of length >= WORD_LENGTH. Returns arrays of positions in reading order.
export function findLineMatches(grid: Cell[][]) {
  const rows = grid.length
  const cols = grid[0].length
  const matches: { coords: { r: number; c: number }[]; dir: 'H' | 'V'; word?: string }[] = []

  // horizontal
  for (let r = 0; r < rows; r++) {
    let start = 0
    while (start < cols) {
      let end = start + 1
      while (end < cols) end++
      // Instead of matching same-letter jewels (bejeweled), we match any contiguous sequence length WORD_LENGTH
      // We'll check all windows of length WORD_LENGTH in this row
      start++
    }
    // We'll instead scan for windows length >= WORD_LENGTH
    for (let c = 0; c <= cols - WORD_LENGTH; c++) {
      const slice = grid[r].slice(c, c + WORD_LENGTH)
      const word = slice.map(s => s.letter).join('')
      if (AllWords.has(word)) {
        matches.push({ coords: slice.map(s => ({ r: s.r, c: s.c })), dir: 'H', word })
      }
      // also check longer sequences (WORD_LENGTH+1, ...)
      for (let L = WORD_LENGTH + 1; L <= cols - c; L++) {
        const sl = grid[r].slice(c, c + L)
        const w2 = sl.map(s => s.letter).join('')
        if (AllWords.has(w2)) {
          matches.push({ coords: sl.map(s => ({ r: s.r, c: s.c })), dir: 'H', word: w2 })
        }
      }
    }
  }

  // vertical
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r <= rows - WORD_LENGTH; r++) {
      const slice: Cell[] = []
      for (let k = 0; k < WORD_LENGTH; k++) slice.push(grid[r + k][c])
      const word = slice.map(s => s.letter).join('')
      if (AllWords.has(word)) {
        matches.push({ coords: slice.map(s => ({ r: s.r, c: s.c })), dir: 'V', word })
      }
      for (let L = WORD_LENGTH + 1; L <= rows - r; L++) {
        const sl: Cell[] = []
        for (let k = 0; k < L; k++) sl.push(grid[r + k][c])
        const w2 = sl.map(s => s.letter).join('')
        if (AllWords.has(w2)) {
          matches.push({ coords: sl.map(s => ({ r: s.r, c: s.c })), dir: 'V', word: w2 })
        }
      }
    }
  }

  return matches
}

// Remove matched coords and collapse
export function removeAndCollapse(grid: Cell[][], matches: { coords: { r: number; c: number }[] }[]) {
  const g = grid.map(row => row.map(cell => ({ ...cell })))
  const rows = g.length
  const cols = g[0].length
  // mark
  const removeMask: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))
  for (const m of matches) {
    for (const p of m.coords) removeMask[p.r][p.c] = true
  }
  // for each column, collapse
  for (let c = 0; c < cols; c++) {
    const colLetters: string[] = []
    for (let r = rows - 1; r >= 0; r--) {
      if (!removeMask[r][c]) colLetters.push(g[r][c].letter)
    }
    // refill from top
    for (let r = rows - 1; r >= 0; r--) {
      const idx = rows - 1 - r
      if (idx < colLetters.length) {
        g[r][c].letter = colLetters[idx]
      } else {
        g[r][c].letter = randomLetter(r, c)
      }
    }
  }
  return g
}

// Utility: validate whether a candidate horizontal/vertical window forms a word — used for hints
export function isValidWord(seq: string) {
  return AllWords.has(seq)
}