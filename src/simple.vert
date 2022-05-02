#version 300 es
precision mediump float;

in vec4 a_position;
uniform mat4 u_transform;
uniform mat4 u_projection;
void main() {
    gl_Position = u_projection * u_transform * vec4(a_position);
}