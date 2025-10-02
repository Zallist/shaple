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

function formatShapeList(shapes: ShapeCode[], joinWord: 'or' | 'and' = 'or'): string {
    if (shapes.length === 1) return `<${shapes[0]}>`;
    if (shapes.length === 2) return `<${shapes[0]}> ${joinWord} <${shapes[1]}>`;
    return shapes
        .slice(0, -1)
        .map(s => `<${s}>`)
        .join(', ') + `, ${joinWord} <${shapes[shapes.length - 1]}>`;
}

export class IsNextToAny extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode) { super(shapes); }

    protected evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        return getNeighbours(sequence, index, 1).some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        //return `<${forShape}> likes <${intersect(this.getShapes(), availableShapes).join('> and <')}>`;
        return `<${forShape}> is always near ${formatShapeList(intersect(this.getShapes(), availableShapes), 'or')}`;
    }
}

export class IsNotNextToAny extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode) { super(shapes); }

    protected evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        return getNeighbours(sequence, index, 1).every((s) => !this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        //return `<${forShape}> hates <${intersect(this.getShapes(), availableShapes).join('> and <')}>`;
        return `<${forShape}> stays away from ${formatShapeList(intersect(this.getShapes(), availableShapes), 'and')}`;
    }
}

export class IsDistanceToAny extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode, protected distance: number) { super(shapes); }

    protected evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        if (!sequence.some((s) => this.getShapes().includes(s))) 
            return true;

        let neighbours: ShapeCode[] = [];
        for (let i = 1; i <= this.distance; i++) {
            neighbours.push(...getNeighbours(sequence, index, i));
        }

        return neighbours.some((s) => this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        //return `<${forShape}> stays ${this.distance} away from <${intersect(this.getShapes(), availableShapes).join('> or <')}>`;
        return `<${forShape}> tries to stay within ${this.distance} of ${formatShapeList(intersect(this.getShapes(), availableShapes), 'or')}`;
    }
}

export class IsNotDistanceToAny extends SimpleRule {
    constructor(shapes: ShapeCode[] | ShapeCode, protected distance: number) { super(shapes); }

    protected evaluateInternal(sequence: Array<ShapeCode>, index: number): boolean {
        return getNeighbours(sequence, index, this.distance).every((s) => !this.getShapes().includes(s));
    }

    public getDescription(forShape: ShapeCode, availableShapes: ShapeCode[] = AllShapes): string {
        //return `<${forShape}> doesn't stay ${this.distance} away from <${intersect(this.getShapes(), availableShapes).join('> or <')}>`;
        return `<${forShape}> won't stay exactly ${this.distance} away from ${formatShapeList(intersect(this.getShapes(), availableShapes), 'and')}`;
    }
}
