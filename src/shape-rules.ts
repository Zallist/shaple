import { AllShapes, ShapeCode, ShapeRule } from './shape';

function getNeighbours(shapes: Array<ShapeCode>, index: number, distance: number): Array<ShapeCode> {
    let result = Array<ShapeCode>();

    if (index - distance >= 0)
        result.push(shapes[index - distance]);
    if (index + distance < shapes.length)
        result.push(shapes[index + distance]);

    return result;
}

function intersect<T>(a: T[], b: T[]) {
    return a.filter((x) => b.includes(x));
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

    protected abstract evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean;
    
    public abstract getDescription(forShape: ShapeCode, availableShapes: ShapeCode[]): string;

    public isRelevant(forShape: ShapeCode): boolean {
        return this.getShapes().includes(forShape);
    }
}

export class IsAdjacentTo extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode) { super(shapes); }

    protected evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        return getNeighbours(sequence, index, 1).some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        return `<${forShape}> likes <${intersect(this.getShapes(), availableShapes).join('> and <')}>`;
    }
}

export class IsNotAdjacentTo extends IsAdjacentTo {
    constructor(shapes: ShapeCode[] | ShapeCode) { super(shapes); this.not = true; }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        return `<${forShape}> hates <${intersect(this.getShapes(), availableShapes).join('> and <')}>`;
    }
}

export class IsDistanceTo extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode, protected distance: number) { super(shapes); }

    protected evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        if (!sequence.some((s) => this.getShapes().includes(s))) 
            return true;

        return getNeighbours(sequence, index, this.distance).some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        return `<${forShape}> stays ${this.distance} away from <${intersect(this.getShapes(), availableShapes).join('> or <')}>`;
    }
}

export class IsNotDistanceTo extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode, protected distance: number) { super(shapes); }

    protected evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        return !getNeighbours(sequence, index, this.distance).some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        return `<${forShape}> doesn't stay ${this.distance} away from <${intersect(this.getShapes(), availableShapes).join('> or <')}>`;
    }
}
