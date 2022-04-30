import { HTML } from "./web/html"
import { downloadImages } from "./utils"
import { TexturesManager } from "./webgl"
import { StyleSheetTree, WindowsManager } from "./web/windows"

downloadImages({}).then(images => {
    const styleSheet = document.querySelector("style")!.sheet!
    const canvas = document.querySelector("canvas")!
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    document.body.appendChild(canvas)
    const gl = canvas.getContext("webgl2")!
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const textures = new TexturesManager(gl, images)
    const windows = new WindowsManager(HTML.CreateElement("div", (el) => document.body.appendChild(el)), new StyleSheetTree(styleSheet))
    windows.CreateInfoWindow("Shadow demo", HTML.CreateElement("article", HTML.SetText("TODO")))
    let lastTick = 0
    let frameId = -1;
    const draw = (currentTick: number) => {
        const dt = (currentTick - lastTick) / 1000
        lastTick = currentTick
        gl.clearColor(0.1, 0.1, 0.1, 1.0)
        gl.clearDepth(1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        frameId = requestAnimationFrame(draw)
    }
    frameId = requestAnimationFrame(draw)
})
