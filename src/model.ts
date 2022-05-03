import { Matrix } from "./geometry";

export class Model {
    public vertexes: Float32Array
    public indices: Uint16Array
    public vao: WebGLVertexArrayObject
    constructor(
        gl: WebGL2RenderingContext,
        vertexes: [number, number, number][] | Float32Array,
        triangles: [number, number, number][] | Uint16Array,
        public transform: Matrix = Matrix.Identity()
    ) {
        if (vertexes instanceof Float32Array) {
            this.vertexes = vertexes;
        } else {
            this.vertexes = new Float32Array(vertexes.length * 4).fill(1);
            for (let i = 0; i < vertexes.length; i++)
                for (let axis = 0; axis < 3; axis++)
                    this.vertexes[i * 4 + axis] = vertexes[i][axis];
        }
        if (triangles instanceof Uint16Array) {
            this.indices = triangles;
        } else {
            this.indices = new Uint16Array(triangles.flatMap(x => x));
        }
        this.vao = gl.createVertexArray()!;
        const vertexBuffer = gl.createBuffer()!;
        const indicesBuffer = gl.createBuffer()!;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexes, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
    }
    static Cube(gl: WebGL2RenderingContext, a: number = 1): Model {
        const h = a / 2;
        const vertexes = [
            [1, 1, -1],
            [1, 1, 1],
            [1, -1, 1],
            [1, -1, -1],
            [-1, 1, 1],
            [-1, 1, -1],
            [-1, -1, -1],
            [-1, -1, 1],
            [-1, 1, 1],
            [1, 1, 1],
            [1, 1, -1],
            [-1, 1, -1],
            [-1, -1, -1],
            [1, -1, -1],
            [1, -1, 1],
            [-1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1],
            [-1, -1, 1],
            [1, -1, 1],
            [-1, 1, -1],
            [1, 1, -1],
            [1, -1, -1],
            [-1, -1, -1],
        ].map(coords => coords.map(c => c * h) as [number, number, number]);
        const triangles: [number, number, number][] = [
            [0, 1, 2],
            [0, 2, 3],
            [4, 5, 6],
            [4, 6, 7],
            [8, 9, 10],
            [8, 10, 11],
            [12, 13, 14],
            [12, 14, 15],
            [16, 17, 18],
            [16, 18, 19],
            [20, 21, 22],
            [20, 22, 23],
        ]
        return new Model(gl, vertexes, triangles)
    }
    static Camera(gl: WebGL2RenderingContext, scale: number = 1): Model {
        const positions = [
            -1, -1, 1,  // cube vertices
            1, -1, 1,
            -1, 1, 1,
            1, 1, 1,
            -1, -1, 3,
            1, -1, 3,
            -1, 1, 3,
            1, 1, 3,
            0, 0, 1,  // cone tip
        ];
        const indices = [
            0, 1, 1, 3, 3, 2, 2, 0, // cube indices
            4, 5, 5, 7, 7, 6, 6, 4,
            0, 4, 1, 5, 3, 7, 2, 6,
        ];
        // add cone segments
        const numSegments = 6;
        const coneBaseIndex = positions.length / 3;
        const coneTipIndex = coneBaseIndex - 1;
        for (let i = 0; i < numSegments; ++i) {
            const u = i / numSegments;
            const angle = u * Math.PI * 2;
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            positions.push(x, y, 0);
            // line from tip to edge
            indices.push(coneTipIndex, coneBaseIndex + i);
            // line from point on edge to next point on edge
            indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
        }
        positions.forEach((v, ndx) => {
            positions[ndx] *= scale;
        });
        const vertexes4D = new Float32Array(positions.length / 3 * 4).fill(1);
        for (let i = 0; i < positions.length / 3; i++) {
            vertexes4D[i * 4 + 0] = positions[i * 3 + 0];
            vertexes4D[i * 4 + 1] = positions[i * 3 + 1];
            vertexes4D[i * 4 + 2] = positions[i * 3 + 2];
        }
        return new Model(gl, vertexes4D, new Uint16Array(indices))
    }
}
