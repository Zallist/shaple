import { createSignal, For, Show, createMemo, createEffect } from 'solid-js'
import * as generator from './shaple-generator'
import { DEV } from 'solid-js'

const LENGTH = 5
const MAX_ATTEMPTS = 5

function shapeKey(s: generator.ShapeCode) {
  let shapeDefinition = generator.ShapeDefinitions[s];
  return <span class="material-symbols-outlined">{shapeDefinition.icon_name}</span>;
}

export type Feedback = 'exact' | 'present' | 'absent'

export function seedForDate(d = new Date()): number {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const s = `${utc.getUTCFullYear()}${String(utc.getUTCMonth()+1).padStart(2,'0')}${String(utc.getUTCDate()).padStart(2,'0')}`
  // simple numeric hash
  let h = 2166136261 >>> 0
  for(let i=0;i<s.length;i++){ h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0 }
  return h >>> 0
}

function getStoredAttempts(seed: number): generator.ShapeCode[][] {
  const stored = localStorage.getItem(`shaple_attempts_${seed}`);
  return stored ? JSON.parse(stored) : [];
}

function setStoredAttempts(seed: number, attempts: generator.ShapeCode[][]) {
  localStorage.setItem(`shaple_attempts_${seed}`, JSON.stringify(attempts));
}

export default function App(){
  const todaySeed = seedForDate()
  const solution = createMemo(() => generator.generateShaple(LENGTH, todaySeed))

  const [attempts, setAttempts] = createSignal<generator.ShapeCode[][]>(getStoredAttempts(todaySeed))
  const [current, setCurrent] = createSignal<generator.ShapeCode[]>([])

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
  const isDone = createMemo(() => attempts().length >= MAX_ATTEMPTS || feedbacks().at(-1)?.every(f => f === 'exact'));

  createEffect(() => {
    setStoredAttempts(todaySeed, attempts());
  });

  function pickShape(s: generator.ShapeCode) { 
    if (isDone()) return; 
    if (current().length >= LENGTH) return; 
    setCurrent([...current(), s]); 
  }
  
  function removeLast() { 
    if (isDone()) return; 
    setCurrent(current().slice(0, -1)); 
  }

  function submit() {
    if (current().length !== LENGTH) return;
    const g = current();
    //if (!generator.isShapleValid(g)) {
    //  alert('This guess violates relational rules; it is allowed but may be inconsistent with solutions.');
    //}
    setAttempts([...attempts(), g]);
    setCurrent([]);
  }

  function reset() { 
    setAttempts([]); 
    setCurrent([]); 
  }

  return (
    <div class="flex justify-center p-4">
      <div class="w-full">
        <div class="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h1 class="text-2xl font-bold mb-4">Shape Wordle — Daily</h1>

          {/* <div class="mb-4">
            <p>Today's seed: {todaySeed}</p>
            <p>Today's solution: 
              <For each={solution()}>{s=>(<span class="inline-block px-2">{shapeKey(s)}</span>)}</For>
            </p>
          </div> */}

          <div class="space-y-2">
            <Show when={!isDone()}>
              <div class="flex gap-2">
                <For each={Array.from({length:LENGTH})}>{(_, j)=>(
                  <div class={`flex-1 min-w-14 h-14 rounded-md border flex items-center justify-center font-semibold`}>
                    { (current()[j()] ? shapeKey(current()[j()]) : '') }
                  </div>
                )}</For>
              </div>
            </Show>

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
          </div>

          <div class="mt-8">
            <div class="grid grid-cols-5 gap-2">
              <For each={generator.AllShapes}>{(s)=> {
                let [hovered, setHovered] = createSignal(false);

                return (
                <button class="relative flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                        onClick={() => pickShape(s)}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onTouchStart={() => setHovered(true)}
                        onTouchCancel={() => setHovered(false)}
                        onTouchEnd={() => setHovered(false)}
                        onContextMenu={(evt) => {
                          evt.preventDefault();
                          setHovered(false);
                        }}>
                    {shapeKey(s)}

                    <div class={`absolute mt-2 top-1/1 left-1/2 -translate-x-1/2 p-2 z-10 pointer-events-none 
                                bg-slate-900 border border-slate-600 rounded-md
                                opacity-0 transition-opacity duration-200
                                text-left
                                w-100
                                ${hovered() ? 'opacity-100' : 'opacity-0'}`}>
                        <p class="font-semibold text-center text-lg">{generator.ShapeDefinitions[s].displayName}</p>
                        <ul class="list-disc list-inside">
                          <For each={generator.ShapeDefinitions[s].rules}>{rule=>(
                            <li>{rule.description}</li>
                          )}</For>
                        </ul>
                    </div>
                </button>
                )
              }}</For>
            </div>
            <div class="flex gap-2 mt-4">
              <button class="flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-slate-700 hover:bg-slate-600 active:bg-slate-500" onClick={removeLast}>REMOVE</button>
              <button class="flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-blue-600 hover:bg-blue-500 active:bg-blue-400" onClick={submit}>SUBMIT</button>
              <button class="flex-1 min-w-10 h-10 rounded-md border flex items-center justify-center font-semibold border-slate-600 bg-gray-600 hover:bg-gray-500 active:bg-gray-400" onClick={reset}>RESET</button>
            </div>
          </div>

          <Show when={isDone()}>
            <div class="mt-4 p-3 bg-slate-900 rounded">
              <div>Solution: 
                <div class="flex gap-2">
                  <For each={solution()}>{s=>(
                    <span class="inline-block px-2">{shapeKey(s)}</span>
                  )}</For>
                </div>
              </div>
              <div class="mt-2 text-sm text-slate-400">Attempts used: {attempts().length} / {MAX_ATTEMPTS}</div>
            </div>
          </Show>

        </div>
      </div>
    </div>
  )
}