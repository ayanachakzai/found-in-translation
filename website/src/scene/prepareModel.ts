import * as THREE from 'three'
import type { ModelAsset } from '../lib/assets'

export interface PreparedModel {
  readonly object: THREE.Object3D
  readonly normalizationScale: number
  readonly measuredSize: THREE.Vector3
}

function isWithinSelectedNode(
  object: THREE.Object3D,
  selectedNames: ReadonlySet<string>,
  sceneRoot: THREE.Object3D,
): boolean {
  let current: THREE.Object3D | null = object
  while (current && current !== sceneRoot) {
    if (selectedNames.has(current.name)) return true
    current = current.parent
  }
  return false
}

export function prepareModelScene(
  source: THREE.Object3D,
  asset: ModelAsset,
): PreparedModel {
  const object = source.clone(true)
  object.name = `${asset.id}-normalised`

  if (asset.contentNodes?.length) {
    const selectedNames = new Set(asset.contentNodes)
    const unwantedMeshes: THREE.Object3D[] = []

    object.traverse((child) => {
      if (
        (child as THREE.Mesh).isMesh &&
        !isWithinSelectedNode(child, selectedNames, object)
      ) {
        unwantedMeshes.push(child)
      }
    })

    unwantedMeshes.forEach((mesh) => mesh.parent?.remove(mesh))
  }

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.frustumCulled = true
    }
  })

  object.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(object, true)
  if (bounds.isEmpty()) {
    throw new Error(`${asset.label} contains no renderable geometry after normalization`)
  }

  const centre = bounds.getCenter(new THREE.Vector3())
  const measuredSize = bounds.getSize(new THREE.Vector3())
  const maximumDimension = Math.max(measuredSize.x, measuredSize.y, measuredSize.z)
  if (!Number.isFinite(maximumDimension) || maximumDimension <= 0) {
    throw new Error(`${asset.label} has invalid measured bounds`)
  }

  object.position.sub(centre)
  object.updateMatrixWorld(true)

  return {
    object,
    normalizationScale: asset.targetSize / maximumDimension,
    measuredSize,
  }
}
