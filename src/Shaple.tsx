import { createSignal, For, Show, Switch, createMemo, createEffect, Match } from 'solid-js'
import { Portal, Dynamic } from 'solid-js/web'
import * as generator from './shaple-generator'
import { DEV } from 'solid-js'
import prand from 'pure-rand'

const LENGTH = 5
const MAX_ATTEMPTS = 5

function shapeKey(s: generator.ShapeCode) {
  let shapeDefinition = generator.ShapeDefinitions[s];
  return <span class="material-symbols-outlined">{shapeDefinition.icon_name}</span>;
}

export type Feedback = 'exact' | 'present' | 'absent'

export function seedForDate(d = new Date()): number {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const s = `${utc.getUTCFullYear()}${String(utc.getUTCMonth()+1).padStart(2,'0')}${String(utc.getUTCDate()).padStart(2,'0')}`;
  // simple numeric hash
  let h = 2166136261 >>> 0;
  for (let i=0; i<s.length; i++) { 
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; 
  }
  return h >>> 0;
}

function getStoredAttempts(seed: number): generator.ShapeCode[][] {
  const stored = localStorage.getItem(`shaple_attempts_${seed}`);
  return stored ? JSON.parse(stored) : [];
}

function setStoredAttempts(seed: number, attempts: generator.ShapeCode[][]) {
  localStorage.setItem(`shaple_attempts_${seed}`, JSON.stringify(attempts));
}

function getCurrentSeed(): number {
  const hash = window?.location?.hash;

  if (hash) {
    const params = hash.split('&');
    for (let i = 0; i < params.length; i++) {
      const param = params[i].split('=', 2);
      if (param[0] === 'seed' && param.length === 2) {
        const seed = parseInt(param[1]);

        if (!isNaN(seed)) 
          return seed;
      }
    }
  }

  return seedForDate();
}

function getRandomSeed(): number {
  const rng = prand.xorshift128plus(Date.now() ^ (Math.random() * 0x100000000));
  let seed = prand.unsafeUniformIntDistribution((2**31 - 1) * -1, 2**31 - 1, rng);
  return seed;
}

export default function App() {
  const [seed, setSeed] = createSignal(getCurrentSeed());
  const solution = createMemo(() => generator.generateShaple(LENGTH, seed()));

  const [attempts, setAttempts] = createSignal<generator.ShapeCode[][]>(getStoredAttempts(seed()));
  const [currentGuess, setCurrentGuess] = createSignal<generator.ShapeCode[]>([]);

  const feedbacks = createMemo<Feedback[][]>(() => {
    return attempts().map(attempt => {
      const fb: Feedback[] = Array(LENGTH).fill('absent');
      const sol = solution();
      const solCounts: Record<generator.ShapeCode, number> = {} as any;
      
      // Count occurrences of each shape in solution
      sol.forEach(shape => {
        solCounts[shape] = (solCounts[shape] || 0) + 1;
      });

      // First pass: mark exact matches
      for (let i = 0; i < LENGTH; i++) {
        if (attempt[i] === sol[i]) {
          fb[i] = 'exact';
          solCounts[attempt[i]]--;
        }
      }

      // Second pass: mark present (correct but wrong position)
      for (let i = 0; i < LENGTH; i++) {
        if (fb[i] !== 'exact' && solCounts[attempt[i]] > 0) {
          fb[i] = 'present';
          solCounts[attempt[i]]--;
        }
      }

      return fb;
    });
  });

  const isDailySeed = createMemo(() => seed() === seedForDate());
  const isDone = createMemo(() => attempts().length >= MAX_ATTEMPTS || feedbacks().at(-1)?.every(f => f === 'exact'));

  createEffect(() => {
    setStoredAttempts(seed(), attempts());
  });

  function setSeedAndReset(s: number) {
    var newAttempts = getStoredAttempts(s);
    
    setSeed(s);
    setAttempts(newAttempts);
    setCurrentGuess([]);
  }

  function pickShape(s: generator.ShapeCode) { 
    if (isDone()) return; 
    if (currentGuess().length >= LENGTH) return; 
    setCurrentGuess([...currentGuess(), s]); 
  }
  
  function removeLast() { 
    if (isDone()) return; 
    setCurrentGuess(currentGuess().slice(0, -1)); 
  }

  function submit() {
    if (currentGuess().length !== LENGTH) return;
    const g = currentGuess();
    //if (!generator.isShapleValid(g)) {
    //  alert('This guess violates relational rules; it is allowed but may be inconsistent with solutions.');
    //}
    setAttempts([...attempts(), g]);
    setCurrentGuess([]);
  }

  function toggleDailySeed() {
    let seed;

    if (isDailySeed()) {
      seed = getRandomSeed();
      window.location.hash = `#seed=${seed}`;
    } else {
      seed = seedForDate();
      window.location.hash = '';
    }

    setSeedAndReset(seed);
  }

  return (
    <div class="flex justify-center p-4">
      <div class="w-full">
        <div class="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h1 class="text-2xl font-bold mb-4">
            Shaple - {isDailySeed() ? 'Daily' : 'Seeded'}
            <span title="Seed" class="text-slate-400 text-xs"> ({seed()})</span>
          </h1>

          <div class="space-y-2">
            <For each={attempts()}>
              {(guess, idx) => {
                const fb = feedbacks()[idx()] || []
                return (
                  <div class="flex gap-2">
                    <For each={Array.from({length:LENGTH})}>{(_, j)=>(
                      <div class={`flex-1 min-w-14 h-14 rounded-md border flex items-center justify-center font-semibold ${fb[j()]==='exact' ? 'bg-green-600 border-green-700' : fb[j()]==='present' ? 'bg-yellow-500 border-yellow-600' : 'bg-slate-700 border-slate-600'}`}>
                        { (guess[j()] ? shapeKey(guess[j()]) : '') }
                      </div>
                    )}</For>
                  </div>
                )
              }}
            </For>

            <Show when={!isDone()}>
              <div class="flex gap-2">
                <For each={Array.from({length:LENGTH})}>{(_, j)=>(
                  <div class={`flex-1 min-w-14 h-14 rounded-md border flex items-center justify-center font-semibold`}>
                    { (currentGuess()[j()] ? shapeKey(currentGuess()[j()]) : '') }
                  </div>
                )}</For>
              </div>
            </Show>
          </div>

          <Show when={isDone()}>
            <div class="mt-8 rounded">
              <div class="mb-2 text-sm text-slate-400 font-semibold">
                Solution
              </div>

              <div class="flex gap-2">
                <For each={solution()}>{s=>(
                  <div class={`flex-1 min-w-14 h-14 rounded-md border flex items-center justify-center font-semibold`}>
                    {shapeKey(s)}
                  </div>
                )}</For>
              </div>
            </div>
          </Show>

          <Show when={!isDone()}>
            <div class="mt-8 grid grid-cols-5 gap-2">
              <For each={generator.AllShapes}>{(s)=> (
                <button class="flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                        onClick={() => pickShape(s)}>
                    {shapeKey(s)}
                </button>
              )}</For>
            </div>
          </Show>
          
          <div class="flex gap-2 mt-4">
            <Show when={!isDone()}>
              <button class="flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-neutral-900" 
                      onClick={removeLast}
                      disabled={currentGuess().length === 0}>REMOVE</button>
              <button class="flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-blue-600 hover:bg-blue-500 active:bg-blue-400 disabled:bg-neutral-900" 
                      onClick={submit}
                      disabled={currentGuess().length !== LENGTH}>SUBMIT</button>
            </Show>

            <button class="flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 disabled:bg-neutral-900" 
                    onClick={toggleDailySeed}>{isDailySeed() ? 'RANDOM' : 'DAILY'}</button>
          </div>
          <div class="mt-8">
            <RulesSection />
          </div>
        </div>
      </div>
    </div>
  )
}

function RulesSection() {
  const [areRulesVisible, setRulesAreVisible] = createSignal(false);

  function parseDescription(desc: string) {
    const parts = desc.split(/(<[a-z]+>)/gi);
  
    return parts.map(part => {
      const match = part.match(/^<([a-z]+)>$/i);
      if (match) {
        const shapeCode = match[1] as generator.ShapeCode;
        return (
          <span class="font-semibold" title={generator.ShapeDefinitions[shapeCode].displayName}>
            {shapeKey(shapeCode)}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <>
      <button class="w-full min-w-10 h-10 rounded-md border justify-center font-semibold border-slate-600 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 disabled:bg-neutral-900" 
              onClick={() => setRulesAreVisible(!areRulesVisible())}>{areRulesVisible() ? 'HIDE' : 'SHOW'} RULES</button>
      <Show when={areRulesVisible()}>
        <p class="font-semibold text-lg mt-4">Pattern Generator Rules</p>
        <ul class="list-disc list-outside">
          <For each={Object.values(generator.ShapeDefinitions)}>{shape => (
            <For each={shape.rules}>{rule => (
              <li>{parseDescription(rule.description)}</li>
            )}</For>
          )}</For>
        </ul>
      </Show>
    </>
  );
}