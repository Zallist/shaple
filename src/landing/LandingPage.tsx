import { Component, For } from 'solid-js';
import { Games } from '../games';

const LandingPage: Component = () => {
  return (
    <div class="max-w-4xl mx-auto">
      <header class="bg-gradient-to-br from-slate-800 to-slate-900 py-12 px-4 rounded-lg shadow-lg text-center mb-12">
        <h1 class="text-4xl font-extrabold text-gray-200 mb-4">
          <img src="favicon.png" class="h-16 aspect-square mr-2 inline" />
          Games
        </h1>
        <p class="text-xl text-gray-400">Work your brain out</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <For each={Games}>
          {(game) => (
            <a
              href={game.path}
              class={`${game.class} rounded-lg p-6 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1`}
            >
              <h2 class="text-2xl font-bold mb-2 flex items-center">
                <img src={game.icon_path} class="h-8 aspect-square mr-2 inline" />
                {game.name}
              </h2>
              <p class="text-white-900/90">{game.description}</p>
            </a>
          )}
        </For>
      </div>
    </div>
  );
};

export default LandingPage;
