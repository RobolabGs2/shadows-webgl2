#version 300 es
precision mediump float;

in vec3 normal;
in vec3 surfaceToLight;

out vec4 FragColor;
void main() {
    float l = length(surfaceToLight)/2.2;
    FragColor = vec4(dot(normalize(normal), normalize(surfaceToLight))/(l*l), 0.1, 0.1, 1.);
}