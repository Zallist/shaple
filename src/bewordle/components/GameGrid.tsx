import { createSignal, createMemo, For, onMount, Show, createEffect } from 'solid-js'
import { makeGrid, swap, findLineMatches, removeAndCollapse, Cell, isAdjacent } from '../utils/game'
import Tile from './Tile'
import { GRID_ROWS, GRID_COLS, LETTER_VALUES, INITIAL_MOVES_AVAILABLE } from '../constants'

// Calculate word score based on letter values and word length
function calculateWordScore(word: string): number {
  let score = 0;
  
  // Calculate base score from letter values
  for (const letter of word) {
    const letterScore = LETTER_VALUES[letter] || 1;
    score += letterScore;
  }
  
  return score
}

export default function GameGrid() {
  const [grid, setGrid] = createSignal<Cell[][]>([])
  const [selected, setSelected] = createSignal<Cell | null>(null)
  const [score, setScore] = createSignal(0)
  const [movesAvailable, setMovesAvailable] = createSignal(INITIAL_MOVES_AVAILABLE)
  const [foundWords, setFoundWords] = createSignal<Array<{word: string, score: number, chain: number}>>([])

  const [isChaining, setIsChaining] = createSignal(false)
  const isDone = createMemo(() => movesAvailable() <= 0)

  onMount(() => {
    setGrid(makeGrid(GRID_ROWS, GRID_COLS))
  })

  const handleClick = (cell: Cell) => {
    if (isDone() || isChaining()) {
      setSelected(null);
      return;
    }

    const prev = selected()
    
    if (!prev) {
      setSelected(cell)
      return
    }
    
    // Clicking the same cell deselects it
    if (prev.r === cell.r && prev.c === cell.c) {
      setSelected(null)
      return
    }
    
    // Check if cells are adjacent
    if (isAdjacent(prev, cell)) {
      const swapped = swap(grid(), prev, cell)
      const matches = findLineMatches(swapped)
      
      setGrid(swapped)

      if (matches.length > 0) {
        setSelected(null)
        processMatches(swapped, matches)
      }
      else {
        // Increment move count at the end of processing
        setSelected(cell)
      }

      setMovesAvailable(c => c - 1)
    } else {
      // Select the new cell if not adjacent
      setSelected(cell)
    }
  }

  async function processMatches(currentGrid: Cell[][], initialMatches: any[]) {
    let g = currentGrid
    let localChain = 0
    
    while (true) {
      const matches = initialMatches && localChain === 0 ? initialMatches : findLineMatches(g)
      if (!matches || matches.length === 0) break;

      setIsChaining(true)
      
      localChain++
      
      // Process each match
      for (const match of matches) {
        if (match.word) {
          const wordScore = calculateWordScore(match.word);
          const chainBonus = localChain > 1 ? Math.pow(1.5, localChain - 1) : 1;
          const totalScore = Math.round(wordScore * chainBonus);
          
          // Update score with animation
          setScore(s => s + totalScore)
          
          // Add to recent words history
          setFoundWords(prev => [
            { word: match.word, score: totalScore, chain: localChain },
            ...prev
          ])
        }
      }
      
      g = removeAndCollapse(g, matches)
      setGrid(g)
      await new Promise(r => setTimeout(r, 240))
    }

    setIsChaining(false)
  }

  return (
    <div class="flex flex-col">
      <div class="p-4 md:p-6">
        <div class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Score: <span class="text-white">{score()}</span>
        </div>
      </div>
      
      <div class="flex justify-center">
        <div 
          class="grid gap-1.5 md:gap-2" 
          style={{ 
            'grid-template-columns': `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            'width': 'fit-content',
            'margin': '0 auto'
          }}
        >
          <For each={grid()} fallback={<div>Loading</div>}>
            {(row, rowIndex) => (
              <For each={row}>
                {(cell, colIndex) => {
                  const isSelectedCell = createMemo(() => selected()?.r === cell.r && selected()?.c === cell.c);
                  return (
                    <div class="flex items-center justify-center" style="width: 32px; height: 32px;">
                      <Tile
                        cell={cell}
                        onClick={handleClick}
                        isSelected={isSelectedCell()}
                      />
                    </div>
                  )
                }}
              </For>
            )}
          </For>
        </div>
      </div>
      
      {/* Game stats and history */}
      <div class="mt-6 space-y-4">
        {/* Current move stats */}
        <div class="bg-gray-800/50 rounded-lg p-4">
          <div class="text-center">
            <div class="text-sm text-gray-300">Moves Left</div>
            <div class="text-xl font-bold">{movesAvailable()}</div>
          </div>
        </div>

        {/* Recent words */}
        <Show when={foundWords().length > 0}>
          <div class="mt-2">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Recent Words</h3>
            <div class="space-y-2">
              <For each={foundWords()}>
                {(item, i) => (
                  <div class="flex justify-between items-center bg-gray-800/30 rounded px-3 py-2">
                    <div class="font-mono text-lg">{item.word.toUpperCase()}</div>
                    <div class="flex items-center gap-2">
                      {item.chain > 1 && (
                        <span class="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">
                          x{item.chain}
                        </span>
                      )}
                      <span class="font-bold text-yellow-300">+{item.score}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
