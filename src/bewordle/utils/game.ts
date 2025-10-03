import { getCurrentSeed } from '../../utils/seed';
import { GRID_ROWS, GRID_COLS, WORD_LENGTH, ALL_WORDS as ALL_WORDS, LETTER_FREQUENCIES } from '../constants'
import * as prand from 'pure-rand'

export type Cell = { 
  r: number; 
  c: number; 
  letter: string;
}

const rng = prand.xoroshiro128plus(getCurrentSeed());

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
function pickFromGroup(group: string[], probs: number[], rng: prand.RandomGenerator): string {
  const p = generateFloat64(rng);
  let acc = 0;
  for (let i = 0; i < group.length; i++) {
    acc += probs[i];
    if (p <= acc) return group[i];
  }
  return group[group.length - 1];
}

export function randomLetter(row: number, col: number): string {
  prand.unsafeSkipN(rng, row * GRID_COLS + col);

  const pickVowel = generateFloat64(rng) < 0.45; // 45% chance vowel
  if (pickVowel) 
    return pickFromGroup(VOWELS, VOWEL_PROBS, rng);
  return pickFromGroup(CONSONANTS, CONSONANT_PROBS, rng);
}

export function makeGrid(rows = GRID_ROWS, cols = GRID_COLS): Cell[][] {
  let g: Cell[][] = []
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ r, c, letter: randomLetter(r, c) });
    }
    g.push(row);
  }

  // and now remove any generated matches
  while (true) {
    const matches = findLineMatches(g);
    if (matches.length === 0) break;
    g = removeAndCollapse(g, matches);
  }

  return g
}

// Swap two cells (adjacent) and return new grid copy
// Check if two cells are adjacent (horizontally or vertically)
export function isAdjacent(a: Cell, b: Cell): boolean {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1) || (dr === 1 && dc === 1);
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
type Direction = 'R' | 'D' | 'DR' | 'DL' | 'UR' | 'UL' | 'U' | 'L'

/**
 * Finds all word matches in the grid in all 8 directions
 * @param grid The game grid to search for matches
 * @returns Array of matches with their coordinates, direction, and the word found
 */
export function findLineMatches(grid: Cell[][]) {
  const rows = grid.length
  const cols = grid[0].length
  const matches: { coords: { r: number; c: number }[]; dir: Direction; word: string }[] = []
  
  // Define all 8 possible directions: right, down, down-right, down-left, up-right, up-left, up, left
  const directions = [
    { dr: 0, dc: 1, dir: 'R' as const },    // right
    { dr: 1, dc: 0, dir: 'D' as const },    // down
    { dr: 1, dc: 1, dir: 'DR' as const },   // down-right
    { dr: 1, dc: -1, dir: 'DL' as const },  // down-left
    { dr: -1, dc: 1, dir: 'UR' as const },  // up-right
    { dr: -1, dc: -1, dir: 'UL' as const }, // up-left
    { dr: -1, dc: 0, dir: 'U' as const },   // up
    { dr: 0, dc: -1, dir: 'L' as const }    // left
  ]

  for (const { dr, dc, dir } of directions) {
    // For each direction, determine the valid starting positions
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip if we can't fit a word of WORD_LENGTH in this direction
        const endR = r + (WORD_LENGTH - 1) * dr
        const endC = c + (WORD_LENGTH - 1) * dc
        if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) continue

        // Check words of length >= WORD_LENGTH
        for (let L = WORD_LENGTH; ; L++) {
          const endRLong = r + (L - 1) * dr
          const endCLong = c + (L - 1) * dc
          if (endRLong < 0 || endRLong >= rows || endCLong < 0 || endCLong >= cols) break

          const coords: { r: number; c: number }[] = []
          let word = ''
          
          // Build the word by following the direction
          for (let i = 0; i < L; i++) {
            const checkR = r + i * dr
            const checkC = c + i * dc
            coords.push({ r: checkR, c: checkC })
            word += grid[checkR][checkC].letter
          }

          // Check if the word is in our dictionary
          if (ALL_WORDS.has(word)) {
            matches.push({ coords, dir, word })
          }
        }
      }
    }
  }
  return matches
}

// Remove matched coords and collapse
export function removeAndCollapse(grid: Cell[][], matches: { coords: { r: number; c: number }[] }[]) {
  // Create a deep copy of the grid and mark matched cells
  const newGrid = grid.map(row => 
    row.map(cell => ({
      ...cell,
      isMatched: false // Reset matched state for all cells
    }))
  );
  
  const matchedCoords = new Set<string>();

  // Mark all matched coordinates and set isMatched to true
  for (const match of matches) {
    for (const coord of match.coords) {
      const { r, c } = coord;
      matchedCoords.add(`${r},${c}`);
    }
  }

  // Process each column from bottom to top
  for (let c = 0; c < GRID_COLS; c++) {
    let writeRow = GRID_ROWS - 1;
    
    // Move non-matched cells down
    for (let r = GRID_ROWS - 1; r >= 0; r--) {
      const coordKey = `${r},${c}`;
      if (!matchedCoords.has(coordKey)) {
        if (writeRow !== r) {
          newGrid[writeRow][c] = { ...newGrid[r][c], r: writeRow };
        }
        writeRow--;
      }
    }

    // Fill the top with new cells
    for (let r = writeRow; r >= 0; r--) {
      newGrid[r][c] = {
        r,
        c,
        letter: randomLetter(r, c),
        isMatched: false
      };
    }
  }

  return newGrid;
}

// Utility: validate whether a candidate horizontal/vertical window forms a word — used for hints
export function isValidWord(seq: string) {
  return ALL_WORDS.has(seq);
}