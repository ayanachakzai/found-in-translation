export function supportsWebGL(createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas')): boolean {
  try {
    const canvas = createCanvas()
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
