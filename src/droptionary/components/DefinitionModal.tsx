import { createSignal, Show, onCleanup, createEffect, createMemo, For, onMount } from 'solid-js';

interface DefinitionModalProps {
  word: string;
  isOpen: boolean;
  onClose: () => void;
}

type DictionaryApiPhonetic = {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

type DictionaryApiDefinition = {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

type DictionaryApiMeaning = {
  partOfSpeech: string;
  definitions: DictionaryApiDefinition[];
}

export type DictionaryApiEntry = {
  //word: string;
  //phonetic?: string;
  phonetics?: DictionaryApiPhonetic[];
  origin?: string;
  meanings: DictionaryApiMeaning[];
  sourceUrls?: string[];
  iframe?: string;
}

// The full response is an array of these entries
export type DictionaryApiResponse = DictionaryApiEntry[];

export default function DefinitionModal(props: DefinitionModalProps) {
  const [definition, setDefinition] = createSignal<DictionaryApiResponse | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  // have to use memos so that we can react to them changing
  // really dumb but that's how solid works
  const word = createMemo(() => props.word);
  const isOpen = createMemo(() => props.isOpen);
  const onClose = props.onClose;

  // Handle escape key to close modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen()) return;
    if (e.key.toLowerCase() === 'escape') {
      onClose();
    }
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Fetch definition when word changes and modal opens
  createEffect(() => {
    if (word() && isOpen()) {
      fetchDefinition(word());
    } else {
      setDefinition(null);
      setIsLoading(false);
    }

    // Add/remove event listener for escape key
    document.removeEventListener('keydown', handleKeyDown);

    if (isOpen()) {
      document.addEventListener('keydown', handleKeyDown);

      onCleanup(() => {
        document.removeEventListener('keydown', handleKeyDown);
      });
    }
  });

  async function fetchFromDictionaryApi(term: string): Promise<DictionaryApiResponse> {
    const req = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${term}`);

    if (!req.ok) {
      throw new Error('Failed to fetch definition');
    }

    const defList = await req.json();
    return defList;
  }

  async function fetchFromWiktionary(term: string): Promise<DictionaryApiResponse> {
    // this could be so much more, but it's not worth it, the format is almost always wrong
    return [{ 
      phonetics: [], 
      origin: undefined, 
      meanings: [],
      sourceUrls: ["https://en.wiktionary.org/wiki/" + term.toLowerCase()],
      iframe: "https://en.wiktionary.org/wiki/" + term.toLowerCase()
    }];
  }

  async function fetchDefinition(wordToFetch: string) {
    if (!wordToFetch) {
      setDefinition(null);
      return;
    }

    wordToFetch = wordToFetch.toLowerCase();

    setIsLoading(true);
    setDefinition(null);

    try {
      setDefinition(await fetchFromDictionaryApi(wordToFetch));
    } catch (error) {
      try {
        setDefinition(await fetchFromWiktionary(wordToFetch));
      } catch (error) {
        setDefinition(null);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <Show when={isOpen()}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div
          class="flex flex-col bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-700/50 rounded-xl 
                 shadow-2xl max-w-7xl w-full mx-4 max-h-[80vh] overflow-hidden"
          style="z-index: 10000; background-color: rgb(30, 41, 59);"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span class="material-icon text-blue-400 text-lg">info</span>
              </div>
              <h2 class="text-xl font-bold text-white capitalize">{word()}</h2>
            </div>
            <button
              class="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/50 rounded-full flex items-center justify-center transition-colors duration-200"
              onClick={onClose}
            >
              <span class="material-icon text-gray-400 hover:text-white text-lg">close</span>
            </button>
          </div>

          {/* Content */}
          <div class="grow-1 overflow-y-auto">
            <Show when={isLoading()}>
              <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span class="ml-3 text-gray-400">Loading definition...</span>
              </div>
            </Show>

            <Show when={!isLoading() && definition() && definition()!.length > 0}>
              <div class="prose prose-invert max-w-none">
                <div class="space-y-6">
                  <For each={definition()!}>{(def) => (
                    <>
                      <Show when={!def.iframe}>
                        <div class="m-6 space-y-6 border-t border-gray-700/50 nth-1:border-none">
                          <Show when={def.origin}>
                            <div class="border-b border-gray-700/50 pb-4">
                              <div class="flex flex-col space-y-2">
                                  <p class="text-sm text-blue-300 italic">Origin: {def.origin}</p>
                              </div>
                            </div>
                          </Show>

                          {/* Meanings */}
                          <For each={def.meanings}>{(meaning) => (
                            <div class="space-y-4">
                              <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <h4 class="text-lg font-semibold text-blue-300 capitalize">
                                  {meaning.partOfSpeech}
                                </h4>
                              </div>

                              <div class="space-y-4 pl-4">
                                <For each={meaning.definitions}>{(definitionItem, index) => (
                                  <div class="border-l-2 border-gray-700/50 pl-4 space-y-3">
                                    <div class="flex items-start space-x-2">
                                      <span class="text-blue-400 font-bold text-sm w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {index() + 1}
                                      </span>
                                      <p class="text-gray-200 leading-relaxed flex-1">
                                        {definitionItem.definition}
                                      </p>
                                    </div>

                                    <Show when={definitionItem.example}>
                                      <div class="ml-8 p-3 bg-gray-800/20 rounded-lg border-l-4 border-green-400/50">
                                        <p class="text-green-300 italic text-sm">
                                          "{definitionItem.example}"
                                        </p>
                                      </div>
                                    </Show>

                                    <Show when={definitionItem.synonyms && definitionItem.synonyms.length > 0}>
                                      <div class="ml-8 flex flex-wrap gap-1">
                                        <span class="text-xs text-purple-300 font-medium">Synonyms:</span>
                                        <For each={definitionItem.synonyms}>{(synonym) => (
                                          <span class="text-xs bg-purple-400/20 text-purple-300 px-2 py-1 rounded-full">
                                            {synonym}
                                          </span>
                                        )}</For>
                                      </div>
                                    </Show>

                                    <Show when={definitionItem.antonyms && definitionItem.antonyms.length > 0}>
                                      <div class="ml-8 flex flex-wrap gap-1">
                                        <span class="text-xs text-orange-300 font-medium">Antonyms:</span>
                                        <For each={definitionItem.antonyms}>{(antonym) => (
                                          <span class="text-xs bg-orange-400/20 text-orange-300 px-2 py-1 rounded-full">
                                            {antonym}
                                          </span>
                                        )}</For>
                                      </div>
                                    </Show>
                                  </div>
                                )}</For>
                              </div>
                            </div>
                          )}</For>
                          
                          {/* Phonetics */}
                          <Show when={def.phonetics && def.phonetics.length > 0}>
                            <div class="space-y-2">
                              <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Pronunciation</h4>
                              <div class="space-y-2">
                                <For each={def.phonetics}>{(phonetic) => (
                                  <div class="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
                                    <Show when={phonetic.text}>
                                      <span class="text-gray-200 font-mono">{phonetic.text}</span>
                                    </Show>
                                    <Show when={phonetic.audio}>
                                      <button
                                        class="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded"
                                        onClick={() => {
                                          const audio = new Audio(phonetic.audio);
                                          audio.play().catch(e => console.log('Audio play failed:', e));
                                        }}
                                        title="Play pronunciation"
                                      >
                                        <span class="material-icon text-lg">volume_up</span>
                                      </button>
                                    </Show>
                                    <Show when={phonetic.sourceUrl}>
                                      <a
                                        href={phonetic.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                                      >
                                        Source
                                      </a>
                                    </Show>
                                  </div>
                                )}</For>
                              </div>
                            </div>
                          </Show>

                          {/* Source URLs */}
                          <Show when={def.sourceUrls && def.sourceUrls.length > 0}>
                            <div class="border-t border-gray-700/50 pt-4">
                              <div class="space-y-1">
                                <h5 class="text-xs font-medium text-gray-400 uppercase tracking-wide">Sources</h5>
                                <For each={def.sourceUrls}>{(url) => (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="block text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
                                  >
                                    {url}
                                  </a>
                                )}</For>
                              </div>
                            </div>
                          </Show>
                        </div>
                      </Show>
                      <Show when={def.iframe}>
                        {(() => {
                          const [loading, setLoading] = createSignal(true);
                          let iframe!: HTMLIFrameElement;

                          onMount(() => {
                            iframe.onload = () => {
                              setLoading(false);
                            };
                          });

                          return (
                            <div class="relative">
                              <Show when={loading()}>
                                <div class="absolute inset-0 flex items-center justify-center">
                                  <div class="rounded-full size-16 animate-spin border-4 border-dashed border-gray-700"></div>
                                </div>
                              </Show>
                              <iframe ref={iframe} src={def.iframe} class="w-full min-h-64 h-[calc(80vh-10rem)] border-0" />
                            </div>
                          )
                        })()}
                      </Show>
                    </>
                  )}</For>
                </div>
              </div>
            </Show>

            <Show when={!isLoading() && (!definition() || definition()?.length === 0)}>
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="material-icon text-gray-400 text-2xl">error</span>
                </div>
                <p class="text-gray-400">Definition not found for "{word()}"</p>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
