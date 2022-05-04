#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec3 a_normal;
uniform mat4 u_transform;
uniform mat4 u_projection;
uniform vec3 u_lightPosition;

out vec3 normal;
out vec3 surfaceToLight;
void main() {
    vec4 position = u_transform * a_position;
    gl_Position = u_projection * position;

    surfaceToLight = u_lightPosition - vec3(position.xyz / position.w);
    normal = mat3(u_transform) * a_normal;
}