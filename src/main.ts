import { HTML } from "./web/html"
import { downloadImages } from "./utils"
import { ProgramWrapper, TexturesManager } from "./webgl"
import { StyleSheetTree, WindowsManager } from "./web/windows"

class Matrix {
    constructor(
        readonly m = new Float32Array([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ])
    ) {
        if (m.length !== 4 * 4) {
            throw new Error("Matrix should be 4x4")
        }
    }
    static Identity(): Matrix {
        return new Matrix(new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]))
    }
    static Scale(x: number, y = x, z = x) {
        return new Matrix(new Float32Array([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        ]))
    }
    static RotateX(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix(new Float32Array([
            +1, +0, +0, +0,
            +0, +c, +s, +0,
            +0, -s, +c, +0,
            +0, +0, +0, +1,
        ]))
    }
    static RotateY(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix(new Float32Array([
            +c, +0, -s, +0,
            +0, +1, +0, +0,
            +s, +0, +c, +0,
            +0, +0, +0, +1,
        ]))
    }
    static RotateZ(angle: number): Matrix {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix(new Float32Array([
            +c, +s, +0, +0,
            -s, +c, +0, +0,
            +0, +0, +1, +0,
            +0, +0, +0, +1,
        ]))
    }
    static Perspective(fieldOfView: number, aspect: number, nearZ: number, farZ: number) {
        const f = Math.tan(0.5 * (Math.PI * - fieldOfView));
        const rangeInv = 1.0 / (nearZ - farZ);
        return new Matrix(new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (nearZ + farZ) * rangeInv, -1,
            0, 0, nearZ * farZ * rangeInv * 2, 0
        ]));
    }
    static Ortographic(
        minX: number, maxX: number,
        minY: number, maxY: number,
        minZ: number, maxZ: number,
    ) {
        const w = maxX - minX;
        const h = maxY - minY;
        const d = maxZ - minZ;
        return new Matrix(new Float32Array([
            2 / w, 0, 0, (minX + maxX) / w,
            0, 2 / h, 0, (minY + maxY) / h,
            0, 0, 2 / d, (minZ + maxZ) / d,
            0, 0, 0, 1,
        ]))
    }
    static Move(dx: number, dy: number, dz: number): Matrix {
        return new Matrix(new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            dx, dy, dz, 1,
        ]))
    }
    static Multiply(a: Matrix, b: Matrix, c: Matrix = new Matrix(new Float32Array(16))) {
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
}

class Model {
    public vertexes: Float32Array
    constructor(
        vertexes: [number, number, number][] | Float32Array,
        public transform: Matrix = Matrix.Identity()
    ) {
        if (vertexes instanceof Float32Array) {
            this.vertexes = vertexes
        } else {
            this.vertexes = new Float32Array(vertexes.length * 4).fill(1);
            for (let i = 0; i < vertexes.length; i++)
                for (let axis = 0; axis < 3; axis++)
                    this.vertexes[i * 4 + axis] = vertexes[i][axis]
        }
    }
    static Cube(a: number = 1): Model {
        const h = a / 2;
        return new Model([
            [-h, -h, -h],
            [-h, h, -h],
            [h, -h, -h],
            [-h, h, -h],
            [h, h, -h],
            [h, -h, -h],

            [-h, -h, h],
            [h, -h, h],
            [-h, h, h],
            [-h, h, h],
            [h, -h, h],
            [h, h, h],

            [-h, h, -h],
            [-h, h, h],
            [h, h, -h],
            [-h, h, h],
            [h, h, h],
            [h, h, -h],

            [-h, -h, -h],
            [h, -h, -h],
            [-h, -h, h],
            [-h, -h, h],
            [h, -h, -h],
            [h, -h, h],

            [-h, -h, -h],
            [-h, -h, h],
            [-h, h, -h],
            [-h, -h, h],
            [-h, h, h],
            [-h, h, -h],

            [h, -h, -h],
            [h, h, -h],
            [h, -h, h],
            [h, -h, h],
            [h, h, -h],
            [h, h, h],
        ])
    }
}

import simpleVert from "./simple.vert"
import fillColorFrag from "./fill_color.frag"

const makeSimpleDrawProgram = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: simpleVert, fragment: fillColorFrag },
        { color: "u_color", transform: "u_transform", projection: "u_projection" },
        { position: "a_position" }
    )
    const positionBuffer = gl.createBuffer();
    return (projection: Matrix, model: Model, [r, g, b, a = 1]: [number, number, number, number?]) => {
        gl.useProgram(program);

        gl.uniform4f(uniforms.color, r, g, b, a);
        gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
        gl.uniformMatrix4fv(uniforms.projection, false, projection.m);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(attributes.position, 4, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, model.vertexes, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(attributes.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.drawArrays(gl.TRIANGLES, 0, model.vertexes.length / 4);
        gl.useProgram(null);
    }
}

downloadImages({}).then(images => {
    // const styleSheet = document.querySelector("style")!.sheet!
    const canvas = document.querySelector("canvas")!
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    document.body.appendChild(canvas)
    const gl = canvas.getContext("webgl2")!
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    const simpleDraw = makeSimpleDrawProgram(gl);
    const cube = Model.Cube(1);
    cube.transform.multiply(Matrix.Move(0.5, 0.5, -2));
    const textures = new TexturesManager(gl, images)
    // const windows = new WindowsManager(HTML.CreateElement("div", (el) => document.body.appendChild(el)), new StyleSheetTree(styleSheet))
    // windows.CreateInfoWindow("Shadow demo", HTML.CreateElement("article", HTML.SetText("TODO")))
    let lastTick = 0
    let frameId = -1;
    const ortographic = Matrix.Ortographic(-1, 1, -1, 1, -100, 0);
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;
    const aspect = halfWidth / gl.drawingBufferHeight;
    const projectionPerspective = Matrix.Perspective(Math.PI / 2, aspect, 0.1, 100);
    const draw = (currentTick: number) => {
        const dt = (currentTick - lastTick) / 1000
        lastTick = currentTick
        gl.clearColor(0.1, 0.1, 0.1, 1.0)
        gl.clearDepth(1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.viewport(0, 0, halfWidth, canvas.height);
        simpleDraw(projectionPerspective, cube, [1, 0, 0])
        gl.viewport(halfWidth, 0, halfWidth, canvas.height);
        simpleDraw(ortographic, cube, [1, 0, 0]);
        cube.transform
            .multiply(Matrix.RotateX(dt))
            .multiply(Matrix.RotateY(3 * dt))
            .multiply(Matrix.RotateZ(dt))
        frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
})
