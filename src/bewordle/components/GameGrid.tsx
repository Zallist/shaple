import { createSignal, createMemo, For, Show } from 'solid-js'
import Tile from './Tile'
import { Game, Cell } from '../bewordle-game';

export default function GameGrid({ game }: { game: Game }) {
  const [selected, setSelected] = createSignal<Cell | null>(null)

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
    <div class="flex flex-col">
      {/* Header */}
      <header class="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50">
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
                  <div class="tile-container absolute transition-all duration-240 ease-out transform-gpu will-change-transform"
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

        {/* Game Status */}
        <Show when={game.isDone()}>
          <div class="mt-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border border-red-500/30 text-center">
            <h3 class="text-xl font-bold text-white mb-1">Finished!</h3>
            <p class="text-gray-200 text-sm">Final Score: {game.score().toLocaleString()}</p>
          </div>
        </Show>
      </main>

      <Show when={game.foundWords().length > 0}>
        <div class="bg-gray-900/80 backdrop-blur-md border-t border-gray-800/50 py-3 px-4">
          <div class="max-w-md">
            <h3 class="text-sm font-medium text-gray-400 mb-2 flex items-center justify-center">
              <div class="mr-2">Found Words</div>
              <div class="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{game.foundWords().length}</div>
            </h3>
            <div class="flex flex-wrap gap-2 justify-center">
              <For each={game.foundWords()}>
                {(found, i) => {
                  const [loadedDefinition, setLoadedDefinition] = createSignal(false);
                  const [definition, setDefinition] = createSignal<string>('');

                  async function onMouseOver() {
                    if (!loadedDefinition()) {
                      setLoadedDefinition(true);

                      const req = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${found.word}`);

                      if (!req.ok) {
                        console.error(`Failed to fetch definition for word ${found.word}`);
                        setDefinition(`[Definition not found for ${found.word}]`);
                        return;
                      }

                      const defList = await req.json();
                      let result = '';

                      for (const def of defList) {
                        result += `${def.word}${def.origin ? ` (${def.origin})` : ''}\n`;

                        for (const meaning of def.meanings) {
                          result += `${meaning.partOfSpeech}:\n`;
                          for (const definition of meaning.definitions) {
                            result += `- ${definition.definition}${definition.example ? ` {${definition.example}}` : ''}\n`;
                          }
                        }
                      }

                      setDefinition(result);
                    }
                  }

                  return (
                    <div 
                      class="px-3 py-1.5 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-lg text-sm font-medium text-white shadow-md backdrop-blur-sm 
                            border border-gray-700/50 flex items-center"
                      style={{
                        'animation-delay': `${i() * 50}ms`,
                        'view-transition-name': `word-${i()}`
                      }}
                      onMouseOver={onMouseOver}
                      title={definition()}
                    >
                      <span class="text-blue-300">{found.word}</span>
                      <span class="ml-1.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                        +{found.score}
                      </span>
                      {found.chain >= 1 && (
                        <span class="ml-1 text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
                          x{found.chainBonus}
                        </span>
                      )}
                    </div>
                  )
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
