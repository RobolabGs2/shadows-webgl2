#version 300 es
precision mediump float;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

struct Material {
    vec4 diffuseColor;
    vec4 specularColor;
    float specular;
};
uniform Material mat;

out vec4 FragColor;
void main() {
    float l = length(v_surfaceToLight);
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float light = dot(normal, surfaceToLightDirection) / (l*l);
    float specular = 0.01;
    if (light > 0.0)
        specular = pow(dot(normal, halfVector), mat.specular);

    FragColor = vec4(mat.diffuseColor.rgb*light, mat.diffuseColor.a)+mat.specularColor*specular;
}