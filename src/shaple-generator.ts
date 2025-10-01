import prand from 'pure-rand';
import { ShapeCode, AllShapes, ShapeDefinition } from './shape';
import * as shapeRules from './shape-rules';

export const ShapeDefinitions: Record<ShapeCode, ShapeDefinition> = {
    circle: new ShapeDefinition('circle', 'Circle', [
        new shapeRules.IsNotAdjacentTo('square'),
        new shapeRules.IsNotDistanceTo('hexagon', 2)
    ], 'circle'),
    square: new ShapeDefinition('square', 'Square', [
        new shapeRules.IsNotAdjacentTo('circle'),
        new shapeRules.IsNotAdjacentTo('triangle'),
        new shapeRules.IsDistanceTo('star', 2, true)
    ], 'square'),
    triangle: new ShapeDefinition('triangle', 'Triangle', [
        new shapeRules.IsAdjacentTo(['star', 'hexagon']),
        new shapeRules.IsNotDistanceTo('lightning', 2)
    ], 'change_history'),
    star: new ShapeDefinition('star', 'Star', [
        new shapeRules.IsNotAdjacentTo('star'),
        new shapeRules.IsAdjacentTo(['triangle', 'hive'])
    ], 'star'),
    hexagon: new ShapeDefinition('hexagon', 'Hexagon', [
        new shapeRules.IsAdjacentTo('circle'),
        new shapeRules.IsNotAdjacentTo('lightning')
    ], 'hexagon'),
    lightning: new ShapeDefinition('lightning', 'Lightning', [
        new shapeRules.IsNotAdjacentTo(['triangle', 'hexagon']),
        new shapeRules.IsDistanceTo('wave', 2, true)
    ], 'electric_bolt'),
    crescent: new ShapeDefinition('crescent', 'Crescent', [
        new shapeRules.IsNotAdjacentTo('hive'),
        new shapeRules.IsDistanceTo('diamond', 2, true)
    ], 'bedtime'),
    diamond: new ShapeDefinition('diamond', 'Diamond', [
        new shapeRules.IsAdjacentTo(['wave', 'crescent']),
        new shapeRules.IsNotDistanceTo('circle', 2)
    ], 'diamond'),
    hive: new ShapeDefinition('hive', 'Hive', [
        new shapeRules.IsAdjacentTo(['triangle', 'star']),
        new shapeRules.IsNotAdjacentTo('crescent')
    ], 'hive'),
    wave: new ShapeDefinition('wave', 'Wave', [
        new shapeRules.IsNotAdjacentTo('lightning'),
        new shapeRules.IsAdjacentTo('diamond')
    ], 'airwave')
};

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