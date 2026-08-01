import { describe, expect, it } from 'vitest'
import { supportsWebGL } from './webgl'

describe('WebGL capability detection', () => {
  it('returns false without a rendering context', () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement
    expect(supportsWebGL(() => canvas)).toBe(false)
  })

  it('returns true with a WebGL context', () => {
    const canvas = {
      getContext: (kind: string) => (kind === 'webgl2' ? {} : null),
    } as unknown as HTMLCanvasElement
    expect(supportsWebGL(() => canvas)).toBe(true)
  })
})
