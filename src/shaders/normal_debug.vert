#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec3 a_normal;
uniform mat4 u_transform;
uniform mat4 u_projection;

out vec4 a_color;
void main() {
    gl_Position = u_projection * u_transform * vec4(a_position);
    a_color = vec4(a_normal, 1);
    a_color = vec4((a_color.x + 1.) / 2., (a_color.y + 1.) / 2., (a_color.z + 1.) / 2., a_color.w);
}