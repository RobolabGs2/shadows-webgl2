import { mapRecord } from "./utils";

export class ProgramWrapper<U extends string, Attrs extends string> {
    public readonly program: WebGLProgram
    public readonly uniforms: Record<U, WebGLUniformLocation>
    public readonly attributes: Record<Attrs, GLint>
    constructor(
        protected gl: WebGL2RenderingContext,
        { vertex, fragment }: { vertex: string, fragment: string },
        uniforms: Record<U, string>,
        attributes: Record<Attrs, string>,
    ) {
        try {
            this.program = initShaderProgram(gl, vertex, fragment);
            this.uniforms = getUniforms(gl, this.program, uniforms);
            this.attributes = getAttributes(gl, this.program, attributes);

            const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
            const uniformsNames = new Set(Object.values(uniforms));
            for (let i = 0; i < numUniforms; ++i) {
                const { name, type } = gl.getActiveUniform(this.program, i)!;
                if (!uniformsNames.has(name))
                    console.warn(`Not used uniform ${name} (${type}) in ${this.constructor.name}`);
            }

            const numAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
            const attributesNames = new Set(Object.values(attributes));
            for (let i = 0; i < numAttributes; ++i) {
                const { name, type } = gl.getActiveAttrib(this.program, i)!;
                if (!attributesNames.has(name))
                    console.warn(`Not used attribute ${name} (${type}) in ${this.constructor.name}`);
            }
        } catch (err: any) {
            throw new Error(`Failed create program ${this.constructor.name}: ${err}`);
        }
    }
}

export class TexturesManager<Ids extends string> {
    private readonly textures: Record<Ids, number>
    constructor(gl: WebGL2RenderingContext, texturesMap: Record<Ids, TexImageSource>) {
        let textureId = 0;
        this.textures = mapRecord(texturesMap, (image) => {
            const label = (gl as any)[`TEXTURE${textureId}`] as number || undefined
            if (label === undefined)
                throw new Error(`Textures overflow`);
            gl.activeTexture(label);
            const texture = createTexture(gl, image);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return textureId++
        })
    }
    public get(id: Ids): number {
        return this.textures[id]
    }
}

function createTexture(gl: WebGL2RenderingContext, img: TexImageSource) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

function getUniforms<T extends string>(gl: WebGL2RenderingContext, program: WebGLProgram, uniforms: Record<T, string>): Record<T, WebGLUniformLocation> {
    return mapRecord(uniforms, (name) => {
        const uniform = gl.getUniformLocation(program, name);
        if (uniform === null)
            throw new Error(`Not found uniform ${name}`);
        return uniform;
    });
}

function getAttributes<T extends string>(gl: WebGL2RenderingContext, program: WebGLProgram, uniforms: Record<T, string>): Record<T, GLint> {
    return mapRecord(uniforms, (name) => {
        const attr = gl.getAttribLocation(program, name);
        if (attr === null)
            throw new Error(`Not found attribute ${name}`);
        return attr;
    });
}

// Функция загрузки шейдера
function loadShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
    // Создаём шейдер
    const shader = gl.createShader(type);
    if (!shader)
        throw new Error(`Failed to compile the shader of type ${type}:\n${source}`)
    // Компилируем шейдер
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Обрабатываем ошибки
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    }

    return shader;
}

// Функция инициализации шейдерной программы
function initShaderProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string) {
    // Загружаем вершинный шейдер
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    // Загружаем фрагментный шейдер
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    //Создаём программу и прикрепляем шейдеры к ней
    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Обрабатываем ошибки
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw new Error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    }
    return shaderProgram;
}
