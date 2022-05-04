#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec3 a_normal;
uniform mat4 u_transform;
uniform mat4 u_projection;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;

out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;
void main() {
    vec4 position = u_transform * a_position;
    gl_Position = u_projection * position;

    v_surfaceToLight = u_lightPosition - position.xyz;
    v_surfaceToView = u_viewPosition - position.xyz;
    v_normal = mat3(u_transform) * a_normal;
}