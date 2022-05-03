#version 300 es
precision mediump float;

in vec4 a_color;
out vec4 FragColor;

void main() {
    FragColor = a_color;
}