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
  const [matchedCells, setMatchedCells] = createSignal<Set<Cell>>(new Set<Cell>())

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

  async function processMatches(currentGrid: Cell[][], initialMatches: { coords: { r: number; c: number }[]; word: string }[]) {
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

        setMatchedCells(prev => new Set<Cell>([...prev, ...match.coords.map(coord => g[coord.r][coord.c])]));
      }
      
      g = removeAndCollapse(g, matches);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMatchedCells(new Set<Cell>([]))
      setGrid(g)
    }

    setIsChaining(false)
  }

  return (
    <div class="flex flex-col">
      {/* Header */}
      <header class="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50">
        <div class="container mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex justify-between items-center mb-1">
              <span class="text-2xl font-bold text-white">
                {movesAvailable()}/{INITIAL_MOVES_AVAILABLE}
                <span class="text-xs uppercase text-gray-400 ml-2">Moves</span>
              </span>
            </div>
            <div class="flex items-center space-x-4">
                <div class="text-2xl font-bold text-white">
                  {score().toLocaleString()}
                  <span class="text-xs uppercase text-gray-400 ml-2">Score</span>
                </div>
            </div>
          </div>
          
          <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{
                width: `${(movesAvailable() / INITIAL_MOVES_AVAILABLE) * 100}%`,
                'box-shadow': '0 0 10px rgba(99, 102, 241, 0.5)'
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main class="flex-1 flex flex-col items-center justify-center py-4">
        <div 
          class="grid gap-2 md:gap-3 p-4 bg-gray-800/30 rounded-2xl backdrop-blur-sm border border-gray-700/50 shadow-2xl"
          style={{ 
            'grid-template-columns': `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          <For each={grid()} fallback={<div>Loading...</div>}>
            {(row, rowIndex) => (
              <For each={row}>
                {(cell, colIndex) => {
                  const isSelectedCell = createMemo(() => selected()?.r === cell.r && selected()?.c === cell.c);
                  return (
                    <div class="tile-container flex items-center justify-center" style="width: 48px; height: 48px;">
                      <Tile
                        cell={cell}
                        onClick={handleClick}
                        isSelected={isSelectedCell()}
                        isMatched={matchedCells().has(cell)}
                      />
                    </div>
                  )
                }}
              </For>
            )}
          </For>
        </div>

        {/* Game Status */}
        <Show when={isDone()}>
          <div class="mt-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border border-red-500/30 text-center">
            <h3 class="text-xl font-bold text-white mb-1">Game Over!</h3>
            <p class="text-gray-200 text-sm">Final Score: {score().toLocaleString()}</p>
            <button 
              onClick={() => window.location.reload()}
              class="mt-3 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Play Again
            </button>
          </div>
        </Show>
      </main>

      <Show when={foundWords().length > 0}>
        <div class="sticky bottom-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800/50 py-3 px-4">
          <div class="max-w-xl mx-auto">
            <h3 class="text-sm font-medium text-gray-400 mb-2 flex items-center">
              <span class="mr-2">Found Words</span>
              <span class="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{foundWords().length}</span>
            </h3>
            <div class="flex flex-wrap gap-2">
              <For each={foundWords()}>
                {(found, i) => (
                  <div 
                    class="px-3 py-1.5 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-lg text-sm font-medium text-white shadow-md backdrop-blur-sm 
                           border border-gray-700/50 flex items-center"
                    style={{
                      'animation-delay': `${i() * 50}ms`,
                      'view-transition-name': `word-${i()}`
                    }}
                  >
                    <span class="text-blue-300">{found.word}</span>
                    <span class="ml-1.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                      +{found.score}
                    </span>
                    {found.chain > 1 && (
                      <span class="ml-1 text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
                        x{found.chain}
                      </span>
                    )}
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
