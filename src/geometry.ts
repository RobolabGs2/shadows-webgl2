export type Vector<N extends number, T = number> = N extends 0 ? never[] : {
    0: T;
    length: N;
} & ReadonlyArray<T>;

export namespace Vector {
    export function Cross(a: Vector<3>, b: Vector<3>): Vector<3> {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }
    export function Substract(a: Vector<3>, b: Vector<3>): Vector<3> {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }
    export function Normilize(v: Vector<3>, newLenght = 1, eps = 0.00000001): Vector<3> {
        const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        if (l < eps)
            return [0, 0, 0];
        return [v[0] / l * newLenght, v[1] / l * newLenght, v[2] / l * newLenght];
    }
}

export class Matrix {
    readonly m: Float32Array;
    constructor(
        m: Vector<16> = [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]
    ) {
        if (m.length !== 4 * 4) {
            throw new Error("Matrix should be 4x4")
        }
        this.m = new Float32Array(m);
    }
    static Identity(): Matrix {
        return new Matrix([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ])
    }
    static Scale(x: number, y = x, z = x) {
        return new Matrix([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        ])
    }
    static RotateX(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix([
            +1, +0, +0, +0,
            +0, +c, +s, +0,
            +0, -s, +c, +0,
            +0, +0, +0, +1,
        ])
    }
    static RotateY(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix([
            +c, +0, -s, +0,
            +0, +1, +0, +0,
            +s, +0, +c, +0,
            +0, +0, +0, +1,
        ])
    }
    static RotateZ(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix([
            +c, +s, +0, +0,
            -s, +c, +0, +0,
            +0, +0, +1, +0,
            +0, +0, +0, +1,
        ])
    }
    static Perspective(fieldOfView: number, aspect: number, nearZ: number, farZ: number) {
        const f = Math.tan(0.5 * (Math.PI * - fieldOfView));
        const rangeInv = 1.0 / (nearZ - farZ);
        return new Matrix([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (nearZ + farZ) * rangeInv, -1,
            0, 0, nearZ * farZ * rangeInv * 2, 0
        ]);
    }
    static Ortographic(
        minX: number, maxX: number,
        minY: number, maxY: number,
        minZ: number, maxZ: number,
    ) {
        const w = maxX - minX;
        const h = maxY - minY;
        const d = maxZ - minZ;
        return new Matrix([
            2 / w, 0, 0, 0,
            0, 2 / h, 0, 0,
            0, 0, 2 / d, 0,
            (minX + maxX) / w, (minY + maxY) / h, (minZ + maxZ) / d, 1,
        ])
    }
    static LookAt(from: Vector<3>, to: Vector<3>, up: Vector<3>): Matrix {
        const zAxis = Vector.Normilize(Vector.Substract(from, to));
        const xAxis = Vector.Normilize(Vector.Cross(up, zAxis));
        const yAxis = Vector.Normilize(Vector.Cross(zAxis, xAxis));
        return new Matrix([
            xAxis[0], xAxis[1], xAxis[2], 0,
            yAxis[0], yAxis[1], yAxis[2], 0,
            zAxis[0], zAxis[1], zAxis[2], 0,
            from[0], from[1], from[2], 1,
        ]);
    }
    static Move(dx: number, dy: number, dz: number): Matrix {
        return new Matrix([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            dx, dy, dz, 1,
        ])
    }
    static Multiply(a: Matrix, b: Matrix, c: Matrix = new Matrix()) {
        const a00 = a.m[0 * 4 + 0];
        const a01 = a.m[0 * 4 + 1];
        const a02 = a.m[0 * 4 + 2];
        const a03 = a.m[0 * 4 + 3];
        const a10 = a.m[1 * 4 + 0];
        const a11 = a.m[1 * 4 + 1];
        const a12 = a.m[1 * 4 + 2];
        const a13 = a.m[1 * 4 + 3];
        const a20 = a.m[2 * 4 + 0];
        const a21 = a.m[2 * 4 + 1];
        const a22 = a.m[2 * 4 + 2];
        const a23 = a.m[2 * 4 + 3];
        const a30 = a.m[3 * 4 + 0];
        const a31 = a.m[3 * 4 + 1];
        const a32 = a.m[3 * 4 + 2];
        const a33 = a.m[3 * 4 + 3];
        const b00 = b.m[0 * 4 + 0];
        const b01 = b.m[0 * 4 + 1];
        const b02 = b.m[0 * 4 + 2];
        const b03 = b.m[0 * 4 + 3];
        const b10 = b.m[1 * 4 + 0];
        const b11 = b.m[1 * 4 + 1];
        const b12 = b.m[1 * 4 + 2];
        const b13 = b.m[1 * 4 + 3];
        const b20 = b.m[2 * 4 + 0];
        const b21 = b.m[2 * 4 + 1];
        const b22 = b.m[2 * 4 + 2];
        const b23 = b.m[2 * 4 + 3];
        const b30 = b.m[3 * 4 + 0];
        const b31 = b.m[3 * 4 + 1];
        const b32 = b.m[3 * 4 + 2];
        const b33 = b.m[3 * 4 + 3];
        c.m[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        c.m[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        c.m[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        c.m[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        c.m[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        c.m[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        c.m[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        c.m[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        c.m[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        c.m[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        c.m[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        c.m[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        c.m[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        c.m[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        c.m[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        c.m[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
        return c;
    }
    multiply(another: Matrix) {
        return Matrix.Multiply(this, another, this);
    }
    position(): Vector<3> {
        return [this.m[12], this.m[13], this.m[14]];
    }
    inverse(): Matrix {
        const m = this.m;
        const m00 = m[0 * 4 + 0];
        const m01 = m[0 * 4 + 1];
        const m02 = m[0 * 4 + 2];
        const m03 = m[0 * 4 + 3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];
        const tmp_0 = m22 * m33;
        const tmp_1 = m32 * m23;
        const tmp_2 = m12 * m33;
        const tmp_3 = m32 * m13;
        const tmp_4 = m12 * m23;
        const tmp_5 = m22 * m13;
        const tmp_6 = m02 * m33;
        const tmp_7 = m32 * m03;
        const tmp_8 = m02 * m23;
        const tmp_9 = m22 * m03;
        const tmp_10 = m02 * m13;
        const tmp_11 = m12 * m03;
        const tmp_12 = m20 * m31;
        const tmp_13 = m30 * m21;
        const tmp_14 = m10 * m31;
        const tmp_15 = m30 * m11;
        const tmp_16 = m10 * m21;
        const tmp_17 = m20 * m11;
        const tmp_18 = m00 * m31;
        const tmp_19 = m30 * m01;
        const tmp_20 = m00 * m21;
        const tmp_21 = m20 * m01;
        const tmp_22 = m00 * m11;
        const tmp_23 = m10 * m01;

        const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        return new Matrix([
            d * t0,
            d * t1,
            d * t2,
            d * t3,
            d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
                (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
            d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
                (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
            d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
            d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
            d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
            d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
            d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
            d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
            d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
            d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
            d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
            d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
        ]);
    }
}
