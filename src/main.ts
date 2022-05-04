import { HTML } from "./web/html"
import { downloadImages, mapRecord } from "./utils"
import { ProgramWrapper, TexturesManager } from "./webgl"
import { StyleSheetTree, WindowsManager } from "./web/windows"
import { Matrix, Vector } from "./geometry"
import { Model } from "./model"
import * as Drawers from "./drawers"
import { Keyboard } from "./input"

type UnwrapMakerFunctions<T> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? ReturnType<T[K]> : unknown
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
    gl.enable(gl.CULL_FACE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const drawer = mapRecord(Drawers, maker => maker(gl)) as UnwrapMakerFunctions<typeof Drawers>;
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
    const cube1 = Model.Cube(gl, 1, {
        diffuseColor: [0, 1, 0],
        specularColor: [1, 1, 1],
        specular: 100,
    });
    const cube2 = Model.Cube(gl, 1, {
        diffuseColor: [0, 0, 1],
        specularColor: [1, 1, 1],
        specular: 100,
    });
    const cube3 = Model.Cube(gl, 1, {
        diffuseColor: [1, 0, 0],
        specularColor: [1, 1, 1],
        specular: 100,
    });
    cube1.transform.multiply(Matrix.Move(1.5, 0.5, -2));
    cube2.transform.multiply(Matrix.Move(1.5, 0.5, 2));
    cube3.transform.multiply(Matrix.Move(1.5, 0.5, 0));
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
    const camera = Matrix.Move(-3.5, 2.5, 0).multiply(Matrix.RotateY(-Math.PI / 2)).multiply(Matrix.RotateX(-Math.PI / 6));
    const cameraUpDown = Matrix.LookAt([0, 10, 0], [0, 0, 0], [0, 0, -1])
    const cameraCube = Model.Camera(gl, 0.1, [1, 1, 1]);
    cameraCube.transform = camera;
    const light: [number, number, number] = [1.5, 3, -2];
    const items = [
        {
            draw: (projection: Matrix) => drawer.lightingPoint(projection, cube1, light, camera.position()),
        },
        {
            draw: (projection: Matrix) => drawer.lightingPoint(projection, cube2, light, camera.position()),
        },
        {
            draw: (projection: Matrix) => drawer.lightingPoint(projection, cube3, light, camera.position()),
        },
        {
            // mesh: cameraCube,
            draw: (projection: Matrix) => drawer.simple(projection, cameraCube),
        },
        {
            draw: (projection: Matrix) => drawer.sprite(projection, light, [0.5, 0.5, 0])
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
        const cubePos = cube3.transform.position();
        light[0] = cubePos[0] + 1 * Math.cos(time / 2);
        light[1] = cubePos[1] + 0.5 * Math.cos(time / 2);
        light[2] = cubePos[2] + 1 * Math.sin(time / 2);
        if (keyboard.totalPressed > 0) {
            const [dx, dy, dz] = moveDirection(dt)
            camera.multiply(Matrix.Move(dx, dy, dz));
            const [rx, ry, rz] = rotateDirection(dt)
            camera.multiply(Matrix.RotateX(rx).multiply(Matrix.RotateY(ry)))
            console.log(camera.position())
        }
        cube1.transform
        // .multiply(Matrix.RotateX(dt))
        // .multiply(Matrix.RotateY(3 * dt))
        // .multiply(Matrix.RotateZ(dt))

        gl.clearColor(0.1, 0.1, 0.1, 1.0)
        gl.clearDepth(1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        viewports.forEach(viewport => {
            gl.viewport(...viewport.viewport);
            const projection = Matrix.Multiply(viewport.projection, viewport.camera.inverse());
            items.forEach(item => {
                item.draw(projection)
            })
        })
        frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
})
