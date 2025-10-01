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
    constructor(public code: ShapeCode, public displayName: string, public rules: ShapeRule[], public icon_name: string) { }
}