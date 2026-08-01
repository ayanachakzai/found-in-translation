import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import {
  findModelAsset,
  modelUrl,
  type ModelAsset,
  type ModelAssetId,
  type ModelPlacement,
  type StagePlacement,
} from '../../lib/assets'
import { prepareModelScene } from '../../scene/prepareModel'

interface RegisteredModelProps {
  readonly id: ModelAssetId
  readonly placement: StagePlacement
  readonly visible: boolean
  readonly motionEnabled: boolean
  readonly onError: (asset: ModelAsset, error: Error) => void
}

interface ModelErrorBoundaryProps {
  readonly asset: ModelAsset
  readonly fallback: ReactNode
  readonly onError: (asset: ModelAsset, error: Error) => void
  readonly children: ReactNode
}

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(this.props.asset, error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function mutableVector(tuple: readonly [number, number, number]): [number, number, number] {
  return [tuple[0], tuple[1], tuple[2]]
}

function combinedRotation(
  asset: ModelAsset,
  placement: ModelPlacement,
): [number, number, number] {
  const placementRotation = placement.rotation ?? [0, 0, 0]
  return [
    asset.displayRotation[0] + placementRotation[0],
    asset.displayRotation[1] + placementRotation[1],
    asset.displayRotation[2] + placementRotation[2],
  ]
}

function Placeholder({
  asset,
  placement,
  failed = false,
}: {
  readonly asset: ModelAsset
  readonly placement: ModelPlacement
  readonly failed?: boolean
}) {
  const scale = (placement.scale ?? 1) * Math.min(1, asset.targetSize * 0.42)
  return (
    <mesh
      position={mutableVector(placement.position)}
      rotation={combinedRotation(asset, placement)}
      scale={scale}
    >
      <icosahedronGeometry args={[0.65, 0]} />
      <meshBasicMaterial
        color={failed ? '#df8e7e' : '#d8cdb6'}
        opacity={failed ? 0.45 : 0.18}
        transparent
        wireframe
      />
    </mesh>
  )
}

function LoadedModel({
  asset,
  placement,
  visible,
  motionEnabled,
}: {
  readonly asset: ModelAsset
  readonly placement: ModelPlacement
  readonly visible: boolean
  readonly motionEnabled: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const gl = useThree((state) => state.gl)
  const gltf = useGLTF(modelUrl(asset))
  const prepared = useMemo(
    () => prepareModelScene(gltf.scene, asset),
    [asset, gltf.scene],
  )
  const rotation = useMemo(
    () => combinedRotation(asset, placement),
    [asset, placement],
  )
  const position = useMemo(
    () => mutableVector(placement.position),
    [placement],
  )

  useEffect(() => {
    const maximumAnisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
    prepared.object.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const material = (child as THREE.Mesh).material
      const materials = Array.isArray(material) ? material : [material]
      materials.forEach((candidate) => {
        const textured = candidate as THREE.MeshStandardMaterial
        const textures = [
          textured.map,
          textured.normalMap,
          textured.roughnessMap,
          textured.metalnessMap,
          textured.aoMap,
          textured.emissiveMap,
        ]
        textures.forEach((texture) => {
          if (texture && texture.anisotropy !== maximumAnisotropy) {
            texture.anisotropy = maximumAnisotropy
            texture.needsUpdate = true
          }
        })
      })
    })
  }, [gl, prepared.object])

  useEffect(() => {
    if (!group.current || motionEnabled) return
    group.current.position.set(...position)
    group.current.rotation.set(...rotation)
  }, [motionEnabled, position, rotation])

  useFrame((state) => {
    if (!group.current || !asset.idle || !motionEnabled || !visible) return
    const time = state.clock.elapsedTime * asset.idle.speed + asset.idle.phase
    group.current.position.set(
      position[0],
      position[1] + Math.sin(time) * asset.idle.amplitude,
      position[2],
    )
    group.current.rotation.set(
      rotation[0] + Math.cos(time * 0.78) * asset.idle.tilt,
      rotation[1] + Math.sin(time * 0.62) * asset.idle.tilt,
      rotation[2],
    )
  })

  return (
    <group
      ref={group}
      name={`${asset.id}-display`}
      position={position}
      rotation={rotation}
      scale={prepared.normalizationScale * (placement.scale ?? 1)}
      visible={visible}
    >
      <primitive object={prepared.object} dispose={null} />
    </group>
  )
}

export function RegisteredModel({
  id,
  placement: placementName,
  visible,
  motionEnabled,
  onError,
}: RegisteredModelProps) {
  const asset = findModelAsset(id)
  const placement = asset.placements[placementName]
  if (!placement) return null

  const placeholder = (
    <Placeholder asset={asset} placement={placement} />
  )

  return (
    <group visible={visible}>
      <ModelErrorBoundary
        asset={asset}
        fallback={<Placeholder asset={asset} placement={placement} failed />}
        onError={onError}
      >
        <Suspense fallback={placeholder}>
          <LoadedModel
            asset={asset}
            placement={placement}
            visible={visible}
            motionEnabled={motionEnabled}
          />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  )
}
