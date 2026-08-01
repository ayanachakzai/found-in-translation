import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { ModelAsset } from '../lib/assets'
import { prepareModelScene } from './prepareModel'

const testAsset: ModelAsset = {
  id: 'test',
  file: 'test.glb',
  sourceFile: 'test-source.glb',
  label: 'Test model',
  role: 'Test',
  byteSize: 1,
  sourceByteSize: 1,
  loadGroup: 'hero',
  targetSize: 2,
  displayRotation: [0, 0, 0],
  contentNodes: ['content'],
  placements: {},
}

describe('model preparation', () => {
  it('removes export helpers and derives a centred target scale', () => {
    const scene = new THREE.Group()
    const helper = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100))
    helper.name = 'Cube'
    helper.position.x = -200
    const content = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2))
    content.name = 'content'
    content.position.set(4, 3, 2)
    scene.add(helper, content)

    const prepared = prepareModelScene(scene, testAsset)
    const finalBounds = new THREE.Box3().setFromObject(prepared.object)
    const finalCentre = finalBounds.getCenter(new THREE.Vector3())

    expect(prepared.object.getObjectByName('Cube')).toBeUndefined()
    expect(prepared.normalizationScale).toBeCloseTo(0.5)
    expect(finalCentre.length()).toBeLessThan(0.0001)
  })
})
