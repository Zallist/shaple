// An array up-front so we have a defined index, rather than a type/enum which are undefined for order
const allShapeCodes = [
    'circle', 'square', 'triangle', 'star', 'hexagon', 
    'lightning', 'crescent', 'diamond', 'hive', 'wave'
] as const;

export type ShapeCode = typeof allShapeCodes[number];

// And expose it converted to the right type
export const AllShapes: ShapeCode[] = [...allShapeCodes];

export interface ShapeRule {
    evaluate: (sequence: Array<ShapeCode>, index: number) => boolean;
    getDescription: (forShape: ShapeCode) => string;
}

export class ShapeDefinition {
    public rules: ShapeRule[] = [];
    constructor(public code: ShapeCode, public displayName: string, public icon_name: string) { }
}

export const ShapeDefinitions: Record<ShapeCode, ShapeDefinition> = {
    circle: new ShapeDefinition('circle', 'Circle', 'circle'),
    square: new ShapeDefinition('square', 'Square', 'square'),
    triangle: new ShapeDefinition('triangle', 'Triangle', 'change_history'),
    star: new ShapeDefinition('star', 'Star', 'star'),
    hexagon: new ShapeDefinition('hexagon', 'Hexagon', 'hexagon'),
    lightning: new ShapeDefinition('lightning', 'Lightning', 'electric_bolt'),
    crescent: new ShapeDefinition('crescent', 'Crescent', 'bedtime'),
    diamond: new ShapeDefinition('diamond', 'Diamond', 'diamond'),
    hive: new ShapeDefinition('hive', 'Hive', 'hive'),
    wave: new ShapeDefinition('wave', 'Wave', 'airwave')
};
