import { createSignal, Show } from 'solid-js'
import GameGrid from './components/GameGrid'
import { GRID_ROWS, GRID_COLS } from './constants'

export default function Bewordle() {
  const [showHelp, setShowHelp] = createSignal(false)
  
  return (
    <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <div class="w-full max-w-2xl">
        <header class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Bewordle
            </h1>
            <div class="flex gap-3">
              <button 
                onClick={() => setShowHelp(!showHelp())}
                class="p-2 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Help"
              >
                <span class="material-symbols-outlined">help</span>
              </button>
              <button 
                onClick={() => window.location.reload()}
                class="p-2 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="New Game"
              >
                <span class="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>
          
          <Show when={showHelp()}>
            <div class="bg-gray-800 rounded-lg p-4 mb-4 text-sm text-gray-300 animate-fade-in">
              <h3 class="font-bold text-lg mb-2">How to Play</h3>
              <ul class="list-disc pl-5 space-y-1">
                <li>Click and drag to swap adjacent letters</li>
                <li>Form 5-letter English words horizontally or vertically</li>
                <li>Score points based on letter values (Scrabble-style)</li>
                <li>Score multiplier decreases with each move</li>
                <li>Chain words for combo bonuses</li>
              </ul>
            </div>
          </Show>
        </header>

        <main class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700/50 p-4">
          <GameGrid />
        </main>
        
        <footer class="mt-6 text-center text-sm text-gray-500">
          <p>Match tiles to form words and score points!</p>
        </footer>
      </div>
    </div>
  )
}