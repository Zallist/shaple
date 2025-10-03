import { createSignal, createMemo, For, onMount, Show, createEffect } from 'solid-js'
import { makeGrid, swap, findLineMatches, removeAndCollapse, Cell, isAdjacent } from '../utils/game'
import Tile from './Tile'
import { GRID_ROWS, GRID_COLS, LETTER_VALUES } from '../constants'

// Calculate word score based on letter values and word length
function calculateWordScore(word: string, moveCount: number): number {
  let score = 0
  let wordMultiplier = 1
  
  // Calculate base score from letter values
  for (const letter of word) {
    const letterScore = LETTER_VALUES[letter] || 1
    score += letterScore
  }
  
  // Apply word length bonus
  const lengthBonus = Math.max(0, word.length - 3) * 5
  score += lengthBonus
  
  // Apply move penalty (reduce score by 10% for each move beyond the first)
  const movePenalty = Math.max(0, moveCount - 1) * 0.1
  score = Math.max(1, Math.floor(score * (1 - movePenalty)))
  
  return score
}

export default function GameGrid() {
  const [grid, setGrid] = createSignal<Cell[][]>([])
  const [selected, setSelected] = createSignal<Cell | null>(null)
  const [score, setScore] = createSignal(0)
  const [moveCount, setMoveCount] = createSignal(0)
  const [isDragging, setIsDragging] = createSignal(false)
  const [dragOverCell, setDragOverCell] = createSignal<Cell | null>(null)
  const [recentWords, setRecentWords] = createSignal<Array<{word: string, score: number, chain: number}>>([])
  const [scoreMultiplier, setScoreMultiplier] = createSignal(1)

  onMount(() => {
    setGrid(makeGrid(GRID_ROWS, GRID_COLS))
  })

  const handleDragStart = (cell: Cell) => {
    setIsDragging(true)
    setSelected(cell)
    // Find all adjacent cells that can be swapped with
    const adjacent = []
    const { r, c } = cell
    const directions = [
      { dr: 0, dc: 1 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: -1, dc: 0 }
    ]
    
    for (const { dr, dc } of directions) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        adjacent.push(grid()[nr][nc])
      }
    }
  }

  const handleDragOver = (cell: Cell) => {
    if (!isDragging()) return
    setDragOverCell(cell)
  }

  const handleDrop = (from: Cell, to: Cell) => {
    if (!isDragging()) return
    
    // Reset drag state
    setIsDragging(false)
    setSelected(null)
    setDragOverCell(null)
    
    // If not adjacent, just select the new cell
    if (!isAdjacent(from, to)) {
      setSelected(to)
      return
    }
    
    // Perform the swap
    const newGrid = swap(grid(), from, to)
    const matches = findLineMatches(newGrid)
    
    setGrid(newGrid)
    processMatches(newGrid, matches)
  }
  
  // Calculate score multiplier based on move count
  createEffect(() => {
    const start = 1
    const target = 0.25
    const decay = 0.9 // adjust steepness

    const multiplier = target + (start - target) * Math.pow(decay, moveCount())
    setScoreMultiplier(multiplier)

  })

  const handleClick = (cell: Cell) => {
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
      processMatches(swapped, matches)
      setSelected(null)
    } else {
      // Select the new cell if not adjacent
      setSelected(cell)
    }
  }

  async function processMatches(currentGrid: Cell[][], initialMatches: any[]) {
    let g = currentGrid
    let localChain = 0
    
    // Increment move count at the start of processing
    setMoveCount(c => c + 1)
    
    while (true) {
      const matches = initialMatches && localChain === 0 ? initialMatches : findLineMatches(g)
      if (!matches || matches.length === 0) break
      
      localChain++
      
      // Process each match
      for (const match of matches) {
        if (match.word) {
          const wordScore = calculateWordScore(match.word, moveCount())
          const chainBonus = localChain > 1 ? Math.pow(1.5, localChain - 1) : 1
          const totalScore = Math.round(wordScore * chainBonus)
          
          // Update score with animation
          setScore(s => s + totalScore)
          
          // Add to recent words history
          setRecentWords(prev => [
            { word: match.word, score: totalScore, chain: localChain },
            ...prev
          ].slice(0, 5)) // Keep only last 5 words
        }
      }
      
      g = removeAndCollapse(g, matches)
      setGrid(g)
      await new Promise(r => setTimeout(r, 240))
    }
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
                  const isOverCell = createMemo(() => dragOverCell()?.r === cell.r && dragOverCell()?.c === cell.c);
                  return (
                    <div class="flex items-center justify-center" style="width: 32px; height: 32px;">
                      <Tile
                        cell={cell}
                        onClick={handleClick}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        isSelected={isSelectedCell()}
                        isMatched={false}
                        isWord={false}
                        isDraggable={true}
                        isOver={isOverCell()}
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
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-sm text-gray-300">Move Count</div>
              <div class="text-xl font-bold">{moveCount()}</div>
            </div>
            <div class="text-center">
              <div class="text-sm text-gray-300">Score Multiplier</div>
              <div class="text-xl font-bold">{scoreMultiplier().toFixed(2)}x</div>
            </div>
          </div>
        </div>

        {/* Recent words */}
        <Show when={recentWords().length > 0}>
          <div class="mt-2">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Recent Words</h3>
            <div class="space-y-2">
              <For each={recentWords()}>
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
