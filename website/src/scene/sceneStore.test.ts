import { describe, expect, it } from 'vitest'
import { calculateSceneProgress, sceneOrder } from './sceneStore'

const sections = sceneOrder.map((id, index) => ({
  id,
  top: index * 1000,
  height: 1000,
}))

describe('scene progress store calculations', () => {
  it('reports normalized document and local progress', () => {
    const state = calculateSceneProgress(2500, 1000, 12_000, sections)

    expect(state.activeScene).toBe('dataset')
    expect(state.globalProgress).toBeCloseTo(2500 / 11_000)
    expect(state.localProgress).toBeCloseTo(0.96)
  })

  it('clamps progress at document boundaries', () => {
    expect(calculateSceneProgress(-50, 1000, 12_000, sections).globalProgress).toBe(0)
    expect(calculateSceneProgress(20_000, 1000, 12_000, sections).globalProgress).toBe(1)
  })
})
