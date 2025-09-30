import prand from 'pure-rand';

export type ShapeCode = 'circle' | 'square' | 'triangle' | 'star' | 'hexagon' | 
                        'lightning' | 'crescent' | 'diamond' | 'hive' | 'wave';

export class ShapeDefinition {
    code: ShapeCode;
    displayName: string;
    rules: Rule[];
    icon_name: string;

    constructor(code: ShapeCode, displayName: string, rules: Rule[], icon_name: string) {
        this.code = code;
        this.displayName = displayName;
        this.rules = rules;
        this.icon_name = icon_name;
    }
}

export type RuleEvaluator = (shapes: Array<ShapeCode>, index: number) => boolean;

export class Rule {
    check: RuleEvaluator;
    description: string;

    constructor(check: RuleEvaluator, description: string) {
        this.check = check;
        this.description = description;
    }
}

const RuleFunctions = {
    // Returns the shapes at exactly `distance` away from `index` (both sides if within bounds).
    // Example: distance=1 means immediate neighbors; out-of-range neighbors are ignored.
    Neighbours: (shapes: Array<ShapeCode>, index: number, distance: number): Array<ShapeCode> => {
        let result = Array<ShapeCode>();

        if (index - distance >= 0)
            result.push(shapes[index - distance]);
        if (index + distance < shapes.length)
            result.push(shapes[index + distance]);

        return result;
    },

    // "Adj" helpers mean distance=1; "Not" means forbidden, "Must" means required.
    AdjNot: (other: ShapeCode, description: string) => new Rule((shapes, index) => !RuleFunctions.Neighbours(shapes, index, 1).includes(other), description),
    AdjNotAny: (others: Array<ShapeCode>, description: string) => new Rule((shapes, index) => !RuleFunctions.Neighbours(shapes, index, 1).some((s) => others.includes(s)), description),
    AdjNotSelf: (description: string) => new Rule((shapes, index) => !RuleFunctions.Neighbours(shapes, index, 1).includes(shapes[index]), description),
    
    AdjMust: (other: ShapeCode, description: string) => new Rule((shapes, index) => RuleFunctions.Neighbours(shapes, index, 1).includes(other), description),
    AdjMustAny: (others: Array<ShapeCode>, description: string) => new Rule((shapes, index) => RuleFunctions.Neighbours(shapes, index, 1).some((s) => others.includes(s)), description),
    AdjMustSelf: (description: string) => new Rule((shapes, index) => RuleFunctions.Neighbours(shapes, index, 1).includes(shapes[index]), description),

    DistNot: (distance: number, other: ShapeCode, description: string, requireOther: boolean = false): Rule => {
        return new Rule((shapes, index) => {
            if (requireOther && !shapes.includes(other)) return true;
            return !RuleFunctions.Neighbours(shapes, index, distance).includes(other);
        }, description);
    },
    DistMust: (distance: number, other: ShapeCode, description: string, requireOther: boolean = false): Rule => {
        return new Rule((shapes, index) => {
            if (requireOther && !shapes.includes(other)) return true;
            return RuleFunctions.Neighbours(shapes, index, distance).includes(other);
        }, description);
    }
};

export const ShapeDefinitions: Record<ShapeCode, ShapeDefinition> = {
    circle: new ShapeDefinition('circle', 'Circle', [
        RuleFunctions.AdjNot('square', "<circle> cannot be adjacent to <square>"),
        RuleFunctions.DistNot(2, 'hexagon', "<circle> cannot be 2-away from <hexagon>")
    ], 'circle'),
    square: new ShapeDefinition('square', 'Square', [
        RuleFunctions.AdjNot('circle', "<square> cannot be adjacent to <circle>"),
        RuleFunctions.AdjNot('triangle', "<square> cannot be adjacent to <triangle>"),
        RuleFunctions.DistMust(2, 'star', "<square> must be 2-away from <star> if <star> exists", true)
    ], 'square'),
    triangle: new ShapeDefinition('triangle', 'Triangle', [
        RuleFunctions.AdjMustAny(['star', 'hexagon'], "<triangle> must be adjacent to <star> or <hexagon>"),
        RuleFunctions.DistNot(2, 'lightning', "<triangle> cannot be 2-away from <lightning>")
    ], 'change_history'),
    star: new ShapeDefinition('star', 'Star', [
        RuleFunctions.AdjNotSelf("<star> cannot be adjacent to <star>"),
        RuleFunctions.AdjMustAny(['triangle', 'hive'], "<star> must be adjacent to <triangle> or <hive>")
    ], 'star'),
    hexagon: new ShapeDefinition('hexagon', 'Hexagon', [
        RuleFunctions.AdjMust('circle', "<hexagon> must be adjacent to <circle>"),
        RuleFunctions.AdjNot('lightning', "<hexagon> cannot be adjacent to <lightning>")
    ], 'hexagon'),
    lightning: new ShapeDefinition('lightning', 'Lightning', [
        RuleFunctions.AdjNotAny(['triangle', 'hexagon'], "<lightning> cannot be adjacent to <triangle> or <hexagon>"),
        RuleFunctions.DistMust(2, 'wave', "<lightning> must be 2-away from <wave> if <wave> exists", true)
    ], 'electric_bolt'),
    crescent: new ShapeDefinition('crescent', 'Crescent', [
        RuleFunctions.AdjNot('hive', "<crescent> cannot be adjacent to <hive>"),
        RuleFunctions.DistMust(2, 'diamond', "<crescent> must be 2-away from <diamond> if <diamond> exists", true)
    ], 'bedtime'),
    diamond: new ShapeDefinition('diamond', 'Diamond', [
        RuleFunctions.AdjMustAny(['wave', 'crescent'], "<diamond> must be adjacent to <wave> or <crescent>"),
        RuleFunctions.DistNot(2, 'circle', "<diamond> cannot be 2-away from <circle>")
    ], 'diamond'),
    hive: new ShapeDefinition('hive', 'Hive', [
        RuleFunctions.AdjMustAny(['triangle', 'star'], "<hive> must be adjacent to <triangle> or <star>"),
        RuleFunctions.AdjNot('crescent', "<hive> cannot be adjacent to <crescent>")
    ], 'hive'),
    wave: new ShapeDefinition('wave', 'Wave', [
        RuleFunctions.AdjNot('lightning', "<wave> cannot be adjacent to <lightning>"),
        RuleFunctions.AdjMust('diamond', "<wave> must be adjacent to <diamond>")
    ], 'airwave')
};

export const AllShapes = Object.keys(ShapeDefinitions) as ShapeCode[];

export function isShapleValid(shapes: Array<ShapeCode>): boolean {
    for (let i = 0; i < shapes.length; i++) {
        const shapeDef = ShapeDefinitions[shapes[i]];
        for (const rule of shapeDef.rules) {
            if (!rule.check(shapes, i)) {
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