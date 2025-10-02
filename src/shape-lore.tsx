import { createSignal, Show, For, createMemo, createEffect } from 'solid-js';
import { AllShapes, ShapeDefinitions, ShapeCode } from './shape';

// Define the lore data structure
type ShapeLore = {
  role: string;
  summary: string;
  description: string;
};

// Map shape codes to their lore information
const shapeLoreMap: Partial<Record<ShapeCode, ShapeLore>> = {
    circle: {
        role: 'Beacon, Polarizer',
        summary: 'Rare sacred force; revered and shunned in equal measure',
        description: 'The Circle is the Beacon - a sacred, polarizing anomaly. Its presence ignites devotion and disgust alike, drawing sects while destabilizing any unity around it.'
    },
    star: {
        role: 'Celestial Seeker',
        summary: 'Solitary pilgrim of the Beacon; refuses rival sect contact',
        description: 'The Star walks alone, driven by celestial doctrine. It seeks the Beacon but rejects all alliances, considering rival sects beneath communion.'
    },
    triangle: {
        role: 'Herald / Mediator',
        summary: 'Messenger among sects; refuses alignment or chaos influence',
        description: 'The Triangle traverses factions as a neutral herald. Trusted for speech, not allegiance - it avoids all domination, especially from chaos or machinery.'
    },
    hexagon: {
        role: 'Orderly Sect',
        summary: 'Disciplined seeker of Beacon; intolerant of chaos and rivals',
        description: 'The Hexagon represents structured zeal. It seeks the Beacon under strict doctrine, refusing to coexist with chaos or competing sects.'
    },
    heart: {
        role: 'Devotional Sect',
        summary: 'Worship-bound; loyal to Beacon, rejects death',
        description: 'The Heart beats with sacred loyalty, a devotional sect bound to the Beacon's light while avoiding symbols of decay or rival influence.'
    },
    crown: {
        role: 'Authority Sect',
        summary: 'Claims leadership; shuns chaos and competing doctrines',
        description: 'The Crown declares dominion through hierarchy. It distances itself from chaos and brother-sects alike, demanding respect rather than alliance.'
    },
    lightning: {
        role: 'Storm Chaos',
        summary: 'Wild disruption; avoids Beacon entirely',
        description: 'Lightning is pure unrest - violent, untamed. It flees sacred ground instinctively, sparing no loyalty but chaos itself.'
    },
    flame: {
        role: 'Destructive Fire',
        summary: 'Banned from sacred; volatile and consuming',
        description: 'The Flame devours indiscriminately. It is barred from the Beacon and respected only through distant fear.'
    },
    cloud: {
        role: 'Mutable Sky',
        summary: 'Shifting and indirect; avoids sacred proximity',
        description: 'The Cloud never lingers where ideology hardens. Drifting between realms, it keeps respectful distance from the Beacon's gravity.'
    },
    raven: {
        role: 'Omen-Bearer',
        summary: 'Harbinger of fate; aligns with time and sky, avoids Beacon',
        description: 'The Raven delivers prophecy in restless silence. Bound to time and celestial cycles, it steers clear of the Beacon's glare.'
    },
    square: {
        role: 'Structure / Foundation',
        summary: 'Constructive yet rigid; avoids sacred influence',
        description: 'The Square builds walls against instability, but fears sacred distortion. It will fortify anything except the Beacon's reach.'
    },
    gear: {
        role: 'Machinery / Precision',
        summary: 'Rejects chaos and organic interference',
        description: 'The Gear turns with unfeeling purpose. It tolerates no disorder - mechanical purity above all.'
    },
    shield: {
        role: 'Protector',
        summary: 'Binds with machines, avoids Beacon-shunners',
        description: 'The Shield defends cause before creed. It bonds readily with machinery, but shuns those who refuse to face the Beacon at all.'
    },
    clock: {
        role: 'Timekeeper',
        summary: 'Maintains time; will not stand near chaos or flesh',
        description: 'The Clock keeps order through inevitability. It grinds onward, refusing interference from beast or storm.'
    },
    key: {
        role: 'Path / Threshold',
        summary: 'Avoids death and greed; bonded to locks',
        description: 'The Key is passage incarnate. It loathes corruption but trusts in its eternal counterpart: the Lock.'
    },
    lock: {
        role: 'Seal / Containment',
        summary: 'Controls chaos; avoids contact with Spiral',
        description: 'The Lock shuts away all that threatens balance. Its greatest enemy is the Spiral - proximity invites catastrophe.'
    },
    anchor: {
        role: 'Weight / Stillness',
        summary: 'Rare stabilizer; suppresses combinations',
        description: 'The Anchor halts motion and choice alike. Wherever it rests, variety dies and paths collapse to one.'
    },
    wave: {
        role: 'Water / Drift',
        summary: 'Rejects authority; holds to nature',
        description: 'The Wave bends to no crown. It follows the rhythms of nature alone.'
    },
    droplet: {
        role: 'Life / Nourishment',
        summary: 'Seeks leaf; flees machines and Beacon-seekers',
        description: 'The Droplet clings to growth, avoiding metallic hands or zealots who seek the Beacon.'
    },
    leaf: {
        role: 'Nature / Growth',
        summary: 'Overabundant; clusters and climbs toward light',
        description: 'The Leaf is relentless proliferation - ever reaching upward, restrained only through environmental limits.'
    },
    hive: {
        role: 'Collective',
        summary: 'Rejects celestial-industrial bridges',
        description: 'The Hive moves as one will. It resents hybrids of sky and machine, guarding its unity from cross-domain threats.'
    },
    paw: {
        role: 'Beast Loyalty',
        summary: 'Respects Beacon from afar; avoids storms',
        description: 'The Paw is faithful instinct. Its reverence is silent, but its fear of chaos absolute.'
    },
    crescent: {
        role: 'Liminal',
        summary: 'Keeps to thresholds; avoids collectives and cold sects',
        description: 'The Crescent stands between states. Neither community nor stillness may touch it.'
    },
    diamond: {
        role: 'Wealth / Symbol',
        summary: 'Adjacent to crowns and coasts; shielded from Beacon',
        description: 'The Diamond is displayed, not spent - treasured by rulers and tides, yet hidden from sacred fire.'
    },
    sun: {
        role: 'Majesty / Celestial Apex',
        summary: 'Stands distant to avoid over-activation',
        description: 'The Sun blazes too bright for close communion. Its glory mandates separation.'
    },
    hourglass: {
        role: 'Time / Inversion',
        summary: 'Touches omens; forbids machinery',
        description: 'The Hourglass binds past to future. Machines that ignore fate are cast out from its presence.'
    },
    eye: {
        role: 'Watcher',
        summary: 'Observes; maintains safe distance from keys and locks',
        description: 'The Eye records all - but will not be found near what seals or permits.'
    },
    spiral: {
        role: 'Chaos Incarnate',
        summary: 'Heavily restricted; awakens death',
        description: 'The Spiral is entropy given shape. Wherever it rests, decay follows.'
    },
    snowflake: {
        role: 'Cold / Rare',
        summary: 'Shows quiet reverence for Beacon',
        description: 'The Snowflake is purity in isolation. It honors the Beacon only from afar.'
    },
    skull: {
        role: 'Death / Outcast',
        summary: 'Shunned by life and sacred alike',
        description: 'The Skull is what remains when all else has left. None seek it - save the Spiral.'
    }
};
  

// Sort shapes alphabetically by display name for the selector
const sortedShapes = [...AllShapes].sort((a, b) => 
  ShapeDefinitions[a].displayName.localeCompare(ShapeDefinitions[b].displayName)
);

function ShapeLoreDetail(shape: ShapeCode) {
  const def = ShapeDefinitions[shape];
  const lore = shapeLoreMap[shape];
  
  return (
    <div>
      <div class="flex items-center gap-3 mb-4">
        <span class="material-symbols-outlined text-4xl text-blue-400">{def.icon_name}</span>
        <h3 class="text-xl font-bold text-slate-100">{def.displayName}</h3>
      </div>
      
      {lore ? (
        <div class="space-y-4">
          <div>
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Role</h4>
            <p class="text-slate-200">{lore.role}</p>
          </div>
          
          <div>
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Summary</h4>
            <p class="text-slate-200">{lore.summary}</p>
          </div>
          
          <div>
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</h4>
            <p class="text-slate-200">{lore.description}</p>
          </div>
        </div>
      ) : (
        <div class="text-slate-400 italic">
          <p>No lore available for this shape.</p>
        </div>
      )}
    </div>
  );
}

export function ShapeLoreComponent() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedShape, setSelectedShape] = createSignal<ShapeCode | null>(null);
  
  // Handle shape selection
  const selectShape = (shape: ShapeCode) => {
    setSelectedShape(selectedShape() === shape ? null : shape);
  };

  return (
    <>
      <button 
        class="w-full px-6 h-12 rounded-lg border-2 border-slate-600/50 flex items-center justify-center font-semibold
            bg-slate-700/70 hover:bg-slate-600/70 hover:border-slate-500/70 active:scale-95 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen())}
        aria-expanded={isOpen()}
        aria-controls="lore-panel"
      >
        <span class="material-symbols-outlined">{isOpen() ? 'expand_less' : 'expand_more'}</span>
        {isOpen() ? 'Hide Shaple Lore' : 'Show Shaple Lore'}
      </button>

      <Show when={isOpen()}>
        <div id="lore-panel" class="mt-3 bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-700/50">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="w-full md:w-64 flex-shrink-0">
              <div class="mt-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-slate-800/50 rounded">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2">
                  <For each={sortedShapes}>
                    {(shape) => {
                      const def = ShapeDefinitions[shape];
                      const isSelected = createMemo(() => selectedShape() === shape);
                      return (
                        <button
                          onClick={() => selectShape(shape)}
                          aria-label={`Select ${def.displayName}`}
                          class={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                            isSelected() 
                              ? 'bg-blue-600/80 text-white scale-[1.02] shadow-md' 
                              : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 hover:scale-[1.02]'
                          }`}
                        >
                          <span class="material-symbols-outlined text-xl">{def.icon_name}</span>
                          <span class="truncate">{def.displayName}</span>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </div>
            </div>

            <div class="flex-1 bg-slate-900/30 rounded-lg p-6 min-h-64 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-slate-800/50">
              <Show when={selectedShape()}>
                {ShapeLoreDetail(selectedShape()!)}
              </Show>
              <Show when={!selectedShape()}>
              <div class="p-4">
                  <h3 class="text-xl font-bold text-slate-200 mb-4 text-center">The Realm of Shapes</h3>
                  <div class="text-slate-300 mb-6 max-w-2xl text-justify">
                    <p class="mb-4">
                        At the center of the fractured realm stands <span class="material-symbols-outlined">{ShapeDefinitions.circle.icon_name}</span>, the Beacon, a rare and radiantly unstable locus of sacred power. Around it, sects gather like moths to flame-<span class="material-symbols-outlined">{ShapeDefinitions.star.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.hexagon.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.heart.icon_name}</span>, and <span class="material-symbols-outlined">{ShapeDefinitions.crown.icon_name}</span>-each devoted yet mutually venomous, enforcing rivalries across invisible distances with rituals of spacing that no casual observer could fathom.
                    </p>

                    <p class="mb-4">
                        <span class="material-symbols-outlined">{ShapeDefinitions.triangle.icon_name}</span>, the Herald, threads through these rivalries, announcing messages and decrees, yet it neither claims allegiance nor succumbs to the siren call of chaos or machinery. High above, the chaotic elements-<span class="material-symbols-outlined">{ShapeDefinitions.lightning.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.flame.icon_name}</span>, and <span class="material-symbols-outlined">{ShapeDefinitions.spiral.icon_name}</span>-rage and twist, ever repelled by the Beacon's radiant insistence, leaving scorched air and impossible rotations in their wake.
                    </p>

                    <p class="mb-4">
                        The mutable skies and waters-<span class="material-symbols-outlined">{ShapeDefinitions.cloud.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.wave.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.droplet.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.leaf.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.paw.icon_name}</span>-cluster in erratic patterns, following tribal edicts and secret pacts with hidden currents and roots, honoring the Beacon's gravity only as far as prudence allows. Some beasts bow at distance; others leap in defiance, scattering water, leaf, and shadow.
                    </p>

                    <p class="mb-4">
                        Industrial forms-<span class="material-symbols-outlined">{ShapeDefinitions.square.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.gear.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.shield.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.clock.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.lock.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.key.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.anchor.icon_name}</span>-weave lattices of restriction and stability, enforcing mechanical laws that sometimes contradict natural instinct. These lattices creak under the weight of unseen edicts, bending reality along rules known only to themselves, creating corridors, dead-ends, and forbidden couplings where none could naturally exist.
                    </p>

                    <p class="mb-4">
                        Celestial and symbolic actors-<span class="material-symbols-outlined">{ShapeDefinitions.crescent.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.diamond.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.sun.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.hourglass.icon_name}</span>, <span class="material-symbols-outlined">{ShapeDefinitions.eye.icon_name}</span>-mark cycles, wealth, observation, and the passage of impossible time. They intervene in patterns invisible to mortal eyes, nudging nature, chaos, and sectarian zeal, maintaining a delicate lattice of influence that only the most devout scholars of absurdity could chart.
                    </p>

                    <p class="mb-4">
                        The <span class="material-symbols-outlined">{ShapeDefinitions.skull.icon_name}</span>, cursed and dead, hover on the periphery, universally shunned but entwined with the Spiral, whispering secrets of decay and chaos into cracks in reality itself. In this world, alliances, distances, and adjacency dictate fate more than loyalty or reason; every placement is a story, every empty space a consequence, and every absurd juxtaposition a reminder that the rules of geometry are also the rules of belief.
                    </p>
                  </div>
                </div>
              </Show>
            </div>
          </div>
          
          <div class="mt-4 pt-3 border-t border-slate-700/50 text-sm text-slate-400 text-center">
            <p>Explore the rich lore behind each shape in the realm of Shaple.</p>
          </div>
        </div>
      </Show>
    </>
  );
}
