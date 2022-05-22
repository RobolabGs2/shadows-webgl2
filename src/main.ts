import { downloadResources, loadSettingsFromURL, mapRecord } from "./utils"
import { Matrix, Vector } from "./geometry"
import { DecoreManager, Model, ModelsFactory } from "./model"
import * as Drawers from "./shaders/drawers"
import { Keyboard } from "./input"
import { Mesh } from "./mesh"
import { TransformLookAt, TransformMatrixes, TransformProjectorTail, Transform } from "./transform"
import { Layers, setupViewports } from "./viewports"

type UnwrapMakerFunctions<T> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? ReturnType<T[K]> : unknown
}

export class Projector {
    public projection = Matrix.Perspective(this.angle, 1, 0.1, this.maxDistance)
    constructor(
        public transform: TransformLookAt,
        public angle: number,
        public maxDistance: number,
    ) { }
}

downloadResources({ skull: './skull.jpg' }, { skull: './skull.obj' }).then(({ images, files }) => {
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

    const drawWithShadow: { layers: Layers; draw: (projection: Matrix, camera: Matrix, mesh: Mesh, models: Model[]) => void } = {
        layers: Layers.Main,
        draw: (projection, camera, mesh, models) => drawer.lightingProjector(projection, mesh, models, projector, camera.position(), 10),
    }
    const debugDrawStroke: { layers: Layers; draw: (projection: Matrix, camera: Matrix, mesh: Mesh, models: Model[]) => void } = {
        layers: Layers.DebugStroke,
        draw: (projection, camera, mesh, models) => drawer.simple(projection, mesh, models, false, true),
    }
    const debugDrawFill: { layers: Layers; draw: (projection: Matrix, camera: Matrix, mesh: Mesh, models: Model[]) => void } = {
        layers: Layers.DebugFill,
        draw: (projection, camera, mesh, models) => drawer.normalDebug(projection, mesh, models),
    }

    const models = new ModelsFactory({
        cube: Mesh.Cube(gl),
        debugCube: Mesh.DebugCube(gl),
        camera: Mesh.Camera(gl),
        skull: Mesh.fromObj(gl, files.skull, images.skull),
    },
        {
            cube: [drawWithShadow, debugDrawStroke, debugDrawFill],
            skull: [drawWithShadow, debugDrawStroke, debugDrawFill],
            camera: [{ layers: Layers.Debug, draw: (projection, camera, mesh, models) => drawer.simple(projection, mesh, models, false, true) }],
            debugCube: [{ layers: Layers.Debug, draw: (projection, camera, mesh, models) => drawer.simple(projection, mesh, models, false, true) }],
        }
    );
    const decore = new DecoreManager<Layers>({
        sprite: [{
            layers: Layers.All,
            draw: (p, c, sprite) => drawer.sprite(p, sprite.transform.matrix.position(), sprite.color, sprite.size)
        }]
    })
    models.add('cube', {
        diffuseColor: [0.8, 0.8, 0.8],
        specularColor: [1, 1, 1],
        specular: 100,
    }, { scale: 10, x: 2, y: -7 });
    models.add('cube', {
        diffuseColor: [0, 1, 0],
        specularColor: [1, 1, 1],
        specular: 100,
    }, { scale: 1, x: 1, y: -0.5 });
    const lightTarget = models.add('cube', {
        diffuseColor: [0, 0, 1],
        specularColor: [1, 1, 1],
        specular: 100,
    }, { scale: 1, x: 5, y: 0.5 });
    models.add('cube', {
        diffuseColor: [1, 0, 0],
        specularColor: [1, 1, 1],
        specular: 100,
    }, { scale: 1, x: 3, y: 0.5 });
    models.add('cube', {
        diffuseColor: [0.8, 0.8, 0.8],
        specularColor: [1, 1, 0],
        specular: 100,
    }, { scale: 20, x: 17.5, y: 0.5 });
    const camera = new TransformMatrixes(Matrix.Move(-4.5, 0.5, -4), Matrix.RotateY(5 * Math.PI / 4));
    models.add('skull',
        {
            diffuseColor: [1, 0.5, 0.5],
            specularColor: [0.5, 1, 1],
            specular: 1000,
            debugColor: [0, 0, 1],
            useTexture: true
        },
        {
            scale: 0.05, x: 3, y: -1, z: -2,
            angleX: -Math.PI / 2,
            angleZ: -Math.PI / 2,
        }
    );
    models.add('skull',
        {
            diffuseColor: [1, 0.2, 0.0],
            specularColor: [0.5, 1, 1],
            specular: 1000,
            debugColor: [0, 0, 1],
            useTexture: false
        },
        {
            scale: 0.01,
            angleX: -Math.PI / 2,
            angleZ: Math.PI,
            parent: new TransformLookAt(camera, [3, 1, 0], [0, 1, 0])
        }
    );
    const projector = new Projector(new TransformLookAt(lightTarget.transform, [0, 0, 0]), Math.PI / 2, 100000)
    models.add('skull',
        {
            diffuseColor: [1, 0.5, 0.5],
            specularColor: [0.5, 1, 1],
            specular: 1000,
            debugColor: [0, 0, 1],
            useTexture: true
        },
        {
            scale: 0.02, x: 0, y: 0, z: 0,
            angleX: -Math.PI / 2,
            angleZ: Math.PI,
            parent: new TransformLookAt(projector.transform, [1, 0, 0], [0, 1, 0])
        }
    );
    decore.addSprite(16, [0.5, 0.5, 0], { parent: projector.transform })
    decore.addCustom(Layers.Special, () => drawer.texture(10));
    const projectionPerspective = Matrix.Perspective(Math.PI / 4, canvas.width/canvas.height, 0.1, 150);
    makeCameraModels(models, camera, projectionPerspective)
    models.add('debugCube', { diffuseColor: [0, 0, 0], debugColor: [1, 1, 0], specular: 0, specularColor: [0, 0, 0] },
        {
            parent: new TransformProjectorTail(projector.transform, projector.projection),
        });

    const viewports = setupViewports(canvas.width, canvas.height, camera, projector);
    let lastTick = 0
    let frameId = -1;
    let time = 0;
    const keyboard = new DemoKeyboard();
    const shadowsT = initShadowMap(gl, models, ["cube", "skull"]);
    const draw = (currentTick: number) => {
        const dt = (currentTick - lastTick) / 1000
        time += dt;
        lastTick = currentTick
        const rotationCenter = [1, -0.5, 0] as [number, number, number];
        rotationCenter[0] += 3 * Math.cos(time / 2);
        rotationCenter[1] += 0.5 * Math.cos(time / 2);
        rotationCenter[2] += 3 * Math.sin(time / 2);
        projector.transform.pos = rotationCenter;
        if (keyboard.totalPressed > 0) {
            let [dx, dy, dz] = keyboard.moveDirection(dt);
            const speed = keyboard.keys.speed ? 4 : 1;
            [dx, dy, dz] = camera.rotate.multiplyVector([dx, dy, dz, 1]);
            camera.shift.multiply(Matrix.Move(dx * speed, dy * speed, dz * speed));
            const [rx, ry, rz] = keyboard.rotateDirection(dt)
            camera.rotate.multiply(Matrix.RotateX(rx).multiply(Matrix.RotateY(ry)))
        }

        shadowsT.updator(projector);
        gl.activeTexture(gl.TEXTURE10);
        gl.bindTexture(gl.TEXTURE_2D, shadowsT.texture);
        gl.clearColor(0.1, 0.1, 0.1, 1.0)
        gl.clearDepth(1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        viewports.active.forEach(viewport => {
            gl.viewport(...viewport.viewport);
            const cameraMatrix = viewport.camera.matrix;
            const projection = Matrix.Multiply(viewport.projection, cameraMatrix.inverse());
            models.draw(projection, cameraMatrix, viewport.layers);
            decore.draw(projection, cameraMatrix, viewport.layers);
        })
        gl.activeTexture(gl.TEXTURE10);
        gl.bindTexture(gl.TEXTURE_2D, null);
        frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
})

function initShadowMap<M extends string>(gl: WebGL2RenderingContext, models: ModelsFactory<M, Layers>, shadowKeys: M[]) {
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

    return {
        texture: depthTexture,
        updator: (projector: Projector) => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
            gl.viewport(0, 0, depthTextureSize, depthTextureSize);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const p = Matrix.Multiply(projector.projection, projector.transform.matrix.inverse())
            shadowKeys.forEach(type => {
                shader(p, models.meshes[type], models.models[type]);
            })
            // now draw scene to the canvas projecting the depth texture into the scene
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
}

class DemoKeyboard extends Keyboard<"forward"|"backward"|"left"|"right"|"up"|"down"|"turnDown"|"turnUp"|"turnRight"|"turnLeft"|"speed"> {
    constructor() {
        super({
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
    }
    moveDirection(length: number) {
        const { left, right, up, down, forward, backward } = this.keys;
        return Vector.Normilize([+right - +left, +up - +down, +backward - +forward], length)
    }
    rotateDirection(length: number) {
        const { turnDown, turnLeft, turnRight, turnUp } = this.keys;
        return Vector.Normilize([+turnUp - +turnDown, +turnRight - +turnLeft, 0], length)
    }
}
function makeCameraModels(models: ModelsFactory<"cube" | "debugCube" | "camera" | "skull", Layers>, camera: TransformMatrixes, projectionPerspective: Matrix) {
    models.add('camera', { diffuseColor: [0, 0, 0], debugColor: [1, 1, 1], specular: 0, specularColor: [0, 0, 0] }, {
        scale: 0.1, parent: camera
    })
    models.add('debugCube', { diffuseColor: [0, 0, 0], debugColor: [1, 1, 1], specular: 0, specularColor: [0, 0, 0] },
        {
            parent: new TransformProjectorTail(camera, projectionPerspective),
        })
}
