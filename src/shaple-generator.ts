import prand from 'pure-rand';
import { ShapeCode, AllShapes, ShapeDefinitions } from './shape';
import * as shapeRules from './shape-rules';

// Append rules for this generator
ShapeDefinitions.circle.rules = [
    new shapeRules.IsNotAdjacentTo('square'),
    new shapeRules.IsAdjacentTo('hexagon'),
    new shapeRules.IsNotDistanceTo('diamond', 2),
    new shapeRules.IsDistanceTo('star', 2, true),
    new shapeRules.IsNotAdjacentTo('skull'),
];

ShapeDefinitions.square.rules = [
    new shapeRules.IsNotAdjacentTo(['circle', 'spiral', 'lightning', 'cloud']),
    new shapeRules.IsDistanceTo(['triangle', 'clock'], 2, true),
    new shapeRules.IsNotDistanceTo('hive', 2),
];

ShapeDefinitions.triangle.rules = [
    new shapeRules.IsAdjacentTo(['star', 'hive']),
    new shapeRules.IsNotAdjacentTo('lightning'),
    new shapeRules.IsDistanceTo('flame', 2, true),
    new shapeRules.IsNotDistanceTo('gear', 2),
];

ShapeDefinitions.star.rules = [
    new shapeRules.IsNotAdjacentTo('star'),
    new shapeRules.IsAdjacentTo(['triangle', 'heart']),
    new shapeRules.IsNotDistanceTo('raven', 2),
    new shapeRules.IsDistanceTo('crown', 2, true),
];

ShapeDefinitions.hexagon.rules = [
    new shapeRules.IsAdjacentTo('circle'),
    new shapeRules.IsNotAdjacentTo('lightning'),
    new shapeRules.IsDistanceTo(['gear', 'clock'], 2, true),
    new shapeRules.IsNotDistanceTo('anchor', 2),
];

ShapeDefinitions.lightning.rules = [
    new shapeRules.IsNotAdjacentTo(['triangle', 'hexagon', 'spiral', 'leaf']),
    new shapeRules.IsDistanceTo('wave', 2, true),
    new shapeRules.IsNotAdjacentTo('sun'),
    new shapeRules.IsNotDistanceTo('hourglass', 2),
];

ShapeDefinitions.crescent.rules = [
    new shapeRules.IsNotAdjacentTo('hive'),
    new shapeRules.IsDistanceTo('diamond', 2, true),
    new shapeRules.IsNotDistanceTo('star', 2),
    new shapeRules.IsAdjacentTo('raven'),
];

ShapeDefinitions.diamond.rules = [
    new shapeRules.IsAdjacentTo(['wave', 'crescent']),
    new shapeRules.IsNotDistanceTo('circle', 2),
    new shapeRules.IsNotAdjacentTo('spiral'),
    new shapeRules.IsDistanceTo('key', 2, true),
];

ShapeDefinitions.hive.rules = [
    new shapeRules.IsAdjacentTo(['triangle', 'star']),
    new shapeRules.IsNotAdjacentTo('crescent'),
    new shapeRules.IsNotDistanceTo('square', 2),
    new shapeRules.IsDistanceTo('leaf', 2, true),
];

ShapeDefinitions.wave.rules = [
    new shapeRules.IsNotAdjacentTo('lightning'),
    new shapeRules.IsAdjacentTo('diamond'),
    new shapeRules.IsNotDistanceTo('clock', 2),
    new shapeRules.IsDistanceTo(['droplet', 'cloud'], 2, true),
];

ShapeDefinitions.gear.rules = [
    new shapeRules.IsAdjacentTo(['clock', 'hexagon']),
    new shapeRules.IsNotDistanceTo('wave', 2),
    new shapeRules.IsNotAdjacentTo('crown'),
    new shapeRules.IsDistanceTo('spiral', 2, true),
];

ShapeDefinitions.heart.rules = [
    new shapeRules.IsNotAdjacentTo('skull'),
    new shapeRules.IsAdjacentTo(['crown', 'star']),
    new shapeRules.IsNotDistanceTo('anchor', 2),
    new shapeRules.IsDistanceTo('paw', 2, true),
];

ShapeDefinitions.flame.rules = [
    new shapeRules.IsNotAdjacentTo(['snowflake', 'droplet', 'leaf']),
    new shapeRules.IsDistanceTo('triangle', 2, true),
    new shapeRules.IsNotDistanceTo('cloud', 2),
    new shapeRules.IsNotAdjacentTo(['clock', 'paw']),
    new shapeRules.IsDistanceTo('wave', 2, true),
];

ShapeDefinitions.leaf.rules = [
    new shapeRules.IsAdjacentTo(['droplet', 'wave']),
    new shapeRules.IsNotDistanceTo('diamond', 2),
    new shapeRules.IsNotAdjacentTo('clock'),
    new shapeRules.IsDistanceTo('paw', 2, true),
];

ShapeDefinitions.snowflake.rules = [
    new shapeRules.IsNotAdjacentTo(['flame', 'sun']),
    new shapeRules.IsNotAdjacentTo('lightning'),
    new shapeRules.IsDistanceTo('crescent', 2, true),
    new shapeRules.IsNotDistanceTo('gear', 2),
    new shapeRules.IsNotAdjacentTo('raven'),
];

ShapeDefinitions.droplet.rules = [
    new shapeRules.IsAdjacentTo(['leaf', 'wave']),
    new shapeRules.IsNotAdjacentTo('flame'),
    new shapeRules.IsDistanceTo('anchor', 2, true),
    new shapeRules.IsNotDistanceTo('skull', 2),
];


ShapeDefinitions.skull.rules = [
    new shapeRules.IsNotAdjacentTo(['heart', 'crown', 'raven']),
    new shapeRules.IsDistanceTo('diamond', 2, true),
    new shapeRules.IsNotDistanceTo('key', 2),
    new shapeRules.IsNotAdjacentTo(['lock', 'wave']),
];

ShapeDefinitions.hourglass.rules = [
    new shapeRules.IsAdjacentTo(['raven', 'sun']),
    new shapeRules.IsNotDistanceTo('lightning', 2),
    new shapeRules.IsDistanceTo('spiral', 2, true),
    new shapeRules.IsNotAdjacentTo('gear'),
];

ShapeDefinitions.eye.rules = [
    new shapeRules.IsNotAdjacentTo('shield'),
    new shapeRules.IsAdjacentTo(['star', 'triangle']),
    new shapeRules.IsNotDistanceTo('skull', 2),
    new shapeRules.IsDistanceTo('key', 2, true),
];

ShapeDefinitions.shield.rules = [
    new shapeRules.IsAdjacentTo(['gear', 'key', 'lock']),
    new shapeRules.IsNotAdjacentTo('skull'),
    new shapeRules.IsNotDistanceTo('diamond', 2),
    new shapeRules.IsDistanceTo('square', 2, true),
];

ShapeDefinitions.crown.rules = [
    new shapeRules.IsAdjacentTo(['heart', 'diamond']),
    new shapeRules.IsNotAdjacentTo('skull'),
    new shapeRules.IsDistanceTo('star', 2, true),
    new shapeRules.IsNotDistanceTo('spiral', 2),
];

ShapeDefinitions.clock.rules = [
    new shapeRules.IsAdjacentTo(['gear', 'lightning']),
    new shapeRules.IsNotDistanceTo('wave', 2),
    new shapeRules.IsNotAdjacentTo('leaf'),
    new shapeRules.IsDistanceTo('sun', 2, true),
];

ShapeDefinitions.cloud.rules = [
    new shapeRules.IsAdjacentTo(['wave', 'lightning']),
    new shapeRules.IsNotAdjacentTo('flame'),
    new shapeRules.IsDistanceTo('raven', 2, true),
    new shapeRules.IsNotDistanceTo('droplet', 2),
];

ShapeDefinitions.sun.rules = [
    new shapeRules.IsAdjacentTo(['hourglass', 'raven']),
    new shapeRules.IsNotDistanceTo('snowflake', 2),
    new shapeRules.IsNotAdjacentTo('droplet'),
    new shapeRules.IsDistanceTo('flame', 2, true),
];

ShapeDefinitions.raven.rules = [
    new shapeRules.IsAdjacentTo(['sun', 'crescent']),
    new shapeRules.IsNotAdjacentTo('flame'),
    new shapeRules.IsDistanceTo('cloud', 2, true),
    new shapeRules.IsNotDistanceTo('star', 2),
];

ShapeDefinitions.paw.rules = [
    new shapeRules.IsAdjacentTo(['leaf', 'heart', 'raven']),
    new shapeRules.IsNotAdjacentTo(['skull', 'lightning']),
    new shapeRules.IsNotDistanceTo('droplet', 2),
];

ShapeDefinitions.anchor.rules = [
    new shapeRules.IsAdjacentTo(['wave', 'cloud', 'gear']),
    new shapeRules.IsNotAdjacentTo(['flame', 'skull']),
    new shapeRules.IsNotDistanceTo('lock', 2),
];

ShapeDefinitions.key.rules = [
    new shapeRules.IsAdjacentTo('lock'),
    new shapeRules.IsNotDistanceTo('diamond', 2),
    new shapeRules.IsNotAdjacentTo('skull'),
    new shapeRules.IsDistanceTo('shield', 2, true),
];

ShapeDefinitions.lock.rules = [
    new shapeRules.IsAdjacentTo('key'),
    new shapeRules.IsNotAdjacentTo('skull'),
    new shapeRules.IsNotDistanceTo('crown', 2),
    new shapeRules.IsDistanceTo('hourglass', 2, true),
];

ShapeDefinitions.spiral.rules = [
    new shapeRules.IsNotAdjacentTo(['square', 'lightning']),
    new shapeRules.IsDistanceTo(['triangle', 'diamond'], 2, true),
    new shapeRules.IsNotDistanceTo('crown', 2),
    new shapeRules.IsNotAdjacentTo('flame'),
    new shapeRules.IsDistanceTo('clock', 2, true),
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