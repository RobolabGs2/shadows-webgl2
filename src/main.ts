import { HTML } from "./web/html"
import { downloadImages } from "./utils"
import { ProgramWrapper, TexturesManager } from "./webgl"
import { StyleSheetTree, WindowsManager } from "./web/windows"


import simpleVert from "./simple.vert"
import fillColorFrag from "./fill_color.frag"

const makeSimpleDrawProgram = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: simpleVert, fragment: fillColorFrag },
        { color: "u_color", transform: "u_transform", projection: "u_projection" },
        { position: "a_position" }
    )
    return (projection: Matrix, model: Model, [r, g, b, a = 1]: [number, number, number, number?]) => {
        gl.useProgram(program);

        gl.uniform4f(uniforms.color, r, g, b, a);
        gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
        gl.uniformMatrix4fv(uniforms.projection, false, projection.m);

        gl.bindVertexArray(model.vao);

        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.uniform4f(uniforms.color, r, 1, b, a);
        gl.drawElements(gl.LINES, model.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}
import spriteVert from "./sprite.vert"
import { Matrix, Vector } from "./geometry"
import { Model } from "./model"

const makeSpriteProgram = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: spriteVert, fragment: fillColorFrag },
        { color: "u_color", transform: "u_transform", projection: "u_projection", size: "u_size" },
        { position: "a_position" }
    )
    const positionBuffer = gl.createBuffer();
    return (projection: Matrix, position: Vector<3>, [r, g, b, a = 1]: [number, number, number, number?], size = 16) => {
        gl.useProgram(program);

        gl.uniform4f(uniforms.color, r, g, b, a);
        gl.uniformMatrix4fv(uniforms.transform, false, Matrix.Identity().m);
        gl.uniformMatrix4fv(uniforms.projection, false, projection.m);
        gl.uniform1f(uniforms.size, size);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(attributes.position, 4, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...position, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(attributes.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.drawArrays(gl.POINTS, 0, 1);
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
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    const simpleDraw = makeSimpleDrawProgram(gl);
    const drawSprite = makeSpriteProgram(gl);
    const keyboard = new Keyboard({
        "KeyW": "forward",
        "KeyS": "backward",
        "KeyA": "left",
        "KeyD": "right",
        "Space": "up",
        "ShiftLeft": "down",
        "KeyF": "turnDown",
        "KeyR": "turnUp",
        "KeyQ": "turnRight",
        "KeyE": "turnLeft",
    })
    function moveDirection(length: number) {
        const { left, right, up, down, forward, backward } = keyboard.keys;
        return Vector.Normilize([+right - +left, +up - +down, +backward - +forward], length)
    }
    function rotateDirection(length: number) {
        const { turnDown, turnLeft, turnRight, turnUp } = keyboard.keys;
        return Vector.Normilize([+turnUp - +turnDown, +turnRight - +turnLeft, 0], length)
    }
    const cube = Model.Cube(gl, 1);
    cube.transform.multiply(Matrix.Move(1.5, 0.5, -2));
    const textures = new TexturesManager(gl, images)
    // const windows = new WindowsManager(HTML.CreateElement("div", (el) => document.body.appendChild(el)), new StyleSheetTree(styleSheet))
    // windows.CreateInfoWindow("Shadow demo", HTML.CreateElement("article", HTML.SetText("TODO")))
    let lastTick = 0
    let frameId = -1;
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;
    const aspect = halfWidth / halfHeight;
    const ortoWidth = 10
    const ortographic = Matrix.Ortographic(-ortoWidth, ortoWidth, -ortoWidth / aspect, ortoWidth / aspect, 1000, -1000);
    const projectionPerspective = Matrix.Perspective(-0.9 * Math.PI, aspect, 0.1, 100);
    let time = 0;
    const camera = Matrix.Move(-2.5, 2.5, -2).multiply(Matrix.RotateY(-Math.PI/2)).multiply(Matrix.RotateX(-Math.PI/6));
    const cameraUpDown = Matrix.LookAt([0, 10, 0], [0, 0, 0], [0, 0, -1])
    const cameraCube = Model.Camera(gl, 0.1);
    cameraCube.transform = camera;
    const items = [
        {
            mesh: cube,
        },
        {
            mesh: cameraCube,
        }
    ]
    const viewports: {
        viewport: [number, number, number, number],
        projection: Matrix,
        camera: Matrix,
    }[] = [
            {
                viewport: [0, 0, halfWidth, halfHeight],
                projection: projectionPerspective,
                camera: cameraUpDown,
            },
            {
                viewport: [halfWidth, 0, halfWidth, halfHeight],
                projection: projectionPerspective,
                camera: camera,
            },
            {
                viewport: [0, halfHeight, halfWidth, halfHeight],
                projection: ortographic,
                camera: cameraUpDown,
            },
            {
                viewport: [halfWidth, halfHeight, halfWidth, halfHeight],
                projection: ortographic,
                camera: Matrix.Identity(),
            },
        ]
    const draw = (currentTick: number) => {
        const dt = (currentTick - lastTick) / 1000
        time += dt;
        lastTick = currentTick
        if (keyboard.totalPressed > 0) {
            const [dx, dy, dz] = moveDirection(dt)
            camera.multiply(Matrix.Move(dx, dy, dz));
            const [rx, ry, rz] = rotateDirection(dt)
            camera.multiply(Matrix.RotateX(rx).multiply(Matrix.RotateY(ry)))
            console.log(camera.position())
        }
        cube.transform
            // .multiply(Matrix.RotateX(dt))
            .multiply(Matrix.RotateY(3 * dt))
        // .multiply(Matrix.RotateZ(dt))

        gl.clearColor(0.1, 0.1, 0.1, 1.0)
        gl.clearDepth(1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        viewports.forEach(viewport => {
            gl.viewport(...viewport.viewport);
            const projection = Matrix.Multiply(viewport.projection, viewport.camera.inverse());
            items.forEach(item => {
                simpleDraw(projection, item.mesh, [1, 0, 0])
            })
        })
        frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
})

interface EventsSource {
    addEventListener(event: 'keyup' | 'keydown', listener: (ev: KeyboardEvent) => void): void
}

class Keyboard<T extends string> {
    totalPressed = 0
    keys: Record<T, boolean>
    constructor(mapping: Record<string, T>, parent: EventsSource = window) {
        const keys = Object.values(mapping);
        this.keys = Object.fromEntries(keys.map(key => ([key, false]))) as Record<T, boolean>;
        parent.addEventListener('keydown', (ev) => {
            const action = mapping[ev.code];
            if (action) {
                ev.preventDefault();
                if (!this.keys[action]) {
                    this.keys[action] = true;
                    ++this.totalPressed;
                }
            }
        })
        parent.addEventListener('keyup', (ev) => {
            const action = mapping[ev.code];
            if (action) {
                ev.preventDefault();
                if (this.keys[action]) {
                    this.keys[action] = false;
                    --this.totalPressed;
                }
            }
        })
    }
}
