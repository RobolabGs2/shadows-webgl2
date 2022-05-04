
import { ProgramWrapper } from "./webgl"
import { Model } from "./model"
import { Matrix, Vector } from "./geometry"


import simpleVert from "./simple.vert"
import fillColorFrag from "./fill_color.frag"

export const simple = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: simpleVert, fragment: fillColorFrag },
        { color: "u_color", transform: "u_transform", projection: "u_projection" },
        { position: "a_position" }
    )
    return (projection: Matrix, model: Model) => {
        gl.useProgram(program);
        const { diffuseColor: [r, g, b], debugColor: [dr, dg, db] = [r, g, b] } = model.material
        gl.uniform4f(uniforms.color, r, g, b, 1);
        gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
        gl.uniformMatrix4fv(uniforms.projection, false, projection.m);

        gl.bindVertexArray(model.vao);

        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.uniform4f(uniforms.color, dr, dg, db, 1);
        gl.drawElements(gl.LINE_STRIP, model.indices.length, gl.UNSIGNED_SHORT, 0);
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
    return (projection: Matrix, model: Model) => {
        gl.useProgram(program);

        gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
        gl.uniformMatrix4fv(uniforms.projection, false, projection.m);

        gl.bindVertexArray(model.vao);

        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}


import lightingPointVert from "./lighting_point.vert";
import lightingPointFrag from "./lighting_point.frag";

export const lightingPoint = (gl: WebGL2RenderingContext) => {
    const { program, uniforms, attributes } = new ProgramWrapper(
        gl,
        { vertex: lightingPointVert, fragment: lightingPointFrag },
        {
            transform: "u_transform", projection: "u_projection", light: "u_lightPosition",
            view: "u_viewPosition",
            diffuseColor: "mat.diffuseColor",
            specularColor: "mat.specularColor",
            specular: "mat.specular",
        },
        { position: "a_position" }
    )
    return (projection: Matrix, model: Model, lightPos: Vector<3>, viewPos: Vector<3>) => {
        gl.useProgram(program);

        gl.uniformMatrix4fv(uniforms.transform, false, model.transform.m);
        gl.uniformMatrix4fv(uniforms.projection, false, projection.m);
        gl.uniform3f(uniforms.light, lightPos[0], lightPos[1], lightPos[2]);
        gl.uniform3f(uniforms.view, viewPos[0], viewPos[1], viewPos[2]);

        gl.uniform4f(uniforms.diffuseColor, model.material.diffuseColor[0], model.material.diffuseColor[1], model.material.diffuseColor[2], 1);
        gl.uniform4f(uniforms.specularColor, model.material.specularColor[0], model.material.specularColor[1], model.material.specularColor[2], 1);
        gl.uniform1f(uniforms.specular, model.material.specular);
        gl.bindVertexArray(model.vao);

        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

import spriteVert from "./sprite.vert"

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