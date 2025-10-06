import { For, Show, createSignal } from 'solid-js'
import { Games } from '../games'

interface NavbarProps {
  currentPath: string
}

export default function Navbar({ currentPath }: NavbarProps) {
  const currentGame = () => Games.find(g => currentPath.startsWith(g.path)) || null
  const [open, setOpen] = createSignal(false)

  return (
    <nav class="w-full bg-slate-800 text-white shadow-lg mb-4">
      <div class="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        <Show when={currentGame()}>
          <div class="flex items-center gap-2">
            <img class="h-7 w-7" src={currentGame()!.icon_path} alt="" />
            <span class="text-lg font-semibold">{currentGame()!.name}</span>
          </div>
        </Show>

        <div class="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none">
          <For each={Games}>
            {g => (
              <a
                href={g.path}
                class={`flex items-center gap-1 px-2 py-1.5 rounded text-sm whitespace-nowrap ${
                  currentPath === g.path ? 'bg-gray-800' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img class="h-4 w-4" src={g.icon_path} alt="" />
                <span>{g.name}</span>
              </a>
            )}
          </For>
        </div>

        <button
          class="md:hidden p-1.5"
          onClick={() => setOpen(!open())}
        >
          <span class="material-icon">menu</span>
        </button>
      </div>

      <Show when={open()}>
        <div class="md:hidden border-t border-gray-800">
          <For each={Games}>
            {g => (
              <a
                href={g.path}
                class={`flex items-center gap-2 px-4 py-2 ${
                  currentPath === g.path ? 'bg-gray-800' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <img class="h-5 w-5" src={g.icon_path} alt="" />
                <span>{g.name}</span>
              </a>
            )}
          </For>
        </div>
      </Show>
    </nav>
  )
}
