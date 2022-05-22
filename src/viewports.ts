import { Matrix } from "./geometry";
import { Projector } from "./main";
import { TransformMatrixes, TransformLookAt, Transform } from "./transform";
import { loadSettingsFromURL } from "./utils";

export enum Layers {
    Main = 1,
    DebugStroke = 2,
    DebugFill = 4,
    Debug = DebugStroke | DebugFill,
    All = 255,
    Special = 256,
}

export function setupViewports(width: number, height: number, camera: TransformMatrixes, projector: Projector) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const aspect = halfWidth / halfHeight;
    const ortoWidth = 10
    const ortographic = Matrix.Ortographic(-ortoWidth, ortoWidth, -ortoWidth / aspect, ortoWidth / aspect, 100, -100);
    const cameraUpDown = new TransformLookAt(new TransformMatrixes(Matrix.Move(0, 0, 0)), [0, 10, 0], [0, 0, -1])

    const viewportsPresets: Record<'debug' | 'half' | 'full', {
        viewport: [number, number, number, number],
        projection: Matrix,
        camera: Transform,
        layers: Layers,
    }[]> = {
        debug: [
            {
                viewport: [0, halfHeight, halfWidth, halfHeight],
                projection: ortographic,
                camera: cameraUpDown,
                layers: Layers.Special,
            }, {
                viewport: [halfWidth, 0, halfWidth, halfHeight],
                projection: Matrix.Perspective(Math.PI / 4, halfWidth / halfHeight, 0.1, 150),
                camera: camera,
                layers: Layers.Main,
            }, {
                viewport: [halfWidth, halfHeight, halfWidth, halfHeight],
                projection: Matrix.Perspective(Math.PI / 4, halfWidth / halfHeight, 0.1, 150),
                camera: camera,
                layers: Layers.Main | Layers.DebugStroke,
            }, {
                viewport: [0, 0, halfWidth, halfHeight],
                projection: projector.projection,
                camera: projector.transform,
                layers: Layers.Main,
            },

        ],
        half: [
            {
                viewport: [halfWidth, 0, halfWidth, 2 * halfHeight],
                projection: Matrix.Perspective(Math.PI / 4, halfWidth / height, 0.1, 150),
                camera: camera,
                layers: Layers.Main,
            },
            {
                viewport: [0, 0, halfWidth, 2 * halfHeight],
                projection: Matrix.Perspective(Math.PI / 4, halfWidth / height, 0.1, 150),
                camera: camera,
                layers: Layers.Debug,
            },
        ],
        full: [
            {
                viewport: [0, 0, width, height],
                projection: Matrix.Perspective(Math.PI / 4, width / height, 0.1, 150),
                camera: camera,
                layers: Layers.Main,
            },
        ],
    }
    let viewports = { active: viewportsPresets.full, presets: viewportsPresets };
    {
        const viewportsMapping = [undefined, viewportsPresets.full, viewportsPresets.half, viewportsPresets.debug];
        const layersMapping = [undefined, Layers.Main, Layers.Debug, Layers.DebugStroke | Layers.Main, Layers.Special]
        window.addEventListener('keydown', (ev) => {
            if (!ev.code.startsWith('Digit')) return;
            const digit = Number(ev.code.substring('Digit'.length));
            if (ev.shiftKey) viewports.active[0].layers = layersMapping[digit] || viewports.active[0].layers
            else viewports.active = viewportsMapping[digit] || viewports.active
        })
        const { viewport } = loadSettingsFromURL({ viewport: 1 });
        viewports.active = viewportsMapping[viewport] || viewports.active;
    }
    return viewports;
}