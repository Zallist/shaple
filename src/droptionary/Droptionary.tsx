import { createSignal, createMemo, onMount, onCleanup, Show, batch, Suspense } from 'solid-js'
import GameGrid from './components/GameGrid'
import { getCurrentSeed, getRandomSeed, numberToString, seedForDate } from '../utils/seed'
import { Game } from './droptionary-game';

export default function Droptionary() {
  const [showHelp, setShowHelp] = createSignal(false);
  const [seed, setSeed] = createSignal<number | undefined>(undefined);
  const [game, setGame] = createSignal<Game | null>(null);

  const isDailySeed = createMemo(() => seed() === seedForDate());

  async function setSeedAndReset(seed: number) {
    let g = game() || new Game();

    setSeed(seed);
    setGame(null);
    
    await g.initialize(seed);
    await g.playStoredMoves();

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
    <div class="flex flex-col justify-center items-center">
      <header class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20 w-100 mx-auto">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {isDailySeed() ? 'Daily' : 'Seeded'}
          </h1>

          <div class="flex items-center gap-3">
            <span class="max-w-28 text-slate-400 text-sm bg-slate-700/50 px-3 py-1 rounded-md">
              <input class="text-right w-full select-all"
                type="text" title="Seed"
                value={numberToString(seed() ?? 0)}
                onChange={(v) => {
                  if (!v.target.validity.valid)
                    v.target.value = v.target.value.replace(/[^0-9A-Za-z]/g, '');
                  window.location.hash = `#seed=${v.target.value}`;
                }}
                maxLength={12}
                pattern="[0-9A-Za-z]*" />
            </span>

            <button
              onClick={() => toggleDailySeed()}
              class="h-10 w-10 rounded-lg border-2 border-slate-600/50 flex items-center justify-center font-semibold text-sm
                      bg-slate-700/70 hover:bg-slate-600/70 hover:border-slate-500/70 active:scale-95 transition-all duration-200"
              title={isDailySeed() ? 'Switch to Random' : 'Switch to Daily'}
            >
              <span class="material-icon text-lg">
                {isDailySeed() ? 'shuffle' : 'calendar_today'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <Show when={game()} fallback={<div>Loading...</div>}>
        <GameGrid game={game()!} />
      </Show>
      
      <footer class="mt-6 text-center">
        <div class="flex justify-center mb-4">
          <button
            onClick={() => setShowHelp(!showHelp())}
            class="px-4 py-2 rounded-lg border-2 border-slate-600/50 flex items-center justify-center font-semibold text-sm
                    bg-slate-700/70 hover:bg-slate-600/70 hover:border-slate-500/70 active:scale-95 transition-all duration-200"
            aria-label="Help"
          >
            <span class="material-icon mr-2 transition-transform duration-300"
              style={`transform: rotate(${showHelp() ? '180deg' : '0'})`}>
              expand_more
            </span>
            Help
          </button>
        </div>

        <Show when={showHelp()}>
          <div class="max-w-4xl mx-auto">
            <div class="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 animate-fade-in text-left">
              <h3 class="font-bold text-lg mb-2">How to Play</h3>
              <ul class="list-disc pl-5 space-y-1">
                <li>Swap letters with an adjacent letter (horizontally, vertically or diagonally).</li>
                <li>Form English words 5 or more letters long in any of the 8 directions.</li>
                <li>Score points based on the letters you use!</li>
                <li>Chain falling words for combo bonuses during the cascade stage! Falling words only need to be 4+ letters long.</li>
                <li class="text-slate-400/80">If a chained word uses a letter generated from a cascade, it's not worth as many points.</li>
              </ul>
            </div>
          </div>
        </Show>

        <p class="text-sm text-gray-500 mt-4">Match tiles to form words and score points!</p>
      </footer>
    </div>
  )
}