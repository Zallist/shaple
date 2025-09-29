import prand from 'pure-rand';

export type ShapeCode = 'circle' | 'square' | 'triangle' | 'star' | 'hexagon' | 
                        'cross' | 'crescent' | 'diamond' | 'arrow' | 'wave';

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
    Neighbours: (shapes: Array<ShapeCode>, index: number, distance: number): Array<ShapeCode> => {
        let result = Array<ShapeCode>();

        if (index - distance >= 0)
            result.push(shapes[index - distance]);
        if (index + distance < shapes.length)
            result.push(shapes[index + distance]);

        return result;
    },

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
        RuleFunctions.AdjNot('square', "Circle cannot be adjacent to Square"),
        RuleFunctions.DistNot(2, 'hexagon', "Circle cannot be 2-away from Hexagon")
    ], 'circle'),
    square: new ShapeDefinition('square', 'Square', [
        RuleFunctions.AdjNot('circle', "Square cannot be adjacent to Circle"),
        RuleFunctions.AdjNot('triangle', "Square cannot be adjacent to Triangle"),
        RuleFunctions.DistMust(2, 'star', "Square must be 2-away from Star if Star exists", true)
    ], 'square'),
    triangle: new ShapeDefinition('triangle', 'Triangle', [
        RuleFunctions.AdjMustAny(['star', 'hexagon'], "Triangle must be adjacent to Star or Hexagon"),
        RuleFunctions.DistNot(2, 'cross', "Triangle cannot be 2-away from Cross")
    ], 'change_history'),
    star: new ShapeDefinition('star', 'Star', [
        RuleFunctions.AdjNotSelf("Star cannot be adjacent to Star"),
        RuleFunctions.AdjMustAny(['triangle', 'arrow'], "Star must be adjacent to Triangle or Arrow")
    ], 'star'),
    hexagon: new ShapeDefinition('hexagon', 'Hexagon', [
        RuleFunctions.AdjMust('circle', "Hexagon must be adjacent to Circle"),
        RuleFunctions.AdjNot('cross', "Hexagon cannot be adjacent to Cross")
    ], 'hexagon'),
    cross: new ShapeDefinition('cross', 'Cross', [
        RuleFunctions.AdjNotAny(['triangle', 'hexagon'], "Cross cannot be adjacent to Triangle or Hexagon"),
        RuleFunctions.DistMust(2, 'wave', "Cross must be 2-away from Wave", true)
    ], 'close'),
    crescent: new ShapeDefinition('crescent', 'Crescent', [
        RuleFunctions.AdjMust('circle', "Hexagon must be adjacent to Circle"),
        RuleFunctions.AdjNot('cross', "Hexagon cannot be adjacent to Cross")
    ], 'bedtime'),
    diamond: new ShapeDefinition('diamond', 'Diamond', [
        RuleFunctions.AdjMustAny(['wave', 'crescent'], "Diamond must be adjacent to Wave or Crescent"),
        RuleFunctions.DistNot(2, 'circle', "Diamond cannot be 2-away from Circle")
    ], 'diamond'),
    arrow: new ShapeDefinition('arrow', 'Arrow', [
        RuleFunctions.AdjMustAny(['triangle', 'star'], "Arrow must be adjacent to Triangle or Star"),
        RuleFunctions.AdjNot('crescent', "Arrow cannot be adjacent to Crescent")
    ], 'arrow_forward'),
    wave: new ShapeDefinition('wave', 'Wave', [
        RuleFunctions.AdjNot('cross', "Wave cannot be adjacent to Cross"),
        RuleFunctions.AdjMust('diamond', "Wave must be adjacent to Diamond")
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
    
    while (attempts-- > 0) {
        for (let i = 0; i < length; i++) {
            [shapeIndex, rng] = prand.uniformIntDistribution(0, AllShapes.length - 1, rng);
            result[i] = AllShapes[shapeIndex];
        }

        if (isShapleValid(result)) return result;
    }

    throw new Error("Failed to generate shaple");
};