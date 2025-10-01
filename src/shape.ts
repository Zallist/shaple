// An array up-front so we have a defined index, rather than a type/enum which are undefined for order
const allShapeCodes = [
    'circle',       'square',       'triangle', 'star',       'hexagon', 
    'lightning',    'crescent',     'diamond',  'hive',       'wave',
    'gear',         'heart',        'flame',    'leaf',       'snowflake', 
    'droplet',      'skull',        'hourglass','eye',        'shield', 
    'crown',        'clock',        'cloud',    'sun',        'raven', 
    'paw',          'anchor',       'key',      'lock',       'spiral'
] as const;

export type ShapeCode = typeof allShapeCodes[number];

// And expose it converted to the right type
export const AllShapes: ShapeCode[] = [...allShapeCodes];

export interface ShapeRule {
    evaluate (sequence: Array<ShapeCode>, index: number): boolean;
    getDescription (forShape: ShapeCode, availableShapes?: ShapeCode[]): string;
    isRelevant (forShape: ShapeCode): boolean;
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
    lightning: new ShapeDefinition('lightning', 'Lightning', 'bolt'),
    crescent: new ShapeDefinition('crescent', 'Crescent', 'bedtime'),
    diamond: new ShapeDefinition('diamond', 'Diamond', 'diamond'),
    hive: new ShapeDefinition('hive', 'Hive', 'hive'),
    wave: new ShapeDefinition('wave', 'Wave', 'airwave'),
    
    gear: new ShapeDefinition('gear', 'Gear', 'settings'),
    heart: new ShapeDefinition('heart', 'Heart', 'favorite'),
    flame: new ShapeDefinition('flame', 'Flame', 'local_fire_department'),
    leaf: new ShapeDefinition('leaf', 'Leaf', 'eco'),
    snowflake: new ShapeDefinition('snowflake', 'Snowflake', 'ac_unit'),
    droplet: new ShapeDefinition('droplet', 'Droplet', 'water_drop'),
    skull: new ShapeDefinition('skull', 'Skull', 'skull'),
    hourglass: new ShapeDefinition('hourglass', 'Hourglass', 'hourglass_top'),
    eye: new ShapeDefinition('eye', 'Eye', 'visibility'),
    shield: new ShapeDefinition('shield', 'Shield', 'shield'),
    crown: new ShapeDefinition('crown', 'Crown', 'workspace_premium'),
    clock: new ShapeDefinition('clock', 'Clock', 'access_time'),
    cloud: new ShapeDefinition('cloud', 'Cloud', 'cloud'),
    sun: new ShapeDefinition('sun', 'Sun', 'wb_sunny'),
    raven: new ShapeDefinition('raven', 'Raven', 'raven'),
    paw: new ShapeDefinition('paw', 'Paw', 'pets'),
    anchor: new ShapeDefinition('anchor', 'Anchor', 'anchor'),
    key: new ShapeDefinition('key', 'Key', 'vpn_key'),
    lock: new ShapeDefinition('lock', 'Lock', 'lock'),
    spiral: new ShapeDefinition('spiral', 'Spiral', 'rotate_right'),
};
