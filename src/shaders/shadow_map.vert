#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform mat4 u_transform;
uniform mat4 u_projection;

void main() {
    vec4 position = u_transform * a_position;
    gl_Position = u_projection * position;
}