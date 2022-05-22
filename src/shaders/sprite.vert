#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;
uniform mat4 u_transform;
uniform mat4 u_projection;
uniform float u_size;

void main() {
    gl_Position = u_projection * u_transform * vec4(a_position);
    gl_PointSize = u_size;
}