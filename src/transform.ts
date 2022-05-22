import { Matrix, Vector } from "./geometry";

export interface Transform {
    readonly position: Matrix;
    readonly matrix: Matrix;
    readonly m: Matrix['m'];
}

export class TransformProjectorTail implements Transform {
    constructor(
        readonly t: Transform,
        readonly p: Matrix,
    ) { }
    get position(): Matrix {
        return this.t.matrix.multiply(this.p.inverse());
    }

    get matrix(): Matrix {
        return this.position;
    }

    get m(): Matrix['m'] {
        return this.matrix.m;
    }
}

export class TransformMatrixes {
    constructor(
        public shift: Matrix = Matrix.Identity(),
        public rotate: Matrix = Matrix.Identity(),
        public scale: Matrix = Matrix.Identity(),
        public parent?: Transform,
    ) { }

    get position(): Matrix {
        const root = this.parent?.position || Matrix.Identity();
        return root.multiply(this.shift).multiply(this.rotate);
    }

    get matrix(): Matrix {
        return this.position.multiply(this.scale);
    }

    get m(): Matrix['m'] {
        return this.matrix.m;
    }
}

export class TransformLookAt {
    constructor(
        public parent: Transform,
        public pos: Vector<3>,
        public up: Vector<3> = [0, 1, 0],
    ) { }

    get position(): Matrix {
        return Matrix.LookAt(this.pos, this.parent.matrix.position(), this.up);
    }

    get matrix(): Matrix {
        return this.position;
    }

    get m(): Matrix['m'] {
        return this.matrix.m;
    }
}