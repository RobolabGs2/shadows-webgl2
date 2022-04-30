/*
    Typescript не умеет импротить произвольные файлы, это делает сборкщик (parcel)
    Для тайпчекера объявим, что модули с картинками - это нормально
*/
declare module "*.png" {
    const url: string;
    export = url;
}

declare module "*.glsl" {
    const shader: string;
    export = shader;
}

declare module "*.vert" {
    const shader: string;
    export = shader;
}

declare module "*.frag" {
    const shader: string;
    export = shader;
}