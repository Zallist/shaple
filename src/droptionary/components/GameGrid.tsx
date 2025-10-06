import { createSignal, createMemo, For, Show, Switch, Match, createEffect } from 'solid-js'
import Tile from './Tile'
import DefinitionModal from './DefinitionModal'
import { Game, Cell } from '../droptionary-game';

export default function GameGrid({ game }: { game: Game }) {
  const [selected, setSelected] = createSignal<Cell | null>(null)
  const [viewingWord, setViewingWord] = createSignal<string | null>(null);

  const handleClick = async (cell: Cell) => {

    if (game.isDone() || game.isProcessing()) {
      setSelected(null);
      return;
    }

    const prev = selected();

    if (!prev) {
      setSelected(cell);
      return
    }

    // Clicking the same cell deselects it
    if (prev.id === cell.id) {
      setSelected(null);
      return;
    }

    // Check if cells are adjacent
    if (!game.isAdjacent(prev, cell)) {
      setSelected(cell);
      return;
    }

    setSelected(null);
    await game.moveCell(prev, cell);
  }

  return (
    <>
      {/* Header */}
      <header class="w-100 mx-auto">
        <div class="container mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex justify-between items-center mb-1">
              <span class="text-2xl font-bold text-white">
                {game.movesRemaining()}/{game.initialMoveCount}
                <span class="text-xs uppercase text-gray-400 ml-2">Moves</span>
              </span>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-2xl font-bold text-white">
                {game.score().toLocaleString()}
                <span class="text-xs uppercase text-gray-400 ml-2">Score</span>
              </div>
            </div>
          </div>

          <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{
                width: `${(game.movesRemaining() / game.initialMoveCount) * 100}%`,
                'box-shadow': '0 0 10px rgba(99, 102, 241, 0.5)'
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main class="flex-1 flex flex-col items-center justify-center py-4">
        <div
          class="p-1 w-100 h-100 bg-gray-800/30 rounded-2xl backdrop-blur-sm border border-gray-700/50 shadow-2xl"
          style={{
            'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div class="relative w-full h-full overflow-hidden">
            <For each={game.cells}>
              {(cell) => {
                const isSelectedCell = createMemo(() => selected()?.id === cell.id);

                return (
                  <div class="tile-container absolute transition-all duration-240 ease-out"
                    style={{
                      'width': `calc(${100 / game.colCount}% - 0.5rem)`,
                      'height': `calc(${100 / game.rowCount}% - 0.5rem)`,
                      'left': `calc(${cell.column * (100 / game.colCount)}% + 0.25rem)`,
                      'top': `calc(${cell.row * (100 / game.rowCount)}% + 0.25rem)`,
                      '--animate-delay': '0.3s',
                      '--animate-duration': '0.7s',
                    }}
                    classList={{
                      'animate__animated animate__rotateOut animate__delay-1s': cell.isMatched,
                      'animate__animated animate__tada': cell.isMatched,
                    }}>
                    <Tile
                      cell={cell}
                      onClick={handleClick}
                      isSelected={isSelectedCell()}
                      isMatched={cell.isMatched}
                    />
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </main>
      
      {/* Game Status */}
      <Show when={game.isDone()}>
        <>
          <div class="mt-4 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border border-red-500/30 text-center">
            <h3 class="text-xl font-bold text-white mb-1">Finished!</h3>
            <p class="text-gray-200 text-sm">Final Score: {game.score().toLocaleString()}</p>
          </div>

          <div class="mt-4">
            {(() => {
              const [shown, setShown] = createSignal(false);

              const text = createMemo(() => {
                const lines = [
                  <div>
                    <a href={window.location.href} target="_blank">Droptionary</a> 
                    <span class="text-slate-400"> ({game.foundWords().length} words) </span>
                    <span class="text-slate-400"> [{game.getSeedString()}] </span>
                  </div>,
                  <div>Score: {game.score().toLocaleString()}</div>
                ];

                const wordGridCount: { anyCount: number, manualCount: number }[][] = Array.from({ length: game.rowCount }, () => Array.from({ length: game.colCount }, () => ({ anyCount: 0, manualCount: 0 })));
                const foundWords = game.foundWords();
                for (let i = 0; i < foundWords.length; i++) {
                  const word = foundWords[i];
                  for (let j = 0; j < word.coords.length; j++) {
                    const coord = word.coords[j];
                    wordGridCount[coord.row][coord.column].anyCount++;
                    if (word.manuallyFound)
                      wordGridCount[coord.row][coord.column].manualCount++;
                  }
                }

                for (let r = 0; r < game.rowCount; r++) {
                  const line = [];

                  for (let c = 0; c < game.colCount; c++) {
                    const count = wordGridCount[r][c];
                    if (count.manualCount > 0)
                      line.push(<span title={`Manually matched a word`}>🟩</span>);
                    else if (count.anyCount > 0)
                      line.push(<span title={`Matched a word`}>🟨</span>);
                    else
                      line.push(<span title={`Never matched a word`}>⬛</span>);
                  }

                  lines.push(<div>{line}</div>);
                }

                return lines;
              });

              return (
                <>
                  <Show when={!shown()}>
                    <button class="w-full h-12 px-4 rounded-lg border-2 items-center justify-center font-semibold text-sm transition-all duration-200
                                  active:scale-95 disabled:active:scale-100
                                  bg-blue-700/70 border-blue-600/50 hover:bg-blue-600/70 hover:border-blue-500/70
                                  disabled:bg-blue-900/20 disabled:border-blue-400/20 disabled:text-blue-400
                                  animate__animated animate__bounceIn"
                      onClick={() => { setShown(true); }}>
                      <span class="material-icon text-blue-400 mr-1">share</span>
                      Share
                    </button>
                  </Show>
                  <Show when={shown()}>
                    <div class="w-full rounded-lg border-2 items-center justify-center font-semibold text-sm transition-all duration-200
                                bg-slate-700/70 border-slate-600/50 hover:bg-slate-600/70 hover:border-slate-500/70 p-2
                                whitespace-nowrap overflow-hidden select-all
                                flex flex-col gap-0">{text()}</div>
                  </Show>
                </>
              )
            })()}
          </div>
        </>
      </Show>

      {/* Undo Button */}
      <div class="mt-4 flex justify-center">
        {(() => {
          const [clickCount, setClickCount__impl] = createSignal<number>(parseInt(localStorage.getItem(`droptionary_undo_click_count_${game.getSeedString()}`) || '0'));

          if (isNaN(clickCount()))
            setClickCount__impl(0);

          function setClickCount(count: number) {
            localStorage.setItem(`droptionary_undo_click_count_${game.getSeedString()}`, count.toString());
            setClickCount__impl(count);
          }

          const clickClass = createMemo(() => {
            if (clickCount() >= 18) return "bg-red-800 border-red-700 animate__animated animate__headShake";
            if (clickCount() >= 15) return "bg-red-700 border-red-600";
            if (clickCount() >= 12) return "bg-orange-700 border-orange-600";
            if (clickCount() >= 9) return "bg-yellow-600 border-yellow-500";
            if (clickCount() >= 6) return "bg-blue-700/70 border-blue-600/50 hover:bg-blue-600/70 hover:border-blue-500/70";
            return "bg-blue-700/70 border-blue-600/50 hover:bg-blue-600/70 hover:border-blue-500/70";
          });

          return (
            <button
              onClick={() => {
                if (clickCount() >= 20) return;
                game.undoLastMove();
                setClickCount(clickCount() + 1);
              }}
              disabled={!game.canUndo() || clickCount() >= 20}
              class={`relative px-6 py-2 rounded-lg border-2 flex items-center justify-center font-semibold text-sm
                      transition-all duration-200 active:scale-95 disabled:active:scale-100
                      disabled:bg-slate-800/50 disabled:border-slate-700/50 disabled:text-slate-600
                      ${clickClass()}`}
              title="Undo your last move if it didn't do anything! Don't abuse it or else it'll be mad!"
            >
              <Switch>
                <Match when={clickCount() < 2}> <span class="material-icon mr-2">undo</span>Undo </Match>
                <Match when={clickCount() < 4}> 😐 Undo </Match>
                <Match when={clickCount() < 6}> 😑 Undo? </Match>
                <Match when={clickCount() < 8}> 😒 Seriously? </Match>
                <Match when={clickCount() < 10}> 😤 Stop. </Match>
                <Match when={clickCount() < 12}> 😠 Enough. </Match>
                <Match when={clickCount() < 14}> 🤬 QUIT IT. </Match>
                <Match when={clickCount() < 16}> 🔥 YOU LIKE THIS BUTTON? </Match>
                <Match when={clickCount() < 18}> 💢 I SWEAR— </Match>
                <Match when={clickCount() < 20}> ☠️ FINAL WARNING </Match>
                <Match when={clickCount() >= 20}> 💀 NO MORE UNDO. </Match>
              </Switch>
            </button>
          )
        })()}
      </div>

      <Show when={game.foundWords().length > 0}>
        <div class="mt-4 mx-2 bg-gradient-to-r from-slate-800/60 to-slate-800/50 backdrop-blur-md border border-gray-800/50 rounded-lg py-3 px-4">
          <h3 class="text-sm font-medium text-gray-400 mb-2 flex items-center justify-center">
            <div class="mr-2">Found Words</div>
            <div class="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{game.foundWords().length}</div>
            <div class="ml-2" title="Click words to view definitions">
              <span class="material-icon text-xs">info</span>
            </div>
          </h3>
          <div class="flex flex-wrap gap-2 justify-center">
            <For each={game.foundWords()}>
              {(found, i) => {
                return (
                  <div
                    class="px-3 py-1.5 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-lg text-sm font-medium text-white shadow-md backdrop-blur-sm 
                          border border-gray-700/50 flex items-center cursor-pointer hover:from-gray-700/80 hover:to-gray-800/80 transition-all duration-200 group"
                    style={{
                      'animation-delay': `${i() * 50}ms`,
                      'view-transition-name': `word-${i()}`
                    }}
                    onClick={() => setViewingWord(found.word)}
                  >
                    <span class="text-blue-300">{found.word}</span>
                    <span class="ml-1.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                      +{found.score}
                    </span>

                    <Show when={found.chain >= 1}>
                      <Show when={found.manuallyFound} fallback={<span class="ml-1 bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded material-icon" title="Found during cascade stage">link</span>}>
                        <span class="ml-1 text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
                          x{found.chainBonus}
                        </span>
                      </Show>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* Definition Modal */}
      <DefinitionModal
        word={viewingWord()!}
        isOpen={!!viewingWord()}
        onClose={() => setViewingWord(null)}
      />
    </>
  )
}
