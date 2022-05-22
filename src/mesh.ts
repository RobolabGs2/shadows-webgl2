import { createTexture } from "./webgl";

export class Mesh {
    public vertexes: Float32Array
    public indices: Uint16Array
    public vao: WebGLVertexArrayObject
    constructor(
        gl: WebGL2RenderingContext,
        vertexes: [number, number, number][] | Float32Array,
        triangles: [number, number, number][] | Uint16Array,
        normals?: number[],
        readonly texture?: WebGLTexture,
        textureCoords?: [number, number][]
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

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexes, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        if (normals) {
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }
        if (textureCoords) {
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords.flat()), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    static Cube(gl: WebGL2RenderingContext, a: number = 1): Mesh {
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
        const normals = [
            [1, 0, 0],
            [1, 0, 0],
            [1, 0, 0],
            [1, 0, 0],

            [-1, 0, 0],
            [-1, 0, 0],
            [-1, 0, 0],
            [-1, 0, 0],

            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],

            [0, -1, 0],
            [0, -1, 0],
            [0, -1, 0],
            [0, -1, 0],

            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],

            [0, 0, -1],
            [0, 0, -1],
            [0, 0, -1],
            [0, 0, -1],
        ]
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
        return new Mesh(gl, vertexes, triangles, normals.flat())
    }
    static Camera(gl: WebGL2RenderingContext, scale: number = 1): Mesh {
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
        return new Mesh(gl, vertexes4D, new Uint16Array(indices));
    }
    static DebugCube(gl: WebGL2RenderingContext, scale: number = 1): Mesh {
        const positions = [
            -1, -1, -1,  // cube vertices
            1, -1, -1,
            -1, 1, -1,
            1, 1, -1,
            -1, -1, 1,
            1, -1, 1,
            -1, 1, 1,
            1, 1, 1,
        ];
        const indices = [
            0, 1, 1, 3, 3, 2, 2, 0, // cube indices
            4, 5, 5, 7, 7, 6, 6, 4,
            0, 4, 1, 5, 3, 7, 2, 6,
        ];
        positions.forEach((v, ndx) => {
            positions[ndx] *= scale;
        });
        const vertexes4D = new Float32Array(positions.length / 3 * 4).fill(1);
        for (let i = 0; i < positions.length / 3; i++) {
            vertexes4D[i * 4 + 0] = positions[i * 3 + 0];
            vertexes4D[i * 4 + 1] = positions[i * 3 + 1];
            vertexes4D[i * 4 + 2] = positions[i * 3 + 2];
        }
        return new Mesh(gl, vertexes4D, new Uint16Array(indices));
    }
    static fromObj(gl: WebGL2RenderingContext, obj: string, texture: HTMLImageElement): Mesh {
        const lines = obj.split(/\r\n/g);
        type Point = [number, number, number];
        type TPoint = [number, number];
        const v = new Array<Point>();
        const vn = new Array<Point>();
        const vt = new Array<TPoint>();

        const vertexes = new Array<Point>();
        const normals = new Array<Point>();
        const texCoords = new Array<TPoint>();
        const uniqueVertexes = new Map<string, number>();
        function getVertexIndex(tuple: string): number {
            const cachedValue = uniqueVertexes.get(tuple);
            if (cachedValue !== undefined)
                return cachedValue;
            const [vi, vti, vni] = tuple.split('/');
            vertexes.push(v[+vi - 1]);
            normals.push(vn[+vni - 1]);
            texCoords.push(vt[+vti - 1]);
            const index = uniqueVertexes.size;
            uniqueVertexes.set(tuple, index);
            return index;
        }
        const triangles = new Array<Point>();
        for (const line of lines) {
            if (line === '') continue;

            const [cmd, ...params] = line.trim().split(/ +/g);
            if (cmd.startsWith('v')) {
                const [x, y, z] = params;
                switch (cmd) {
                    case 'v':
                        v.push([+x, +y, +z]);
                        break;
                    case 'vn':
                        vn.push([+x, +y, +z]);
                        break;
                    case 'vt':
                        vt.push([+x, 1 - +y]);
                        break;
                }
            } else if (cmd === 'f') {
                for (let i = 0; i < params.length - 2; i++) {
                    triangles.push([
                        getVertexIndex(params[0]),
                        getVertexIndex(params[1 + i]),
                        getVertexIndex(params[2 + i]),
                    ]);
                }
            }
        }
        return new Mesh(gl, vertexes, triangles, normals.flat(), createTexture(gl, texture)!, texCoords);
    }
}
