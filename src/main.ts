import { HTML } from "./web/html"
import { downloadImages, downloadResources, mapRecord } from "./utils"
import { ProgramWrapper, TexturesManager } from "./webgl"
import { StyleSheetTree, WindowsManager } from "./web/windows"
import { Matrix, Vector } from "./geometry"
import { Model } from "./model"
import * as Drawers from "./drawers"
import { Keyboard } from "./input"
import testTextureUrl from "./test_texture.png"

type UnwrapMakerFunctions<T> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? ReturnType<T[K]> : unknown
}

enum Layers {
    Main = 1,
    Debug = 2,
    All = 255,
    Special = 256,
}

export class Projector {
    public projection = Matrix.Perspective(this.angle, 1, 0.1, this.maxDistance)
    constructor(
        public transform: Matrix,
        public angle: number,
        public maxDistance: number,
    ) { }
}

function shadowsTest(gl: WebGL2RenderingContext) {
    const depthTexture = gl.createTexture();
    const depthTextureSize = 1024;
    const shader = Drawers.shadowMap(gl);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // mip level
        gl.DEPTH_COMPONENT32F, // internal format
        depthTextureSize,   // width
        depthTextureSize,   // height
        0,                  // border
        gl.DEPTH_COMPONENT, // format
        gl.FLOAT,           // type
        null);              // data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const depthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,       // target
        gl.DEPTH_ATTACHMENT,  // attachment point
        gl.TEXTURE_2D,        // texture target
        depthTexture,         // texture
        0);                   // mip level

    const sampler = gl.createSampler()!;
    gl.bindSampler(10, sampler);
    gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return {
        texture: depthTexture,
        updator: (projector: Projector, items: Model[]) => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
            gl.viewport(0, 0, depthTextureSize, depthTextureSize);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const p = Matrix.Multiply(projector.projection, projector.transform.inverse())
            items.forEach(model => {
                shader(p, model)
            })
            // now draw scene to the canvas projecting the depth texture into the scene
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
}

downloadResources({ test: testTextureUrl }, { skull: './skull.obj' })
    .then(({ images, files }) => {
        // const styleSheet = document.querySelector("style")!.sheet!

        const canvas = document.querySelector("canvas")!
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        document.body.appendChild(canvas)
        const gl = canvas.getContext("webgl2")!
        // gl.enable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        const drawer = mapRecord(Drawers, maker => {
            try {
                return maker(gl);
            } catch (err: any) {
                throw new Error(`Failed init Drawer.${maker.name}: ${err}`);
            }
        }) as UnwrapMakerFunctions<typeof Drawers>;
        const keyboard = new Keyboard({
            "KeyW": "forward",
            "KeyS": "backward",
            "KeyA": "left",
            "KeyD": "right",
            "Space": "up",
            "KeyV": "down",
            "KeyF": "turnDown",
            "KeyR": "turnUp",
            "KeyQ": "turnRight",
            "KeyE": "turnLeft",
            "ShiftLeft": "speed",
        })
        function moveDirection(length: number) {
            const { left, right, up, down, forward, backward } = keyboard.keys;
            return Vector.Normilize([+right - +left, +up - +down, +backward - +forward], length)
        }
        function rotateDirection(length: number) {
            const { turnDown, turnLeft, turnRight, turnUp } = keyboard.keys;
            return Vector.Normilize([+turnUp - +turnDown, +turnRight - +turnLeft, 0], length)
        }
        const cubes = [
            Model.Cube(gl, 10, {
                diffuseColor: [0.8, 0.8, 0.8],
                specularColor: [1, 1, 1],
                specular: 100,
            }),
            Model.Cube(gl, 1, {
                diffuseColor: [0, 1, 0],
                specularColor: [1, 1, 1],
                specular: 100,
            }),
            Model.Cube(gl, 1, {
                diffuseColor: [0, 0, 1],
                specularColor: [1, 1, 1],
                specular: 100,
            }),
            Model.Cube(gl, 1, {
                diffuseColor: [1, 0, 0],
                specularColor: [1, 1, 1],
                specular: 100,
            }),
            Model.Cube(gl, 10, {
                diffuseColor: [0.8, 0.8, 0.8],
                specularColor: [1, 1, 1],
                specular: 100,
            }),
            Model.fromObj(gl, files.skull,
                Matrix.Move(3, -1, -2)
                    .multiply(Matrix.RotateX(-Math.PI / 2))
                    .multiply(Matrix.RotateZ(-Math.PI / 2))
                    .multiply(Matrix.Scale(0.05))
            )
        ]
        cubes[0].transform.multiply(Matrix.Move(2, -7, 0));
        cubes[1].transform.multiply(Matrix.Move(1, -0.5, 0));
        cubes[2].transform.multiply(Matrix.Move(5, 0.5, 0));
        cubes[3].transform.multiply(Matrix.Move(3, 0.5, 0));
        cubes[4].transform.multiply(Matrix.Move(7 + 7, 0.5, 0));
        const textures = new TexturesManager(gl, images)
        // const windows = new WindowsManager(HTML.CreateElement("div", (el) => document.body.appendChild(el)), new StyleSheetTree(styleSheet))
        // windows.CreateInfoWindow("Shadow demo", HTML.CreateElement("article", HTML.SetText("TODO")))
        let lastTick = 0
        let frameId = -1;
        const halfWidth = canvas.width / 2;
        const halfHeight = canvas.height / 2;
        const aspect = halfWidth / (halfHeight); // TODO 
        const ortoWidth = 10
        const ortographic = Matrix.Ortographic(-ortoWidth, ortoWidth, -ortoWidth / aspect, ortoWidth / aspect, 10000, -100000);
        const projectionPerspective = Matrix.Perspective(Math.PI / 4, aspect, 0.1, 1500);
        let time = 0;
        // const camera = Matrix.Move(-3.5, 2.5, 0).multiply(Matrix.RotateY(-Math.PI / 2)).multiply(Matrix.RotateX(-Math.PI / 6));
        const camera = Matrix.Move(-4.5, 0.5, -4).multiply(Matrix.RotateY(5 * Math.PI / 4));
        const cameraUpDown = Matrix.LookAt([0, 10, 0], [0, 0, 0], [0, 0, -1])
        const cameraCube = Model.Camera(gl, 0.1, [1, 1, 1]);
        cameraCube.transform = camera;
        const light: [number, number, number] = [1.5, 3, -2];
        const cameraView = Model.DebugCube(gl);
        const projector = new Projector(Matrix.Identity(), Math.PI / 2, 1000)
        const shadowsT = shadowsTest(gl);
        const items = [
            // { draw: (projection: Matrix) => drawer.lightingPoint(projection, cube1, light, camera.position()), },
            // { draw: (projection: Matrix) => drawer.lightingPoint(projection, cube2, light, camera.position()), },
            // { draw: (projection: Matrix) => drawer.lightingPoint(projection, cube3, light, camera.position()), },
            ...cubes.map(cube => ({ draw: (projection: Matrix) => drawer.lightingProjector(projection, cube, projector, camera.position(), 10), layers: Layers.Main })),
            ...cubes.map(cube => ({ draw: (projection: Matrix) => drawer.simple(projection, cube, true, true), layers: Layers.Debug })),
            // ...cubes.map(cube => ({ draw: (projection: Matrix) => drawer.lightingProjectorDebug(projection, cube, projector, camera.position(), 10), layers: Layers.Debug })),
            {
                // mesh: cameraCube,
                draw: (projection: Matrix) => {
                    drawer.simple(projection, cameraCube, false, true);
                    Matrix.Multiply(camera, projectionPerspective.inverse(), cameraView.transform);
                    drawer.simple(projection, cameraView, false, true);
                },
                layers: Layers.Debug,
            },
            {
                draw: (projection: Matrix) => {
                    Matrix.Multiply(projector.transform, Matrix.Identity(), cameraView.transform);
                    // drawer.simple(projection, cameraView);
                    Matrix.Multiply(projector.transform, projector.projection.inverse(), cameraView.transform);
                    drawer.simple(projection, cameraView, false, true);
                },
                layers: Layers.Debug,
            },
            {
                draw: (projection: Matrix) => drawer.sprite(projection, light, [0.5, 0.5, 0]),
                layers: Layers.All,
            },
            {
                draw: () => {
                    drawer.texture(10);
                },
                layers: Layers.Special,
            }
        ]

        const viewportsPresets: Record<'debug' | 'half' | 'full', {
            viewport: [number, number, number, number],
            projection: Matrix,
            camera: Matrix,
            layers: Layers,
        }[]> = {
            debug: [
                {
                    viewport: [0, 0, halfWidth, halfHeight],
                    projection: projectionPerspective,
                    camera: cameraUpDown,
                    layers: Layers.Special,
                },
                {
                    viewport: [halfWidth, 0, halfWidth, halfHeight],
                    projection: projectionPerspective,
                    camera: camera,
                    layers: Layers.Main,
                },
                {
                    viewport: [0, halfHeight, halfWidth, halfHeight],
                    projection: ortographic,
                    camera: cameraUpDown,
                    layers: Layers.Debug,
                },
                // {
                //     viewport: [halfWidth, halfHeight, halfWidth, halfHeight],
                //     projection: ortographic,
                //     camera: Matrix.Identity(),
                //     layers: Layers.All,
                // },
                {
                    viewport: [halfWidth, halfHeight, halfWidth, halfHeight],
                    projection: projectionPerspective,
                    camera: camera,
                    layers: Layers.Debug,
                },
            ],
            half: [
                {
                    viewport: [halfWidth, 0, halfWidth, 2 * halfHeight],
                    projection: projectionPerspective,
                    camera: camera,
                    layers: Layers.Main,
                },
                {
                    viewport: [0, 0, halfWidth, 2 * halfHeight],
                    projection: projectionPerspective,
                    camera: camera,
                    layers: Layers.Debug,
                },
            ],
            full: [
                {
                    viewport: [0, 0, 2 * halfWidth, 2 * halfHeight],
                    projection: projectionPerspective,
                    camera: camera,
                    layers: Layers.Main,
                },
            ],
        }

        const viewports: {
            viewport: [number, number, number, number],
            projection: Matrix,
            camera: Matrix,
            layers: Layers,
        }[] = viewportsPresets.full;
        const draw = (currentTick: number) => {
            const dt = (currentTick - lastTick) / 1000
            time += dt;
            lastTick = currentTick
            const cubePos = cubes[1].transform.position();
            light[0] = cubePos[0] + 3 * Math.cos(time / 2);
            light[1] = cubePos[1] + 0.5 * Math.cos(time / 2);
            light[2] = cubePos[2] + 3 * Math.sin(time / 2);
            projector.transform = Matrix.LookAt(light, cubes[2].transform.position(), [0, 1, 0]);
            if (keyboard.totalPressed > 0) {
                const [dx, dy, dz] = moveDirection(dt);
                const speed = keyboard.keys.speed ? 4 : 1;
                camera.multiply(Matrix.Move(dx * speed, dy * speed, dz * speed));
                const [rx, ry, rz] = rotateDirection(dt)
                camera.multiply(Matrix.RotateX(rx).multiply(Matrix.RotateY(ry)))
            }

            shadowsT.updator(projector, cubes);
            gl.activeTexture(gl.TEXTURE10);
            gl.bindTexture(gl.TEXTURE_2D, shadowsT.texture);
            gl.clearColor(0.1, 0.1, 0.1, 1.0)
            gl.clearDepth(1.0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            viewports.forEach(viewport => {
                gl.viewport(...viewport.viewport);
                const projection = Matrix.Multiply(viewport.projection, viewport.camera.inverse());
                items.forEach(item => {
                    if ((item.layers || Layers.All) & viewport.layers)
                        item.draw(projection)
                })
            })
            gl.activeTexture(gl.TEXTURE10);
            gl.bindTexture(gl.TEXTURE_2D, null);
            frameId = requestAnimationFrame(draw)
        }
        frameId = requestAnimationFrame(draw)
    })
