import { ShapeCode, ShapeRule } from './shape';

function getNeighbours(shapes: Array<ShapeCode>, index: number, distance: number): Array<ShapeCode> {
    let result = Array<ShapeCode>();

    if (index - distance >= 0)
        result.push(shapes[index - distance]);
    if (index + distance < shapes.length)
        result.push(shapes[index + distance]);

    return result;
}

abstract class SimpleRule implements ShapeRule {
    protected not: boolean = false;

    constructor(private shapes: ShapeCode[] | ShapeCode) { }

    protected getShapes(): ShapeCode[] {
        return Array.isArray(this.shapes) ? this.shapes : [this.shapes];
    }

    public evaluate(sequence: Array<ShapeCode>, index: number): boolean {
        return this.not ? !this.evaluateInternal(sequence, index) : this.evaluateInternal(sequence, index);
    }

    public abstract evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean;
    
    public abstract getDescription(forShape: ShapeCode): string;
}

export class IsAdjacentTo extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode) { super(shapes); }

    public evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        return getNeighbours(sequence, index, 1).some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode): string {
        return `<${forShape}> must be next to <${this.getShapes().join('> or <')}>`;
    }
}

export class IsNotAdjacentTo extends IsAdjacentTo {
    constructor(shapes: ShapeCode[] | ShapeCode) { super(shapes); this.not = true; }

    public getDescription(forShape: ShapeCode): string {
        return `<${forShape}> must not be next to to <${this.getShapes().join('> or <')}>`;
    }
}

export class IsDistanceTo extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode, protected distance: number, protected requireOther: boolean = false) { super(shapes); }

    public evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        if (this.requireOther && !sequence.some((s) => this.getShapes().includes(s))) return true;
        return getNeighbours(sequence, index, this.distance).some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode): string {
        return `<${forShape}> must be ${this.distance} away from <${this.getShapes().join('> or <')}>${this.requireOther ? ` if <${this.getShapes().join('> or <')}> exists` : ''}`;
    }
}

export class IsNotDistanceTo extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode, protected distance: number, protected requireOther: boolean = false) { super(shapes); }

    public evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        if (this.requireOther && !sequence.some((s) => this.getShapes().includes(s))) return true;
        return !getNeighbours(sequence, index, this.distance).some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode): string {
        return `<${forShape}> must not be ${this.distance} away from <${this.getShapes().join('> or <')}>${this.requireOther ? ` if <${this.getShapes().join('> or <')}> exists` : ''}`;
    }
}
