#version 300 es
precision mediump float;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;
in vec4 v_shadowMapCoord;

struct Material {
    vec4 diffuseColor;
    vec4 specularColor;
    float specular;
};

struct Projector {
    mat4 transform;
    mat4 projection;
    float angle;
};

uniform Material mat;
uniform Projector u_projector;
uniform sampler2D shadowMap;

out vec4 FragColor;
void main() {
    float l = length(v_surfaceToLight);
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    vec3 shadowMapCoord = v_shadowMapCoord.xyz / v_shadowMapCoord.w;
    float depth = shadowMapCoord.z;
    bool inRange = shadowMapCoord.x >= -1.0 && shadowMapCoord.x <= 1.0 &&
        shadowMapCoord.y >= -1.0 && shadowMapCoord.y <= 1.0 && depth >= -1.0 && depth <= 1.0;
    vec2 shadowCoords = (shadowMapCoord.xy + vec2(1, 1)) / 2.;
    float maxDepth = texture(shadowMap, shadowCoords).r;
    // bool inShadow = (depth+1.0)/2. >= maxDepth;
    bool inShadow = depth >= maxDepth;

    float directionAngel = dot(surfaceToLightDirection, mat3(u_projector.transform) * vec3(0, 0, 1));
    float inLight = smoothstep(cos(u_projector.angle / 2.), cos(0.), directionAngel);
    float light = inLight * max(0.0, dot(normal, surfaceToLightDirection)) * 10. / (l * l);
    float specular = inLight * pow(max(0.0, dot(normal, halfVector)), mat.specular);

    vec3 color = ((inRange && !inShadow) ? (mat.diffuseColor.rgb * light + mat.specularColor.rgb * specular) : vec3(0, 0, 0)) + mat.diffuseColor.rgb * 0.09;
    FragColor = vec4(color, mat.diffuseColor.a);
}