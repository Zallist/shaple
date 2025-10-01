import prand from 'pure-rand';
import { ShapeCode, AllShapes, ShapeDefinitions } from './shape';
import * as shapeRules from './shape-rules';

// Append rules for this generator

// === LORE-ALIGNED RULES ===
// Beacon (Circle) polarizes the world. Circle is rare, sacred; several sects seek it but they hate one another.
// Seekers are mutually hostile within adjacency and within distance 2. Avoiders must remain distance 2 away.

// Circle: Beacon, sacred and polarizing.
ShapeDefinitions.circle.rules = [
    new shapeRules.IsNotAdjacentTo(['square', 'skull']),
    new shapeRules.IsDistanceTo(['star', 'hexagon', 'heart', 'crown'], 2),
    new shapeRules.IsNotDistanceTo(['lightning', 'flame', 'cloud', 'raven'], 2),
];

// --- SECTARIAN SEEKERS: they require Circle but hate other seeker-sects ---
// Star: Celestial sect. Seeks Circle; refuses nearby other seekers and their symbols.
// Star must not be adjacent to its own kind (solitary) and must avoid other seeker-sects at distance 2.
ShapeDefinitions.star.rules = [
    new shapeRules.IsNotAdjacentTo('star'),
    new shapeRules.IsAdjacentTo(['triangle', 'heart', 'crown']),
    new shapeRules.IsDistanceTo('circle', 2),
    new shapeRules.IsNotDistanceTo(['hexagon', 'heart', 'crown'], 2),
    new shapeRules.IsNotDistanceTo('raven', 2),
];

// Triangle: Herald of sects. Must serve but never dominate.
ShapeDefinitions.triangle.rules = [
    new shapeRules.IsAdjacentTo(['star', 'hive', 'heart']),
    new shapeRules.IsNotAdjacentTo('circle'),
    new shapeRules.IsNotAdjacentTo(['lightning', 'gear', 'square']),
    new shapeRules.IsDistanceTo('crown', 2),
    new shapeRules.IsNotDistanceTo(['hexagon', 'paw'], 2),
];

// Hexagon: Orderly sect. Seeks Circle; refuses other seeker sects and chaotic elements.
ShapeDefinitions.hexagon.rules = [
    new shapeRules.IsAdjacentTo(['gear', 'hive']),
    new shapeRules.IsDistanceTo('circle', 2),
    new shapeRules.IsNotAdjacentTo('lightning'),
    new shapeRules.IsNotDistanceTo(['star', 'heart', 'crown'], 2),
];

// Heart: Devotional sect. Seeks Circle; strongly rejects death and opposing sect members nearby.
ShapeDefinitions.heart.rules = [
    new shapeRules.IsAdjacentTo(['star', 'crown', 'paw']),
    new shapeRules.IsDistanceTo('circle', 2),
    new shapeRules.IsNotAdjacentTo('skull'),
    new shapeRules.IsNotDistanceTo(['star', 'hexagon', 'crown'], 2),
];

// Crown: Authority sect. Seeks Circle; demands ritual distance from rival seekers and chaos.
ShapeDefinitions.crown.rules = [
    new shapeRules.IsAdjacentTo(['heart', 'star', 'diamond']),
    new shapeRules.IsDistanceTo('circle', 2),
    new shapeRules.IsNotAdjacentTo(['skull', 'spiral']),
    new shapeRules.IsNotDistanceTo(['star', 'hexagon', 'heart'], 2),
    new shapeRules.IsNotDistanceTo('wave', 2), // crown resents being near uncontrolled seas
];

// --- BEACON AVOIDERS: fear or are corrupted by Circle (must remain distance 2) ---
// Lightning: Storm chaos. Avoids Circle (distance), shunned by many.
ShapeDefinitions.lightning.rules = [
    new shapeRules.IsAdjacentTo(['cloud', 'wave']),
    new shapeRules.IsNotAdjacentTo(['triangle', 'hexagon', 'leaf', 'sun']),
    new shapeRules.IsNotDistanceTo('circle', 2), // must be at least 3 away
];

// Flame: Consuming natural fire. Actively excluded from Circle's proximity.
ShapeDefinitions.flame.rules = [
    new shapeRules.IsAdjacentTo(['triangle', 'wave']),
    new shapeRules.IsNotAdjacentTo(['snowflake', 'droplet', 'leaf']),
    new shapeRules.IsNotDistanceTo('circle', 2),
    new shapeRules.IsNotAdjacentTo(['lightning', 'cloud']),
];

// Cloud: Mutable sky. Avoids Circle; limited adjacency with omen-forms.
ShapeDefinitions.cloud.rules = [
    new shapeRules.IsAdjacentTo(['wave', 'lightning', 'droplet']),
    new shapeRules.IsNotAdjacentTo(['flame', 'raven']),
    new shapeRules.IsNotDistanceTo('circle', 2),
];

// Raven: Omens. Avoids Circle's sacred light; aligns with hourglass and sun but shuns seekers.
ShapeDefinitions.raven.rules = [
    new shapeRules.IsAdjacentTo(['sun', 'crescent', 'hourglass']),
    new shapeRules.IsNotAdjacentTo(['flame', 'snowflake', 'cloud', 'skull']),
    new shapeRules.IsNotDistanceTo('circle', 2),
];

// --- STRUCTURE / CONSTRUCTIVE FACTION ---
// Square: Structural, highly restrictive; hates circle adjacency but tolerates mechanical allies.
ShapeDefinitions.square.rules = [
    new shapeRules.IsNotAdjacentTo(['circle', 'spiral', 'lightning', 'cloud', 'leaf']),
    new shapeRules.IsAdjacentTo(['gear', 'shield']),
    new shapeRules.IsDistanceTo('anchor', 2),
];

// Gear: Machinery. Requires precise adjacency, rejects chaotic and organic intrusions.
ShapeDefinitions.gear.rules = [
    new shapeRules.IsAdjacentTo(['clock', 'hexagon', 'shield']),
    new shapeRules.IsNotAdjacentTo(['flame', 'spiral']),
    new shapeRules.IsNotDistanceTo('wave', 2),
    new shapeRules.IsNotDistanceTo('hive', 2)
];

// Shield: Protector. Binds with gear/key/lock, refuses watchers and decay.
ShapeDefinitions.shield.rules = [
    new shapeRules.IsAdjacentTo(['gear', 'key', 'lock']),
    new shapeRules.IsNotAdjacentTo(['skull', 'eye']),
    new shapeRules.IsDistanceTo('square', 2),
    new shapeRules.IsNotDistanceTo(['lightning', 'cloud'], 2)
];

// Clock: Timekeeping machinery. Tied to gear/lightning; enforces distance vs organic.
ShapeDefinitions.clock.rules = [
    new shapeRules.IsAdjacentTo(['gear', 'lightning']),
    new shapeRules.IsNotAdjacentTo(['leaf', 'flame']),
    new shapeRules.IsDistanceTo('hourglass', 2),
    new shapeRules.IsNotDistanceTo('hive', 2),
];

// Key: Passage enabler. Ally to lock/shield; avoids greed (diamond) and death.
ShapeDefinitions.key.rules = [
    new shapeRules.IsAdjacentTo(['lock', 'shield']),
    new shapeRules.IsNotAdjacentTo(['skull', 'diamond']),
    new shapeRules.IsDistanceTo('eye', 2),
];

// Lock: Sealer. Bonds with key/shield; resents chaos and proximity to Spiral.
ShapeDefinitions.lock.rules = [
    new shapeRules.IsAdjacentTo(['key', 'shield']),
    new shapeRules.IsNotAdjacentTo(['skull', 'spiral']),
    new shapeRules.IsDistanceTo('hourglass', 2),
];

// Anchor: Weight of sea and machine; less common, distance-limits to reduce combinations.
ShapeDefinitions.anchor.rules = [
    new shapeRules.IsAdjacentTo(['wave', 'cloud', 'gear']),
    new shapeRules.IsNotAdjacentTo(['flame', 'skull']),
    new shapeRules.IsDistanceTo('diamond', 2),
];

// --- NATURE / WATER TRIBE ---
// Wave: Overrepresented previously; force a side: aquatic but must avoid some celestial/industrial nodes.
ShapeDefinitions.wave.rules = [
    new shapeRules.IsAdjacentTo(['diamond', 'droplet', 'cloud']),
    new shapeRules.IsNotAdjacentTo('skull'),
    new shapeRules.IsNotAdjacentTo(['crown', 'gear']), // avoids overt authority and machinery
    new shapeRules.IsDistanceTo('leaf', 2),
    new shapeRules.IsNotDistanceTo(['crown', 'heart'], 2),
];

// Droplet: Life-giving but now constrained — must be near leaf yet distant from certain machines.
ShapeDefinitions.droplet.rules = [
    new shapeRules.IsAdjacentTo(['leaf', 'wave', 'cloud', 'paw']),
    new shapeRules.IsNotAdjacentTo(['flame', 'skull']),
    new shapeRules.IsNotDistanceTo('clock', 2), // cannot be more than 2 away from clock (ties water to time)
    new shapeRules.IsNotDistanceTo(['star', 'crown'], 2),
];

// Leaf: Over-popular; force it into nature cluster with stricter avoids and a distance.
ShapeDefinitions.leaf.rules = [
    new shapeRules.IsAdjacentTo(['droplet', 'wave', 'hive', 'paw']),
    new shapeRules.IsNotAdjacentTo(['lightning', 'square']),
    new shapeRules.IsDistanceTo('sun', 2), // seeks sunlight at distance
    new shapeRules.IsNotDistanceTo(['star', 'crown'], 2),
];

// Hive: Collective; reduce bridging by forbidding certain celestial ties and adding distance rules.
ShapeDefinitions.hive.rules = [
    new shapeRules.IsAdjacentTo(['triangle', 'star', 'leaf']),
    new shapeRules.IsNotAdjacentTo(['crescent', 'square']),
    new shapeRules.IsNotDistanceTo('crown', 2),
    new shapeRules.IsNotDistanceTo(['wave', 'cloud'], 2),
];

// Paw: Beast loyalty; constrained adjacency and forced distance from Beacon-avoiders.
ShapeDefinitions.paw.rules = [
    new shapeRules.IsAdjacentTo(['leaf', 'heart', 'raven', 'droplet']),
    new shapeRules.IsNotAdjacentTo(['skull', 'lightning']),
    new shapeRules.IsDistanceTo('circle', 2), // some beasts revere the Beacon at distance
    new shapeRules.IsNotDistanceTo(['lightning', 'cloud'], 2),
];

// --- SYMBOLIC & CELESTIAL ---
// Crescent: Liminal; keeps distance from massed collectives and cold sects.
ShapeDefinitions.crescent.rules = [
    new shapeRules.IsAdjacentTo(['raven', 'star']),
    new shapeRules.IsNotAdjacentTo(['hive', 'snowflake']),
    new shapeRules.IsDistanceTo('diamond', 2),
];

// Diamond: Hard wealth; fewer placements: adjacent to crown/sea, but kept away from Beacon physically.
ShapeDefinitions.diamond.rules = [
    new shapeRules.IsAdjacentTo(['wave', 'crescent', 'crown']),
    new shapeRules.IsNotAdjacentTo(['circle', 'spiral']),
    new shapeRules.IsDistanceTo('anchor', 2),
];

// Sun: Majestic, keeps certain distances to preserve rarity and reduce combinatorics.
ShapeDefinitions.sun.rules = [
    new shapeRules.IsAdjacentTo(['hourglass', 'raven', 'crown']),
    new shapeRules.IsNotAdjacentTo(['snowflake', 'flame']),
    new shapeRules.IsDistanceTo('star', 2),
];

// Hourglass: Time binds; adjacency with omen, disallows machine intimacy.
ShapeDefinitions.hourglass.rules = [
    new shapeRules.IsAdjacentTo(['raven', 'sun']),
    new shapeRules.IsNotAdjacentTo(['gear', 'spiral']),
    new shapeRules.IsDistanceTo('circle', 2),
];

// Eye: Watcher; adjacency constrained, enforces distance from lock/key to reduce combos.
ShapeDefinitions.eye.rules = [
    new shapeRules.IsAdjacentTo(['star', 'triangle']),
    new shapeRules.IsNotAdjacentTo(['skull', 'shield']),
    new shapeRules.IsDistanceTo('key', 2),
];

// --- CHAOS / SPIRAL & RELATED ---
// Spiral: Chaos agent; previously tolerated widely — now restricted heavily to collapse permutations.
ShapeDefinitions.spiral.rules = [
    new shapeRules.IsNotAdjacentTo(['square', 'gear', 'crown', 'lock', 'diamond', 'flame']),
    new shapeRules.IsNotDistanceTo(['heart', 'circle'], 2), // must avoid being near certain sacred things
    new shapeRules.IsDistanceTo('skull', 2), // spirals stir death at range
];

// --- COLD / WINTER ---
// Snowflake: Rare and cold; keep it rare via adjacency constraints and distances.
ShapeDefinitions.snowflake.rules = [
    new shapeRules.IsAdjacentTo(['crescent', 'gear']),
    new shapeRules.IsNotAdjacentTo(['flame', 'sun', 'lightning', 'raven']),
    new shapeRules.IsDistanceTo('circle', 2), // reveres Beacon only conservatively
];

// --- CURSED / DEATH ---
// Skull: Outcast. Widely shunned, must remain distant from living, anchor, and seals.
ShapeDefinitions.skull.rules = [
    new shapeRules.IsNotAdjacentTo([
        'circle', 'heart', 'crown', 'raven', 'droplet', 'wave', 'anchor', 'key', 'lock', 'shield'
    ]),
    new shapeRules.IsDistanceTo('spiral', 2),
];

// --- MISCELLANEOUS ADJUSTMENTS ---
// Raven: omen, but kept away from Circle and many warm things to keep combinatorics down.
ShapeDefinitions.raven.rules = [
    new shapeRules.IsAdjacentTo(['sun', 'crescent', 'hourglass']),
    new shapeRules.IsNotAdjacentTo(['flame', 'snowflake', 'cloud', 'skull']),
    new shapeRules.IsNotDistanceTo('circle', 2),
    new shapeRules.IsDistanceTo('triangle', 2),
];

// Heart / Crown / Star mutual-sect hostility already enforced above; reduce cross-compatibility elsewhere.
// Heart: devotional; keep it rarer by adding distance constraints and forbidding certain allies from co-placing.
ShapeDefinitions.heart.rules = [
    new shapeRules.IsAdjacentTo(['star', 'crown', 'paw']),
    new shapeRules.IsDistanceTo('circle', 2),
    new shapeRules.IsNotDistanceTo(['hexagon', 'star'], 2),
    new shapeRules.IsNotAdjacentTo('skull'),
];

export function isShapleValid(shapes: Array<ShapeCode>): boolean {
    for (let i = 0; i < shapes.length; i++) {
        const shapeDef = ShapeDefinitions[shapes[i]];
        for (const rule of shapeDef.rules) {
            if (!rule.evaluate(shapes, i)) {
                return false;
            }
        }
    }

    return true;
}

export function generateShaple(length: number, seed: number): Array<ShapeCode> {
    const result = Array<ShapeCode>(length);

    let shapeIndex: number;
    let rng = prand.xorshift128plus(seed);
    let attempts = 20000;
    
    // Limit the total number of attempts to avoid infinite loops in case of unsolvable puzzles.
    // Should only happen during dev if the rules are messed up
    while (attempts-- > 0) {
        for (let i = 0; i < length; i++) {
            [shapeIndex, rng] = prand.uniformIntDistribution(0, AllShapes.length - 1, rng);
            result[i] = AllShapes[shapeIndex];
        }

        if (attempts % 1000 === 0) {
            console.log(`${attempts} tried and still no luck, seed: ${seed}`);
        }

        if (isShapleValid(result)) return result;
    }

    throw new Error("Failed to generate shaple");
};

(window as any).generateShaple = generateShaple;

(window as any).validateShaple = function(length: number, shapes: ShapeCode[] = AllShapes) {
    const result = Array<ShapeCode>(length);
    const validShaples = new Set<Array<ShapeCode>>();

    validate(0);

    console.log(`Found ${validShaples.size} valid shaples`);

    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];

        let shaplesContainingShape = 0;
        let totalShapeCount = 0;

        for (const validShaple of validShaples) {
            const shapeCount = validShaple.filter(s => s === shape).length;
            totalShapeCount += shapeCount;
            if (shapeCount > 0)    
                shaplesContainingShape++;
        }

        console.log(`Shape ${shape} appears in ${shaplesContainingShape} shaples, ${totalShapeCount} times total`);
    }

    function validate(index: number) {
        if (index >= length) {
            if (isShapleValid(result)) {
                validShaples.add([...result]);
            }
            return;
        }
        
        for (let i = 0; i < shapes.length; i++) {
            result[index] = shapes[i];
            validate(index + 1);
        }
    }
}