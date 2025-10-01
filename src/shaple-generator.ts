import prand from 'pure-rand';
import { ShapeCode, AllShapes, ShapeDefinitions } from './shape';
import * as shapeRules from './shape-rules';

// Append rules for this generator
ShapeDefinitions.circle.rules = [
  new shapeRules.IsNotAdjacentTo('square'),
  new shapeRules.IsNotDistanceTo('hexagon', 2),
];
ShapeDefinitions.square.rules = [
  new shapeRules.IsNotAdjacentTo('circle'),
  new shapeRules.IsNotAdjacentTo('triangle'),
  new shapeRules.IsDistanceTo('star', 2, true),
];
ShapeDefinitions.triangle.rules = [
  new shapeRules.IsAdjacentTo(['star', 'hexagon']),
  new shapeRules.IsNotDistanceTo('lightning', 2),
];
ShapeDefinitions.star.rules = [
  new shapeRules.IsNotAdjacentTo('star'),
  new shapeRules.IsAdjacentTo(['triangle', 'hive']),
];
ShapeDefinitions.hexagon.rules = [
  new shapeRules.IsAdjacentTo('circle'),
  new shapeRules.IsNotAdjacentTo('lightning'),
];
ShapeDefinitions.lightning.rules = [
  new shapeRules.IsNotAdjacentTo(['triangle', 'hexagon']),
  new shapeRules.IsDistanceTo('wave', 2, true),
];
ShapeDefinitions.crescent.rules = [
  new shapeRules.IsNotAdjacentTo('hive'),
  new shapeRules.IsDistanceTo('diamond', 2, true),
];
ShapeDefinitions.diamond.rules = [
  new shapeRules.IsAdjacentTo(['wave', 'crescent']),
  new shapeRules.IsNotDistanceTo('circle', 2),
];
ShapeDefinitions.hive.rules = [
  new shapeRules.IsAdjacentTo(['triangle', 'star']),
  new shapeRules.IsNotAdjacentTo('crescent'),
];
ShapeDefinitions.wave.rules = [
  new shapeRules.IsNotAdjacentTo('lightning'),
  new shapeRules.IsAdjacentTo('diamond'),
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

        if (isShapleValid(result)) return result;
    }

    throw new Error("Failed to generate shaple");
};


(window as any).validateShaple = function(length: number) {
    const result = Array<ShapeCode>(length);
    const validShaples = new Set<Array<ShapeCode>>();

    validate(0);

    console.log(`Found ${validShaples.size} valid shaples`);

    for (let i = 0; i < AllShapes.length; i++) {
        const shape = AllShapes[i];

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
        
        for (let i = 0; i < AllShapes.length; i++) {
            result[index] = AllShapes[i];
            validate(index + 1);
        }
    }
}