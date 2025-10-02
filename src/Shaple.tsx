import { createSignal, For, Show, createMemo, createEffect, batch, onCleanup } from 'solid-js'
import { ShapeCode, AllShapes, ShapeDefinitions, ShapeRule } from './shape'
import { generateShaple } from './shaple-generator'
import prand from 'pure-rand'
import 'animate.css'
import { ShapeLoreComponent } from './shape-lore'

const LENGTH = 5;
const MAX_ATTEMPTS = 5;
const MINIMUM_SHAPE_COUNT = 10;

function shapeKey(s: ShapeCode) {
  let shapeDefinition = ShapeDefinitions[s];
  return <span class="material-symbols-outlined">{shapeDefinition.icon_name}</span>;
}

type Feedback = 'exact' | 'present' | 'absent' | 'invalid_reused' | 'invalid_rule';

function numberToString(n: number): string {
  return n.toString(36).toUpperCase();
}
function stringToNumber(s: string): number {
  return parseInt(s.toLowerCase(), 36);
}

function seedForDate(d = new Date()): number {
  // Normalize to UTC midnight so all users get the same daily puzzle regardless of timezone.
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const s = `${utc.getUTCFullYear()}${String(utc.getUTCMonth() + 1).padStart(2, '0')}${String(utc.getUTCDate()).padStart(2, '0')}`;

  // simple numeric hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  }
  return h >>> 0;
}

function getRandomSeed(): number {
  const rng = prand.xorshift128plus(Date.now() ^ (Math.random() * 0x100000000));
  let seed = prand.unsafeUniformIntDistribution(0, 36 ** 8 - 1, rng); // 8 characters seed
  return seed;
}

function getStoredAttempts(seed: number): ShapeCode[][] {
  // Store attempts per-seed, so switching between daily/random retains distinct histories.
  const stored = localStorage.getItem(`shaple_attempts_${seed}`);

  if (!stored)
    return [];

  const parsed = JSON.parse(stored) as Array<Array<any>>;

  if (!parsed) {
    console.error('Invalid stored attempts:', stored);
    return [];
  }

  // if numeric, then use indices
  if (parsed.every(attempt => attempt.every(index => typeof index === 'number'))) {
    return parsed.map(attempt => attempt.map(index => AllShapes[index]));
  }

  // else if string then use names (unless doesn't exist)
  if (parsed.every(attempt => attempt.every(shape => typeof shape === 'string'))) {
    return parsed.map(attempt => attempt.map(shape => AllShapes.includes(shape as ShapeCode) ? shape as ShapeCode : AllShapes[0]));
  }

  console.error('Invalid stored attempts:', stored);
  return [];
}

function setStoredAttempts(seed: number, attempts: ShapeCode[][]) {
  // convert to the raw indices so that we don't store the text
  const rawAttempts = attempts.map(attempt => attempt.map(shape => AllShapes.indexOf(shape)));
  localStorage.setItem(`shaple_attempts_${seed}`, JSON.stringify(rawAttempts));
}

function getCurrentSeed(): number {
  const hash = window?.location?.hash;

  if (hash) {
    const params = hash.substring(1).split('&');
    for (let i = 0; i < params.length; i++) {
      const param = params[i].split('=', 2);
      if (param[0] === 'seed' && param.length === 2) {
        return stringToNumber(param[1]);
      }
    }
  }

  // Fallback to the deterministic daily seed if no usable seed is present in the URL.
  return seedForDate();
}

export default function App() {
  const [seed, setSeed] = createSignal(getCurrentSeed());
  const generationResult = createMemo(() => generateShaple(MINIMUM_SHAPE_COUNT, LENGTH, seed()));
  const availableShapes = createMemo(() => generationResult().shapes);
  const solution = createMemo(() => generationResult().solution);

  const [attempts, setAttempts] = createSignal<ShapeCode[][]>(getStoredAttempts(seed()));
  const [currentGuess, setCurrentGuess] = createSignal<ShapeCode[]>([]);

  function calculateFeedback(doRuleCheck: boolean = false) : Feedback[][] {
    const feedbacks: Feedback[][] = [];
    const allAttempts = attempts();
    const sol = solution();
    const allShapes = availableShapes();

    for (let i = 0; i < allAttempts.length; i++) {
      const attempt = allAttempts[i];
      const attemptFeedback: Feedback[] = attempt.map(() => 'absent');

      const solutionShapeCounts = sol.reduce((acc, shape) => {
        acc[shape] = (acc[shape] || 0) + 1;
        return acc;
      }, {} as Record<ShapeCode, number>);

      for (let j = 0; j < attempt.length; j++) {
        if (attempt[j] === sol[j]) {
          attemptFeedback[j] = 'exact';
          solutionShapeCounts[attempt[j]]--;
        }
      }

      for (let j = 0; j < attempt.length; j++) {
        const shape = attempt[j];
        if (attemptFeedback[j] !== 'absent') continue;

        // check if invalid rule
        if (doRuleCheck && ShapeDefinitions[shape].rules.some(rule => !rule.evaluate(attempt, j, allShapes))) {
          attemptFeedback[j] = 'invalid_rule';
          continue;
        }

        if (solutionShapeCounts[shape] > 0) {
          attemptFeedback[j] = 'present';
          solutionShapeCounts[shape]--;
          
          // check if reused in a previous feedback
          if (feedbacks.some((feedback, index) => allAttempts[index][j] === shape && (feedback[j] === 'exact' || feedback[j] === 'present')))
            attemptFeedback[j] = 'invalid_reused';

          continue;
        }
      }

      feedbacks.push(attemptFeedback);
    }

    return feedbacks;
  }

  const feedbacks = createMemo<Feedback[][]>(() => calculateFeedback(false));

  const isDailySeed = createMemo(() => seed() === seedForDate());

  const isCorrect = createMemo(() => feedbacks().at(-1)?.every(f => f === 'exact'));

  // Game ends either when max attempts are used or the latest attempt is all 'exact'.
  const isDone = createMemo(() => attempts().length >= MAX_ATTEMPTS || isCorrect());

  createEffect(() => {
    // Persist attempts for the current seed whenever attempts change.
    setStoredAttempts(seed(), attempts());
  });

  // Handle URL hash changes
  createEffect(() => {
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
  });

  function setSeedAndReset(s: number) {
    var newAttempts = getStoredAttempts(s);

    batch(() => {
      setSeed(s);
      setAttempts(newAttempts);
      setCurrentGuess([]);
    });
  }

  function pickShape(s: ShapeCode) {
    if (isDone()) return;
    if (currentGuess().length >= LENGTH) return;

    setCurrentGuess([...currentGuess(), s]);
  }

  function isPotentialShape(s: ShapeCode) {
    const current = currentGuess();
    const allAttempts = attempts();
    const allFeedbacks = feedbacks();

    const countInCurrent = current.filter(shape => shape === s).length;

    for (let i = 0; i < allAttempts.length; i++) {
      const attemptAndFeedback = allAttempts[i].map((shape, index) => {
        return { shape, feedback: allFeedbacks[i][index] };
      });

      const attemptsOfShape = attemptAndFeedback.filter(item => item.shape === s);

      if (attemptsOfShape.filter(item => !isOkayFeedback(item.feedback)).length > 0 &&
        attemptsOfShape.filter(item => isOkayFeedback(item.feedback)).length <= countInCurrent) {
        return false;
      }
    }

    return true;

    function isOkayFeedback(feedback: Feedback) {
      return feedback !== 'absent';
    }
  }

  function removeLast() {
    if (isDone()) return;

    setCurrentGuess(currentGuess().slice(0, -1));
  }

  function submit() {
    if (currentGuess().length !== LENGTH) return;

    batch(() => {
      const g = currentGuess();
      setAttempts([...attempts(), g]);
      setCurrentGuess([]);
    });
  }

  function toggleDailySeed() {
    if (isDailySeed()) {
      // Switch to a random seed and encode it in the URL so puzzles are shareable/bookmarkable.
      const newSeed = getRandomSeed();
      window.location.hash = `#seed=${numberToString(newSeed)}`;
      // setSeedAndReset will be called by the hashchange handler
    } else {
      // Return to the deterministic daily seed and clear the hash.
      // Don't call setSeedAndReset here - it will be called by the hashchange handler
      window.location.hash = '';
    }
  }

  return (
    <div class="flex flex-col justify-center items-center">
      <div>
        <div class="bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-slate-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Shaple - {isDailySeed() ? 'Daily' : 'Seeded'}
            </h1>

            <span class="max-w-24 text-slate-400 text-sm bg-slate-700/50 px-2 py-1 rounded-md">
              <input class="text-right w-full select-all"
                type="text" title="Seed"
                value={numberToString(seed())}
                onChange={(v) => {
                  if (!v.target.validity.valid)
                    v.target.value = v.target.value.replace(/[^0-9A-Za-z]/g, '');
                  window.location.hash = `#seed=${v.target.value}`;
                }}
                maxLength={12}
                pattern="[0-9A-Za-z]*" />
            </span>
          </div>

          <div class="space-y-2">
            <For each={attempts()}>
              {(guess, idx) => {
                const feedbackRow = feedbacks()[idx()] || [];

                return (
                  <div class="flex gap-2 animate__animated animate__fadeIn">
                    <For each={feedbackRow}>{(feedback, j) => (
                      <div
                        class='flex-1 min-w-14 h-14 rounded-lg border-2 flex items-center justify-center font-semibold 
                                transform transition-all duration-300 hover:scale-105
                                animate__animated animate__bounceIn'
                        classList={{
                          'bg-green-600/90 border-green-400 shadow-lg shadow-green-900/30': feedback === 'exact',
                          'bg-yellow-500/90 border-yellow-400/90 shadow-lg shadow-yellow-900/30': feedback === 'present',
                          'bg-yellow-500/70 border-yellow-400/70 shadow-lg shadow-yellow-900/30': feedback === 'invalid_reused',
                          'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/70': feedback === 'absent',
                          'bg-red-700/70 border-red-400/70 shadow-lg shadow-red-900/30': feedback === 'invalid_rule',
                        }}
                        style={`animation-delay: ${j() * 50}ms`}
                      >
                        {guess[j()] ? shapeKey(guess[j()]) : ''}
                      </div>
                    )}
                    </For>
                  </div>
                );
              }}
            </For>

            <Show when={!isDone()}>
              <div class="flex gap-2">
                <For each={Array.from({ length: LENGTH })}>{(_, j) => {
                  const isEmpty = !currentGuess()[j()];
                  return (
                    <div
                      class={`flex-1 min-w-14 h-14 rounded-lg border-2 flex items-center justify-center font-semibold
                        ${isEmpty ? 'border-dashed border-slate-600/50 hover:border-slate-500/70 bg-slate-800/50' : 'border-slate-500/70 bg-slate-700/70'}
                        transform transition-all duration-300 hover:scale-105`}
                    >
                      {currentGuess()[j()] ? (
                        <div class="animate__animated animate__bounceIn">
                          {shapeKey(currentGuess()[j()])}
                        </div>
                      ) : (
                        <span class="text-slate-600">?</span>
                      )}
                    </div>
                  );
                }}</For>
              </div>
            </Show>
          </div>

          <Show when={isDone()}>
            <div class="mt-4">
              <div class="text-sm text-slate-300 font-semibold mb-2 flex items-center">
                {isCorrect() ? (
                  <span>
                    <span class="material-symbols-outlined text-yellow-400 mr-1">emoji_events</span>
                    Puzzle Solved!
                  </span>
                ) : (
                  <span>
                    <span class="material-symbols-outlined text-red-400 mr-1">emoji_events</span>
                    Solution
                  </span>
                )}
              </div>

              <div class={`flex gap-2 ${isCorrect() ? 'animate__animated animate__pulse animate__infinite' : ''}`}>
                <For each={solution()}>{(s, i) => (
                  <div
                    class={`flex-1 min-w-14 h-14 rounded-lg border-2 flex items-center justify-center font-semibold
                            bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 shadow-lg
                            transform transition-all duration-500 hover:scale-110 hover:rotate-6 hover:z-10`}
                  >
                    <div class="animate__animated animate__bounceIn">
                      {shapeKey(s)}
                    </div>
                  </div>
                )}</For>
              </div>

              <div class="mt-4">
                {(() => {
                  const [shown, setShown] = createSignal(false);
                  const text = createMemo(() => {
                    const lines = [<div>
                      <a href={window.location.href} target="_blank">Shaple</a> 
                      <span class="text-slate-400"> ({attempts().length}/{LENGTH}) </span>
                      <span class="text-slate-400"> [{numberToString(seed())}] </span>
                    </div>];

                    const feedbacks = calculateFeedback(true);
                    attempts().forEach((attempt, idx) => {
                      const feedback = feedbacks[idx];

                      const result = feedback.map((f, j) => {
                        switch (f) {
                          case 'exact':
                            return <span title="Found">🟩</span>;
                          case 'present':
                            return <span title="Present">🟨</span>;
                          case 'absent':
                            return <span title="Absent">⬛</span>;
                          case 'invalid_reused':
                            return <span title="Already guessed incorrect">🟧</span>;
                          case 'invalid_rule':
                            return <span title="Rule violation">🟥</span>;
                        }
                      });

                      lines.push(<div>{result}</div>);
                    });

                    return lines;
                  });

                  return (
                    <>
                      <Show when={!shown()}>
                        <button class="w-full h-12 rounded-lg border-2 items-center justify-center font-semibold text-sm transition-all duration-200
                                      active:scale-95 disabled:active:scale-100
                                      bg-blue-700/70 border-blue-600/50 hover:bg-blue-600/70 hover:border-blue-500/70
                                      disabled:bg-blue-900/20 disabled:border-blue-400/20 disabled:text-blue-400
                                      animate__animated animate__bounceIn"
                                      onClick={() => setShown(true)}>
                          <span class="material-symbols-outlined text-blue-400 mr-1">share</span>
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
            </div>
          </Show>
        </div>

        <div class="bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700/50 mt-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/30">
          <Show when={!isDone()}>
            <div class="mb-3 grid grid-cols-5 gap-2">
              <For each={availableShapes()}>{(s, i) => {
                const isSelected = createMemo(() => currentGuess().includes(s));
                return (
                  <button
                    onClick={() => {
                      pickShape(s);
                    }}
                    class={`flex-1 min-w-10 h-10 rounded-lg border-2 flex items-center justify-center font-semibold
                      transform transition-all duration-200 
                      active:scale-90 disabled:active:scale-100
                      bg-slate-700/70 border-slate-600/50 
                      hover:bg-slate-600/70 hover:border-slate-500/70
                      disabled:bg-neutral-900/50 disabled:border-neutral-800/50 disabled:text-neutral-600
                      animate__animated`}
                    disabled={!isPotentialShape(s)}
                  >
                    <div class={isSelected() ? 'animate__animated animate__bounceIn' : ''}>
                      {shapeKey(s)}
                    </div>
                  </button>
                );
              }}</For>
            </div>
          </Show>

          <div class="flex gap-3">
            <Show when={!isDone()}>
              <button
                onClick={() => {
                  if (currentGuess().length > 0) {
                    removeLast();
                  }
                }}
                disabled={currentGuess().length === 0}
                class={`flex-1 h-12 rounded-lg border-2 flex items-center justify-center font-semibold text-sm transition-all duration-200
                    active:scale-95 disabled:active:scale-100
                    bg-slate-700/70 border-slate-600/50 hover:bg-slate-600/70 hover:border-slate-500/70
                    disabled:bg-slate-900/20 disabled:border-slate-400/20 disabled:text-slate-400
                    animate__animated`}
              >
                <span class="material-symbols-outlined mr-1">backspace</span>
                Remove
              </button>

              <button
                onClick={submit}
                disabled={currentGuess().length !== LENGTH}
                class={`flex-1 h-12 rounded-lg border-2 flex items-center justify-center font-semibold text-sm transition-all duration-200
                    active:scale-95 disabled:active:scale-100
                    bg-blue-700/70 border-blue-600/50 hover:bg-blue-600/70 hover:border-blue-500/70
                    disabled:bg-blue-900/20 disabled:border-blue-400/20 disabled:text-blue-400
                    animate__animated`}
              >
                <span class="material-symbols-outlined mr-1">send</span>
                Submit
              </button>
            </Show>

            <button
              onClick={toggleDailySeed}
              class="flex-1 h-12 rounded-lg border-2 border-slate-600/50 flex items-center justify-center font-semibold text-sm
                     bg-slate-700/70 hover:bg-slate-600/70 hover:border-slate-500/70 active:scale-95 transition-all duration-200"
            >
              <span class="material-symbols-outlined mr-1">
                {isDailySeed() ? 'shuffle' : 'calendar_month'}
              </span>
              {isDailySeed() ? 'Random' : 'Daily'}
            </button>
          </div>
        </div>
      </div>

      <div class="max-w-4xl mt-8">
        {(() => {
          const [areRulesVisible, setRulesAreVisible] = createSignal(false);

          function parseDescription(rule: ShapeRule, shapeCode: ShapeCode) {
            const desc = rule.getDescription(shapeCode, availableShapes());

            // Replace tokens like <circle> with the corresponding icon and tooltip.
            const parts = desc.split(/(<[a-z]+>)/gi);

            return parts.map(part => {
              const match = part.match(/^<([a-z]+)>$/i);
              if (match) {
                const shapeCode = match[1] as ShapeCode;
                return (
                  <span class="font-semibold" title={ShapeDefinitions[shapeCode].displayName}>
                    {shapeKey(shapeCode)}
                  </span>
                );
              }
              return part;
            });
          }

          const shapeRules = createMemo(() => {
            const result = {} as Record<ShapeCode, ShapeRule[]>;
            const relevantShapes = availableShapes();

            for (const shape of Object.values(ShapeDefinitions)) {
              if (!relevantShapes.includes(shape.code))
                continue;

              const rules = shape.rules.filter(rule => {
                return relevantShapes.some(shape => rule.isRelevant(shape));
              });

              if (rules.length > 0)
                result[shape.code] = rules;
            }

            return result;
          });

          return (
            <>
              <button
                onClick={() => setRulesAreVisible(!areRulesVisible())}
                class="w-full px-6 h-12 rounded-lg border-2 border-slate-600/50 flex items-center justify-center font-semibold
                       bg-slate-700/70 hover:bg-slate-600/70 hover:border-slate-500/70 active:scale-95 transition-all duration-200"
              >
                <span class="material-symbols-outlined mr-2 transition-transform duration-300"
                  style={`transform: rotate(${areRulesVisible() ? '180deg' : '0'})`}>
                  expand_more
                </span>
                {areRulesVisible() ? 'Hide' : 'Show'} Help
              </button>

              <div class={`overflow-hidden transition-all duration-500 ease-in-out ${areRulesVisible() ? 'max-h-auto opacity-100' : 'max-h-0 opacity-0'}`}>
                <div class="bg-slate-800 rounded-lg shadow-lg mt-4 p-6">
                  <p class="font-semibold text-lg mb-3 text-slate-200 flex items-center">
                    <span class="material-symbols-outlined mr-2 text-blue-400">info</span>
                    Pattern Generator Rules
                  </p>
                  <ul class="list-disc list-outside pl-5 space-y-2 text-slate-300">
                    <For each={Object.keys(shapeRules())}>{(shapeCode, _) => (
                      <For each={shapeRules()[shapeCode as ShapeCode]}>{(rule, j) => (
                        <li>
                          {parseDescription(rule, shapeCode as ShapeCode)}
                        </li>
                      )}</For>
                    )}</For>
                  </ul>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <div class="max-w-4xl mt-8">
        <ShapeLoreComponent />
      </div>
    </div>
  )
}
