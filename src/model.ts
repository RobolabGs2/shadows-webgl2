import { Matrix, Vector } from "./geometry";
import { mapRecord } from "./utils";
import { Mesh } from "./mesh";
import { Transform, TransformMatrixes } from "./transform";

export type Material = {
    diffuseColor: Vector<3>;
    specularColor: Vector<3>;
    specular: number;
    debugColor?: Vector<3>;
    useTexture?: boolean;
}

export class Model {
    constructor(
        public material: Material,
        public transform: Transform,
    ) { }
}

export class Sprite {
    constructor(
        readonly transform: Transform,
        readonly color: [number, number, number, number?],
        readonly size: number,
    ) { }
}

export class ModelsFactory<M extends string, Layer extends number> {
    readonly models: Record<M, Model[]>;
    readonly types: M[];
    constructor(
        public meshes: Record<M, Mesh>,
        public drawers: Record<M, { layers: Layer, draw: (projection: Matrix, camera: Matrix, mesh: Mesh, models: Model[]) => void }[]>,
    ) {
        this.models = mapRecord(meshes, () => new Array<Model>());
        this.types = Object.keys(meshes) as M[];
    }
    add(type: M, material: Material, transform: {
        x?: number; y?: number; z?: number;
        angleX?: number; angleY?: number; angleZ?: number;
        scale?: number;
        parent?: Transform,
    } = {}) {
        const {
            x = 0, y = 0, z = 0,
            angleX = 0, angleY = 0, angleZ = 0,
            scale = 1, parent,
        } = transform;
        const model = new Model(material, new TransformMatrixes(
            Matrix.Move(x, y, z),
            Matrix.RotateX(angleX).multiply(Matrix.RotateY(angleY)).multiply(Matrix.RotateZ(angleZ)),
            Matrix.Scale(scale),
            parent)
        );
        this.models[type].push(model);
        return model;
    }
    draw(projection: Matrix, camera: Matrix, layer: Layer) {
        this.types.forEach(type => {
            this.drawers[type]
                .filter(({ layers }) => layers & layer)
                .forEach(({ draw }) => {
                    draw(projection, camera, this.meshes[type], this.models[type]);
                })
        })
    }
}

export class DecoreManager<Layer extends number> {
    constructor(
        public drawers: {
            'sprite': { layers: Layer, draw: (projection: Matrix, camera: Matrix, sprite: Sprite) => void }[],
        }
    ) {
    }

    readonly sprites = new Array<Sprite>();
    addSprite(size: number, material: [number, number, number, number?], transform: {
        x?: number; y?: number; z?: number;
        parent?: Transform,
    } = {}) {
        const {
            x = 0, y = 0, z = 0, parent,
        } = transform;
        const sprite = new Sprite(
            new TransformMatrixes(Matrix.Move(x, y, z), Matrix.Identity(), Matrix.Identity(), parent),
            material, size
        );
        this.sprites.push(sprite);
        return sprite;
    }
    readonly custom = new Array<{ layers: Layer, draw: (projection: Matrix, camera: Matrix) => void }>();
    addCustom(layer: Layer, drawer: (projection: Matrix, camera: Matrix) => void) {
        return this.custom.push({ layers: layer, draw: drawer });
    }
    draw(projection: Matrix, camera: Matrix, layer: Layer) {
        this.sprites.forEach(sprite => {
            this.drawers.sprite
                .filter(({ layers }) => layers & layer)
                .forEach(({ draw }) => {
                    draw(projection, camera, sprite);
                })
        })
        this.custom.filter(({ layers }) => layers & layer).forEach(({ draw }) => draw(projection, camera));
    }
}
