#version 300 es
precision mediump float;

in vec3 normal;
in vec3 surfaceToLight;

out vec4 FragColor;
void main() {
    FragColor = vec4(dot(normalize(normal), normalize(surfaceToLight)), 0.1, 0.1, 1.);
}