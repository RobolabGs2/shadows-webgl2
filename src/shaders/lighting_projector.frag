#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler2DShadow;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;
in vec4 v_shadowMapCoord;
in vec2 v_texcoord;

struct Material {
    vec4 diffuseColor;
    vec4 specularColor;
    float specular;
    bool hasTexture;
};

struct Projector {
    mat4 transform;
    mat4 projection;
    float angle;
};

uniform Material mat;
uniform Projector u_projector;
uniform sampler2DShadow shadowMap;
uniform sampler2D textureSampler;

out vec4 FragColor;
void main() {
    float l = length(v_surfaceToLight);
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    vec3 shadowMapCoord = v_shadowMapCoord.xyz / v_shadowMapCoord.w;
    vec3 shadowCoords = (shadowMapCoord.xyz + vec3(1, 1, shadowMapCoord.z)) / 2.;
    float inShadow = texture(shadowMap, shadowCoords);

    float directionAngel = dot(surfaceToLightDirection, mat3(u_projector.transform) * vec3(0, 0, 1));
    float inLight = smoothstep(cos(u_projector.angle / 2.), cos(0.), directionAngel);
    float light = inLight * max(0.0, dot(normal, surfaceToLightDirection)) * 10. / (l * l);
    float specular = inLight * pow(max(0.0, dot(normal, halfVector)), mat.specular);

    vec3 diffuseColor = float(!mat.hasTexture) * mat.diffuseColor.rgb + float(mat.hasTexture) * texture(textureSampler, v_texcoord).rgb;
    vec3 color = inShadow * (diffuseColor * light + mat.specularColor.rgb * specular);
    FragColor = vec4(color, mat.diffuseColor.a);
}