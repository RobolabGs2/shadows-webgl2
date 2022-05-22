#version 300 es
precision mediump float;

struct Projector {
    mat4 transform;
    mat4 projection;
    float angle;
};

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texcoord;
uniform mat4 u_transform;
uniform mat4 u_projection;
uniform Projector u_projector;
uniform vec3 u_viewPosition;

out vec3 v_normal;
out vec2 v_texcoord;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;
out vec4 v_shadowMapCoord;
void main() {
    vec4 position = u_transform * a_position;
    gl_Position = u_projection * position;

    v_texcoord = a_texcoord;
    v_surfaceToLight = (u_projector.transform * vec4(0, 0, 0, 1)).xyz - position.xyz;
    v_surfaceToView = u_viewPosition - position.xyz;
    v_normal = mat3(u_transform) * a_normal;
    v_shadowMapCoord = u_projector.projection * inverse(u_projector.transform) * position;
}