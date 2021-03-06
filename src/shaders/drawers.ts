import { ProgramWrapper } from "../webgl"
import { Model } from "../model"
import { Matrix, Vector } from "../geometry"


import simpleVert from "./simple.vert"
import fillColorFrag from "./fill_color.frag"

export const simple = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: simpleVert, fragment: fillColorFrag },
        { color: "u_color", transform: "u_transform", projection: "u_projection" },
        { position: "a_position" }
    )
    return (projection: Matrix, mesh: Mesh, models: Model[], fill = true, stroke = false) => {
        gl.useProgram(program);
        gl.bindVertexArray(mesh.vao);

        for (const model of models) {
            const { diffuseColor: [r, g, b], debugColor: [dr, dg, db] = [r, g, b] } = model.material
            gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
            gl.uniformMatrix4fv(uniforms.projection, false, projection.m);

            if (fill) {
                gl.uniform4f(uniforms.color, r, g, b, 1);
                gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
            }
            if (stroke) {
                gl.uniform4f(uniforms.color, dr, dg, db, 1);
                gl.drawElements(gl.LINES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
            }
        }

        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

import normalDebugVert from "./normal_debug.vert";
import fillColorAttrFrag from "./fill_color_in.frag";

export const normalDebug = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: normalDebugVert, fragment: fillColorAttrFrag },
        { transform: "u_transform", projection: "u_projection" },
        { position: "a_position" }
    )
    return (projection: Matrix, mesh: Mesh, models: Model[]) => {
        gl.useProgram(program);
        gl.bindVertexArray(mesh.vao);

        for (const model of models) {
            gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
            gl.uniformMatrix4fv(uniforms.projection, false, projection.m);

            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

import lightingProjectorVert from "./lighting_projector.vert";
import lightingProjectorFrag from "./lighting_projector.frag";
import { Projector } from "../main"

export const lightingProjector = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: lightingProjectorVert, fragment: lightingProjectorFrag },
        {
            transform: "u_transform", projection: "u_projection",
            view: "u_viewPosition",
            diffuseColor: "mat.diffuseColor",
            specularColor: "mat.specularColor",
            specular: "mat.specular",
            enableTexture: "mat.hasTexture",
            texture: "textureSampler",
            projectorTransform: "u_projector.transform",
            projectorAngle: "u_projector.angle",
            projectorProjection: "u_projector.projection",
            shadowMap: "shadowMap",
        },
        { position: "a_position" }
    )
    const sampler = gl.createSampler()!;
    gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return (projection: Matrix, mesh: Mesh, models: Model[], projector: Projector, viewPos: Vector<3>, shadowMap: number) => {
        gl.useProgram(program);
        gl.bindVertexArray(mesh.vao);
        gl.bindSampler(10, sampler);

        gl.uniformMatrix4fv(uniforms.projection, false, projection.m);
        gl.uniformMatrix4fv(uniforms.projectorTransform, false, projector.transform.m);
        gl.uniformMatrix4fv(uniforms.projectorProjection, false, projector.projection.m);
        gl.uniform1f(uniforms.projectorAngle, projector.angle);
        gl.uniform3f(uniforms.view, viewPos[0], viewPos[1], viewPos[2]);
        gl.uniform1i(uniforms.shadowMap, shadowMap);


        if (mesh.texture) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
            gl.uniform1i(uniforms.texture, 1);
        }
        for (const model of models) {
            gl.uniform1i(uniforms.enableTexture, model.material.useTexture ? 1 : 0);
            gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
            gl.uniform4f(uniforms.diffuseColor, model.material.diffuseColor[0], model.material.diffuseColor[1], model.material.diffuseColor[2], 1);
            gl.uniform4f(uniforms.specularColor, model.material.specularColor[0], model.material.specularColor[1], model.material.specularColor[2], 1);
            gl.uniform1f(uniforms.specular, model.material.specular);
            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        gl.bindSampler(10, null);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

import shadowMapVert from "./shadow_map.vert";
import shadowMapFrag from "./shadow_map.frag";

export const shadowMap = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: shadowMapVert, fragment: shadowMapFrag },
        {
            transform: "u_transform", projection: "u_projection"
        },
        { position: "a_position" }
    )
    return (projection: Matrix, mesh: Mesh, models: Model[]) => {
        gl.useProgram(program);
        gl.bindVertexArray(mesh.vao);

        for (const model of models) {
            gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
            gl.uniformMatrix4fv(uniforms.projection, false, projection.m);

            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

/** not mesh */
import spriteVert from "./sprite.vert"
import { Mesh } from "../mesh"

export const sprite = (gl: WebGL2RenderingContext) => {
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

export const texture = (gl: WebGL2RenderingContext) => {
    const vs = `#version 300 es
        in vec2 position;
        out vec2 v_texcoord;
        void main() {
        gl_Position = vec4(position, 0, 1);
        v_texcoord = position.xy * 0.5 + 0.5;
        v_texcoord.y = v_texcoord.y;
    }`;
    const fs = `#version 300 es
        precision mediump float;
        in vec2 v_texcoord;
        uniform sampler2D tex;
        out vec4 FragColor;
        void main() {
        FragColor = texture(tex, v_texcoord);
    }`;
    const programInfo = new ProgramWrapper(gl, { vertex: vs, fragment: fs }, { texture: "tex" }, { position: "position" });
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
    ]), gl.STATIC_DRAW);
    const postitonPosition = gl.getAttribLocation(programInfo.program, "position");
    gl.enableVertexAttribArray(postitonPosition);
    gl.vertexAttribPointer(postitonPosition, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    return (texture: number) => {
        gl.useProgram(programInfo.program);
        gl.uniform1i(programInfo.uniforms.texture, texture);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    };
}
