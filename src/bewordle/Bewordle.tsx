import { createSignal, createMemo, onMount, onCleanup, Show, batch, Suspense } from 'solid-js'
import GameGrid from './components/GameGrid'
import { getCurrentSeed, getRandomSeed, numberToString, seedForDate } from '../utils/seed'
import { Game } from './bewordle-game';

export default function Bewordle() {
  const [showHelp, setShowHelp] = createSignal(false);
  const [seed, setSeed] = createSignal<number | undefined>(undefined);
  const [game, setGame] = createSignal<Game | null>(null);

  const isDailySeed = createMemo(() => seed() === seedForDate());

  async function setSeedAndReset(seed: number) {
    let g = game() || new Game();

    setGame(null);
    await g.initialize(seed);
    await g.loadState();

    batch(() => {
      setSeed(seed);
      setGame(g);
    });
  }

  // Handle URL hash changes
  onMount(() => {
    const handleHashChange = () => {
      const newSeed = getCurrentSeed();
      if (newSeed !== seed()) {
        setSeedAndReset(newSeed);
      }
    };

    // Add event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Clean up the event listener when the component is unmounted
    onCleanup(() => {
      window.removeEventListener('hashchange', handleHashChange);
    });

    setSeedAndReset(getCurrentSeed());
  });
  
  function toggleDailySeed() {
    if (isDailySeed()) {
      // Switch to a random seed and encode it in the URL so puzzles are shareable/bookmarkable.
      const newSeed = getRandomSeed();
      window.location.hash = `#seed=${numberToString(newSeed)}`;
    }
    else {
      // Switch to the daily seed
      window.location.hash = '';
    }
  }

  return (
    <>
      <div class="text-white items-center p-4 max-w-2xl">
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
                onClick={() => toggleDailySeed()}
                class="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <span class="material-symbols-outlined">{isDailySeed() ? 'shuffle' : 'calendar_today'}</span>
                <span class="ml-2">{isDailySeed() ? 'Random' : 'Daily'}</span>
              </button>
            </div>
          </div>
          
          <Show when={showHelp()}>
            <div class="bg-gray-800 rounded-lg p-4 mb-4 text-sm text-gray-300 animate-fade-in">
              <h3 class="font-bold text-lg mb-2">How to Play</h3>
              <ul class="list-disc pl-5 space-y-1">
                <li>Click to swap letters with an adjacent letter (horizontally, vertically or diagonally)</li>
                <li>Form English words 5 or more letters long in any of the 8 directions</li>
                <li>Score points based on letter values</li>
                <li>Chain falling words for combo bonuses! Falling words only need to be 4+ letters long.</li>
              </ul>
            </div>
          </Show>
        </header>

        <main class="justify-center items-center">
          <Show when={game()} fallback={<div>Loading...</div>}>
            <GameGrid game={game()!} />
          </Show>
        </main>
        
        <footer class="mt-6 text-center text-sm text-gray-500">
          <p>Match tiles to form words and score points!</p>
        </footer>
      </div>
    </>
  )
}