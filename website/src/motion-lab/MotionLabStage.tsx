import { useGSAP } from '@gsap/react'
import { useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import * as THREE from 'three'
import { findModelAsset, modelUrl, type ModelAsset, type ModelAssetId } from '../lib/assets'
import { prepareModelScene } from '../scene/prepareModel'
import {
  CHAPTER_DURATION,
  CHAPTER_ENTER,
  CHAPTER_EXIT,
  MOTION_LAB_CHAPTERS,
  chapterStart,
  type MotionLabChapterId,
} from './chapters'

gsap.registerPlugin(useGSAP, MotionPathPlugin)

type Timeline = ReturnType<typeof gsap.timeline>
type MotionLabModelId = Extract<ModelAssetId, 'old-book' | 'owl' | 'snake' | 'rose' | 'crown' | 'star' | 'webcam' | 'receipt-printer' | 'arduino'>
type VectorTuple = readonly [number, number, number]
type ModelPose = { readonly position: VectorTuple; readonly rotation: VectorTuple; readonly scale: number }
type ScenePose = Record<MotionLabModelId, ModelPose>

interface MotionLabStageProps {
  readonly mainExperience: boolean
  readonly renderActive: boolean
  readonly reducedMotion: boolean
  readonly onContextFailure: () => void
  readonly onTimelineReady: (timeline: Timeline | null) => void
  readonly statusRootRef: RefObject<HTMLDivElement | null>
  readonly textRootRef: RefObject<HTMLDivElement | null>
}

interface ModelBoundaryProps {
  readonly asset: ModelAsset
  readonly children: ReactNode
  readonly onError: (asset: ModelAsset, error: Error) => void
}

interface ModelProps {
  readonly id: MotionLabModelId
  readonly modelRef: Ref<THREE.Group>
  readonly idleRef: Ref<THREE.Group>
  readonly pose: ModelPose
  readonly displayRotation?: VectorTuple
  readonly onError: (asset: ModelAsset, error: Error) => void
  readonly children?: ReactNode
}

const LIGHTING = {
  fill: 2.1,
  hemisphere: 1.9,
  frontFill: 3.7,
  archiveKey: 6.4,
  trainingKey: 10.8,
  archiveRim: 2.4,
  recognitionKey: 6.2,
  recognitionPeak: 7.8,
  webcamRim: 6.4,
  webcamPeak: 8.6,
  printerKey: 7.5,
  printerRim: 5.2,
  acknowledgement: 2.6,
  slot: 4.3,
  paper: 4.7,
  arduino: 3.2,
} as const

const IDLE_MOTION: Record<MotionLabModelId, {
  readonly float: number
  readonly lateral: number
  readonly drift: number
  readonly breathe: number
  readonly speed: number
  readonly phase: number
}> = {
  'old-book': { float: 0.065, lateral: 0.025, drift: 0.012, breathe: 0.0045, speed: 0.28, phase: 0.2 },
  owl: { float: 0.12, lateral: 0.045, drift: 0.032, breathe: 0.007, speed: 0.36, phase: 1.1 },
  snake: { float: 0.135, lateral: 0.058, drift: 0.042, breathe: 0.008, speed: 0.33, phase: 2.2 },
  rose: { float: 0.125, lateral: 0.04, drift: 0.034, breathe: 0.0085, speed: 0.35, phase: 3.1 },
  crown: { float: 0.105, lateral: 0.036, drift: 0.028, breathe: 0.0065, speed: 0.31, phase: 4.4 },
  star: { float: 0.145, lateral: 0.052, drift: 0.042, breathe: 0.009, speed: 0.39, phase: 5.2 },
  webcam: { float: 0.06, lateral: 0.022, drift: 0.012, breathe: 0.0035, speed: 0.29, phase: 1.8 },
  'receipt-printer': { float: 0.052, lateral: 0.018, drift: 0.009, breathe: 0.0028, speed: 0.25, phase: 3.8 },
  arduino: { float: 0.058, lateral: 0.021, drift: 0.011, breathe: 0.0032, speed: 0.3, phase: 4.8 },
}

const HERO_BY_CHAPTER: readonly MotionLabModelId[] = [
  'old-book', 'old-book', 'old-book', 'rose', 'star', 'star', 'rose', 'old-book', 'old-book',
  'receipt-printer', 'receipt-printer', 'receipt-printer',
]

const FOCUS_COLORS = {
  archive: new THREE.Color('#f0c994'),
  recognition: new THREE.Color('#cfe6ff'),
  output: new THREE.Color('#e4eaf0'),
} as const

const MODEL_IDS: readonly MotionLabModelId[] = ['old-book', 'owl', 'snake', 'rose', 'crown', 'star', 'webcam', 'receipt-printer', 'arduino']

const MOBILE_MAIN_STAGE = {
  camera: [0, 0.18, 12.85] as VectorTuple,
  target: [0, -0.08, -0.35] as VectorTuple,
  fov: 39,
  printerCamera: [0, 0.08, 13.25] as VectorTuple,
  printerTarget: [0, -0.42, -0.35] as VectorTuple,
  idleStrength: 0.7,
  safeFrame: {
    left: -1.3,
    right: 1.3,
    top: -0.02,
    bottom: -2.05,
    maxScale: 0.92,
  },
} as const

function tuple(value: VectorTuple): [number, number, number] {
  return [value[0], value[1], value[2]]
}

function smoothstep(value: number) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1)
  return clamped * clamped * (3 - 2 * clamped)
}

function holdStrengthAt(time: number) {
  const chapterIndex = Math.min(MOTION_LAB_CHAPTERS.length - 1, Math.max(0, Math.floor(time / CHAPTER_DURATION)))
  const phase = time - chapterIndex * CHAPTER_DURATION
  const entering = smoothstep((phase - (CHAPTER_ENTER - 6)) / 12)
  if (chapterIndex === MOTION_LAB_CHAPTERS.length - 1) return entering
  const exiting = 1 - smoothstep((phase - (CHAPTER_EXIT - 6)) / 12)
  return Math.min(entering, exiting)
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh
}

function createScenePoses(compact: boolean, mainExperience = false): Record<MotionLabChapterId, ScenePose> {
  const root = (position: VectorTuple, scale: number, rotation: VectorTuple = [0, 0, 0]): ModelPose => ({ position, scale, rotation })
  const offRight = root([compact ? 5.8 : 8.8, 0, -3.4], 0.55)
  const offLeft = root([compact ? -5.8 : -8.8, 0, -3.4], 0.55)

  if (compact && mainExperience) {
    const mobileOffRight = root([5.2, -0.4, -3.2], 0.5)
    const mobileOffLeft = root([-5.2, -0.4, -3.2], 0.5)
    const fitMobilePose = (pose: ScenePose): ScenePose => Object.fromEntries(MODEL_IDS.map((id) => {
      const model = pose[id]
      if (Math.abs(model.position[0]) > 4) return [id, model]
      return [id, {
        ...model,
        position: [
          THREE.MathUtils.clamp(model.position[0], MOBILE_MAIN_STAGE.safeFrame.left, MOBILE_MAIN_STAGE.safeFrame.right),
          THREE.MathUtils.clamp(model.position[1], MOBILE_MAIN_STAGE.safeFrame.bottom, MOBILE_MAIN_STAGE.safeFrame.top),
          model.position[2],
        ] as VectorTuple,
        scale: Math.min(model.scale, MOBILE_MAIN_STAGE.safeFrame.maxScale),
      }]
    })) as ScenePose
    const archive: ScenePose = {
      'old-book': root([0, -1.72, -0.42], 0.62, [0.04, 0.035, -0.025]),
      owl: root([-1.14, -0.18, -0.62], 0.59),
      snake: root([-1.2, -1.02, -0.18], 0.54),
      rose: root([0, -0.06, -0.68], 0.58),
      crown: root([1.12, -0.2, -0.64], 0.61),
      star: root([1.18, -1.02, -0.16], 0.66),
      webcam: mobileOffRight,
      'receipt-printer': mobileOffRight,
      arduino: mobileOffRight,
    }
    const training: ScenePose = {
      ...archive,
      'old-book': root([0.04, -1.52, 0.02], 0.63, [0.06, 0.045, -0.02]),
      owl: root([-1.25, -0.32, -1.55], 0.4),
      snake: root([-1.25, -1.02, -1.42], 0.37),
      rose: root([-0.42, -0.28, -1.5], 0.38),
      crown: root([0.48, -0.3, -1.5], 0.4),
      star: root([1.23, -0.74, -1.44], 0.43),
    }
    const themes: ScenePose = {
      'old-book': root([0, -1.58, -1.55], 0.44),
      owl: root([-1.12, -0.04, -0.28], 0.66),
      snake: root([0, -0.04, -0.25], 0.64),
      rose: root([1.12, -0.04, -0.28], 0.64),
      crown: root([-0.68, -0.98, -0.18], 0.69),
      star: root([0.72, -0.98, -0.16], 0.73),
      webcam: mobileOffRight,
      'receipt-printer': mobileOffRight,
      arduino: mobileOffRight,
    }
    const selection: ScenePose = {
      'old-book': mobileOffLeft,
      owl: mobileOffLeft,
      snake: mobileOffLeft,
      crown: mobileOffLeft,
      star: root([-0.92, -0.55, 0.32], 0.9),
      rose: root([-0.92, -1.5, 0.2], 0.82),
      webcam: root([0.98, -1.28, -0.66], 0.66),
      'receipt-printer': mobileOffRight,
      arduino: mobileOffRight,
    }
    const lens: VectorTuple = [-0.43, -0.9, 0.92]
    const star: ScenePose = {
      ...selection,
      rose: root([-1.18, -0.32, -0.42], 0.54),
      star: root(lens, 0.9, [0.08, Math.PI * 0.86, -0.1]),
    }
    const rose: ScenePose = {
      ...selection,
      star: root([-1.2, -0.34, -0.52], 0.5, [0.04, 0.3, -0.05]),
      rose: root([lens[0], lens[1] - 0.04, lens[2] + 0.08], 0.88, [-0.05, Math.PI * 0.84, 0.08]),
    }
    const retrieval: ScenePose = {
      'old-book': root([0, -1.58, -0.34], 0.6),
      owl: root([-1.18, -0.5, -2.1], 0.34),
      snake: root([-1.18, -1.52, -2.1], 0.31),
      rose: mobileOffLeft,
      crown: root([1.18, -0.5, -2.1], 0.34),
      star: mobileOffLeft,
      webcam: mobileOffRight,
      'receipt-printer': mobileOffRight,
      arduino: mobileOffRight,
    }
    const generation: ScenePose = {
      ...retrieval,
      'old-book': root([0, -0.92, -0.62], 0.64),
      owl: mobileOffLeft,
      snake: mobileOffLeft,
      crown: mobileOffLeft,
    }
    const hardware: ScenePose = {
      'old-book': mobileOffLeft,
      owl: mobileOffLeft,
      snake: mobileOffLeft,
      rose: mobileOffLeft,
      crown: mobileOffLeft,
      star: mobileOffLeft,
      webcam: mobileOffRight,
      'receipt-printer': root([-0.04, -1.05, -0.34], 0.8),
      arduino: root([0.9, -1.86, -0.08], 0.48),
    }
    const printing: ScenePose = {
      ...hardware,
      'receipt-printer': root([-0.08, -1.02, -0.34], 0.8),
      arduino: root([0.88, -1.88, -0.08], 0.46),
    }
    const final: ScenePose = {
      ...printing,
      'receipt-printer': root([-0.14, -0.98, -0.34], 0.79),
      arduino: root([0.9, -1.82, -0.08], 0.48),
    }
    return {
      archive: fitMobilePose(archive),
      clean: fitMobilePose(archive),
      training: fitMobilePose(training),
      themes: fitMobilePose(themes),
      selection: fitMobilePose(selection),
      star: fitMobilePose(star),
      rose: fitMobilePose(rose),
      retrieval: fitMobilePose(retrieval),
      generation: fitMobilePose(generation),
      hardware: fitMobilePose(hardware),
      printing: fitMobilePose(printing),
      final: fitMobilePose(final),
    }
  }

  const archive: ScenePose = compact ? {
    'old-book': root([0, -0.7, -0.35], 0.82, [0.035, 0.03, -0.025]),
    owl: root([-1.32, 0.78, -0.95], 0.66),
    snake: root([-1.58, -0.92, -0.68], 0.58),
    rose: root([-0.2, 1.02, -0.82], 0.62),
    crown: root([0.72, 0.95, -0.84], 0.68),
    star: root([1.38, 0.25, -0.8], 0.74),
    webcam: offRight,
    'receipt-printer': offRight,
    arduino: offRight,
  } : {
    'old-book': root([0, -0.78, -0.35], 0.94, [0.035, 0.03, -0.025]),
    owl: root([-2.45, 0.72, -1.05], 0.76),
    snake: root([-2.35, -1.02, -0.7], 0.67),
    rose: root([-0.28, 1.0, -0.95], 0.69),
    crown: root([1.42, 0.88, -0.92], 0.72),
    star: root([2.62, 0.18, -0.86], 0.81),
    webcam: offRight,
    'receipt-printer': offRight,
    arduino: offRight,
  }

  const training: ScenePose = compact ? {
    ...archive,
    'old-book': root([0.12, -0.78, -0.08], 1.02, [0.055, 0.04, -0.02]),
    owl: root([-1.42, 0.95, -1.5], 0.5),
    snake: root([-1.7, -0.2, -1.48], 0.42),
    rose: root([-0.46, 1.42, -1.45], 0.47),
    crown: root([0.58, 1.38, -1.46], 0.5),
    star: root([1.5, 0.86, -1.42], 0.54),
  } : {
    ...archive,
    'old-book': root([0.45, -0.5, -0.08], 1.22, [0.055, 0.04, -0.02]),
    owl: root([-2.72, 0.64, -1.62], 0.62),
    snake: root([-2.08, -1.02, -1.58], 0.54),
    rose: root([-0.34, 1.36, -1.56], 0.56),
    crown: root([1.72, 1.16, -1.56], 0.58),
    star: root([3.04, 0.35, -1.5], 0.65),
  }

  const themes: ScenePose = compact ? {
    'old-book': root([0, -1.38, -1.8], 0.58),
    owl: root([-1.2, 0.7, -0.4], 0.7),
    snake: root([0, 0.7, -0.4], 0.66),
    rose: root([1.2, 0.7, -0.4], 0.68),
    crown: root([-0.62, -0.48, -0.35], 0.72),
    star: root([0.72, -0.48, -0.35], 0.76),
    webcam: offRight,
    'receipt-printer': offRight,
    arduino: offRight,
  } : {
    'old-book': root([0, -1.32, -1.8], 0.64),
    owl: root([-3.15, 0.05, -0.35], 0.82),
    snake: root([-1.58, 0.05, -0.35], 0.78),
    rose: root([0, 0.05, -0.35], 0.8),
    crown: root([1.58, 0.05, -0.35], 0.84),
    star: root([3.15, 0.05, -0.35], 0.88),
    webcam: offRight,
    'receipt-printer': offRight,
    arduino: offRight,
  }

  const selection: ScenePose = compact ? {
    'old-book': offLeft,
    owl: root([-1.72, 1.48, -2.7], 0.42),
    snake: root([-1.76, -0.05, -2.7], 0.4),
    crown: root([-1.62, -1.4, -2.7], 0.42),
    star: root([-0.72, 0.82, 0.22], 1.08),
    rose: root([-0.3, -0.2, 0.18], 1.06),
    webcam: root([1.02, -0.48, -0.7], 0.76),
    'receipt-printer': offRight,
    arduino: offRight,
  } : {
    'old-book': root([-4.35, -1.2, -2.5], 0.52),
    owl: root([-4.2, 0.75, -2.5], 0.5),
    snake: root([-3.45, -1.25, -2.5], 0.46),
    crown: root([-3.25, 0.85, -2.5], 0.5),
    star: root([-2.35, 0.38, 0.26], 1.15),
    rose: root([-1.25, -0.72, 0.2], 1.15),
    webcam: root([2.18, 0.1, -0.72], 0.84),
    'receipt-printer': offRight,
    arduino: offRight,
  }

  const lens: VectorTuple = compact ? [0.42, 0.18, 0.86] : [0.65, 0.34, 0.86]
  const star: ScenePose = {
    ...selection,
    star: root(lens, compact ? 1.08 : 1.1, [0.08, Math.PI * 0.86, -0.1]),
  }
  const rose: ScenePose = {
    ...selection,
    star: root(compact ? [-0.68, 1.38, -0.45] : [-2.75, 1.2, -0.6], compact ? 0.72 : 0.76, [0.04, 0.3, -0.05]),
    rose: root([lens[0], lens[1] - 0.1, lens[2] + 0.08], compact ? 1.08 : 1.1, [-0.05, Math.PI * 0.84, 0.08]),
  }

  const retrieval: ScenePose = compact ? {
    'old-book': root([-0.25, -0.62, -0.45], 0.82),
    owl: root([-1.55, 0.95, -2.2], 0.5),
    snake: root([-1.62, -0.55, -2.2], 0.48),
    crown: root([1.35, 0.82, -2.2], 0.5),
    star: offLeft,
    rose: offLeft,
    webcam: offRight,
    'receipt-printer': offRight,
    arduino: offRight,
  } : {
    'old-book': root([-0.5, -0.72, -0.52], 0.94),
    owl: root([-3.65, 0.85, -2.2], 0.52),
    snake: root([-3.45, -0.85, -2.2], 0.48),
    crown: root([2.9, 0.7, -2.2], 0.5),
    star: offLeft,
    rose: offLeft,
    webcam: offRight,
    'receipt-printer': offRight,
    arduino: offRight,
  }

  const generation: ScenePose = {
    ...retrieval,
    'old-book': root(compact ? [-1.65, -1.0, -2.6] : [-2.7, -1.0, -2.6], 0.5),
    owl: offLeft,
    snake: offLeft,
    crown: offLeft,
  }

  const hardware: ScenePose = compact ? {
    'old-book': offLeft,
    owl: offLeft,
    snake: offLeft,
    rose: offLeft,
    crown: offLeft,
    star: offLeft,
    webcam: offRight,
    'receipt-printer': root([-0.35, -0.15, -0.44], 1.05),
    arduino: root([0.95, -1.3, -0.18], 0.54),
  } : {
    'old-book': offLeft,
    owl: offLeft,
    snake: offLeft,
    rose: offLeft,
    crown: offLeft,
    star: offLeft,
    webcam: offRight,
    'receipt-printer': root([0.62, -0.15, -0.45], 1.1),
    arduino: root([3.18, -1.05, -0.2], 0.72),
  }

  const printing: ScenePose = {
    ...hardware,
    'receipt-printer': root(compact ? [-0.48, -0.15, -0.44] : [0.92, -0.15, -0.45], compact ? 1.08 : 1.13),
    arduino: root(compact ? [1.05, -1.34, -0.2] : [3.55, -1.12, -0.22], compact ? 0.5 : 0.64),
  }

  const final: ScenePose = {
    ...printing,
    'receipt-printer': root(compact ? [-0.42, -0.14, -0.44] : [0.88, -0.14, -0.45], compact ? 1.08 : 1.12),
  }

  return {
    archive,
    clean: archive,
    training,
    themes,
    selection,
    star,
    rose,
    retrieval,
    generation,
    hardware,
    printing,
    final,
  }
}

class ModelBoundary extends Component<ModelBoundaryProps, { readonly failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { this.props.onError(this.props.asset, error) }
  render() {
    return this.state.failed
      ? <mesh><icosahedronGeometry args={[0.58, 0]} /><meshStandardMaterial color="#d85f8a" roughness={0.7} /></mesh>
      : this.props.children
  }
}

function AnimatedModel({ id, idleRef, displayRotation }: Pick<ModelProps, 'id' | 'idleRef' | 'displayRotation'>) {
  const asset = findModelAsset(id)
  const gltf = useGLTF(modelUrl(asset))
  const prepared = useMemo(() => {
    const result = prepareModelScene(gltf.scene, asset)
    result.object.traverse((child) => {
      if (!isMesh(child)) return
      child.castShadow = false
      child.receiveShadow = false
      const source = Array.isArray(child.material) ? child.material : [child.material]
      const materials = source.map((item) => {
        const material = item.clone()
        if (id === 'rose' && material instanceof THREE.MeshStandardMaterial) {
          material.color.multiply(new THREE.Color('#e46b9a'))
          material.emissive.set('#260914')
          material.emissiveIntensity = 0.035
        }
        if ((id === 'webcam' || id === 'receipt-printer') && material instanceof THREE.MeshStandardMaterial) {
          material.roughness = Math.max(0.34, material.roughness)
          material.metalness = Math.min(0.72, material.metalness)
          material.emissive.set('#1b1e22')
          material.emissiveIntensity = 0.2
        }
        material.needsUpdate = true
        return material
      })
      child.material = Array.isArray(child.material) ? materials : materials[0]
    })
    return result
  }, [asset, gltf.scene, id])

  return <group ref={idleRef}>
    <group rotation={tuple(displayRotation ?? asset.displayRotation)} scale={prepared.normalizationScale}>
      <primitive object={prepared.object} dispose={null} />
    </group>
  </group>
}

function Model({ id, modelRef, idleRef, pose, displayRotation, onError, children }: ModelProps) {
  const asset = findModelAsset(id)
  return <group ref={modelRef} name={`${id}-motion-root`} position={tuple(pose.position)} rotation={tuple(pose.rotation)} scale={pose.scale}>
    <ModelBoundary asset={asset} onError={onError}>
      <Suspense fallback={null}><AnimatedModel id={id} idleRef={idleRef} displayRotation={displayRotation} /></Suspense>
    </ModelBoundary>
    {children}
  </group>
}

function ContextLossListener({ onContextFailure }: Pick<MotionLabStageProps, 'onContextFailure'>) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    const canvas = gl.domElement
    const onLost = (event: Event) => { event.preventDefault(); onContextFailure() }
    canvas.addEventListener('webglcontextlost', onLost)
    return () => canvas.removeEventListener('webglcontextlost', onLost)
  }, [gl, onContextFailure])
  return null
}

function createReceiptTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 760
  canvas.height = 1760
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Receipt texture context unavailable')
  context.fillStyle = '#eee4d1'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#1d1d1b'
  context.textAlign = 'center'
  context.font = '600 30px VT323, monospace'
  context.fillText('FOUND IN TRANSLATION', 380, 105)
  context.font = '400 24px VT323, monospace'
  context.fillText('BLUE STAR + PINK ROSE', 380, 152)
  context.fillText('Mysticism + Love', 380, 184)
  context.fillText('Cultural DNA · Latin America 50% · India 50%', 380, 216)
  context.fillRect(86, 246, 588, 2)
  context.font = '400 27px VT323, monospace'
  const lines = [
    'Long ago, where sky met earth with dreams,',
    'Lila carried a blue star on her forehead.',
    'One night she dreamed of a pink rose',
    'growing in snow, glowing with love and magic.',
    'At a snow-capped peak, the rose bloomed.',
    'Its secret: “To grow, you must be loved',
    'as you are.” Lila carried love and light home.',
  ]
  lines.forEach((line, index) => context.fillText(line, 380, 340 + index * 58))
  context.fillRect(86, 800, 588, 2)
  context.font = '400 22px VT323, monospace'
  context.fillText('Story from the supplied Blue Star + Pink Rose receipt', 380, 866)
  context.fillText('Mysticism × Love', 380, 910)
  context.fillRect(86, 962, 588, 2)
  context.font = '600 27px VT323, monospace'
  context.fillText('ONE STORY / TWO OBJECTS', 380, 1030)
  context.font = '400 21px VT323, monospace'
  context.fillText('The full receipt remains available in the project archive.', 380, 1090)
  context.fillRect(86, 1160, 588, 2)
  context.font = '600 25px VT323, monospace'
  context.fillText('STORY ARCHIVED', 380, 1240)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 2
  return texture
}

function createReceiptMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: { uMap: { value: texture }, uFeed: { value: 0 }, uCurl: { value: 0 } },
    vertexShader: `
      uniform float uFeed;
      uniform float uCurl;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        float exposed = min(1.0 - uv.y, uFeed);
        vec3 transformed = position;
        transformed.y = -exposed * 2.8;
        float curl = pow(exposed, 1.6) * uCurl;
        transformed.z += curl * 0.28;
        transformed.x += sin(exposed * 7.0) * curl * 0.028;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uFeed;
      varying vec2 vUv;
      void main() {
        if (1.0 - vUv.y > uFeed) discard;
        float edge = smoothstep(0.0, 0.035, vUv.x) * smoothstep(0.0, 0.035, 1.0 - vUv.x);
        vec4 paper = texture2D(uMap, vUv);
        paper.rgb *= 0.88 + edge * 0.12;
        gl_FragColor = paper;
      }
    `,
  })
}

function quaternion(euler: VectorTuple) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(euler[0], euler[1], euler[2]))
}

function tweenPose(timeline: Timeline, object: THREE.Group, pose: ModelPose, at: number, duration: number) {
  const target = quaternion(pose.rotation)
  timeline.to(object.position, { x: pose.position[0], y: pose.position[1], z: pose.position[2], duration, ease: 'power2.inOut' }, at)
  timeline.to(object.scale, { x: pose.scale, y: pose.scale, z: pose.scale, duration, ease: 'power2.inOut' }, at)
  timeline.to(object.quaternion, {
    x: target.x,
    y: target.y,
    z: target.z,
    w: target.w,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => object.quaternion.normalize(),
  }, at)
}

function tweenOrientationAndScale(timeline: Timeline, object: THREE.Group, pose: ModelPose, at: number, duration: number) {
  const target = quaternion(pose.rotation)
  timeline.to(object.scale, { x: pose.scale, y: pose.scale, z: pose.scale, duration, ease: 'power2.inOut' }, at)
  timeline.to(object.quaternion, {
    x: target.x,
    y: target.y,
    z: target.z,
    w: target.w,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => object.quaternion.normalize(),
  }, at)
}

function revealChapter(timeline: Timeline, root: HTMLDivElement | null, id: MotionLabChapterId, enter: number, exit?: number) {
  const article = root?.querySelector<HTMLElement>(`[data-motion-chapter="${id}"]`)
  if (!article) return
  const heading = article.querySelectorAll<HTMLElement>('.motion-lab__chapter-number, h1')
  const supporting = article.querySelectorAll<HTMLElement>('p, small')
  timeline.set(article, { autoAlpha: 1, y: 0 }, enter)
  timeline.fromTo(heading, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 9, ease: 'power3.out', immediateRender: false }, enter + 1)
  timeline.fromTo(supporting, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 10, ease: 'power3.out', immediateRender: false }, enter + 4)
  if (exit !== undefined) {
    timeline.to([heading, supporting], { autoAlpha: 0, y: -5, duration: 6, ease: 'power2.in' }, exit)
    timeline.set(article, { autoAlpha: 0 }, exit + 6)
  }
}

function temporaryElement(root: HTMLDivElement | null, name: string) {
  return root?.querySelector<HTMLElement>(`[data-motion-temporary="${name}"]`) ?? null
}

function showTemporary(timeline: Timeline, root: HTMLDivElement | null, name: string, at: number, visibleFor: number, duration = 2) {
  const element = temporaryElement(root, name)
  if (!element) return
  timeline.fromTo(element, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration, ease: 'power3.out', immediateRender: false }, at)
  timeline.to(element, { autoAlpha: 0, y: -6, duration, ease: 'power2.in' }, at + visibleFor)
}

function receiptSlot(pose: ScenePose, mobileMain = false): VectorTuple {
  const printer = pose['receipt-printer'].position
  return [printer[0], printer[1] - (mobileMain ? 0.56 : 0.57), 0.78]
}

function StageSequence({ mainExperience, reducedMotion, onModelError, onTimelineReady, statusRootRef, textRootRef }: Pick<MotionLabStageProps, 'mainExperience' | 'reducedMotion' | 'onTimelineReady' | 'statusRootRef' | 'textRootRef'> & { readonly onModelError: (asset: ModelAsset, error: Error) => void }) {
  const refs: Record<MotionLabModelId, RefObject<THREE.Group | null>> = {
    'old-book': useRef<THREE.Group>(null),
    owl: useRef<THREE.Group>(null),
    snake: useRef<THREE.Group>(null),
    rose: useRef<THREE.Group>(null),
    crown: useRef<THREE.Group>(null),
    star: useRef<THREE.Group>(null),
    webcam: useRef<THREE.Group>(null),
    'receipt-printer': useRef<THREE.Group>(null),
    arduino: useRef<THREE.Group>(null),
  }
  const idleRefs: Record<MotionLabModelId, RefObject<THREE.Group | null>> = {
    'old-book': useRef<THREE.Group>(null),
    owl: useRef<THREE.Group>(null),
    snake: useRef<THREE.Group>(null),
    rose: useRef<THREE.Group>(null),
    crown: useRef<THREE.Group>(null),
    star: useRef<THREE.Group>(null),
    webcam: useRef<THREE.Group>(null),
    'receipt-printer': useRef<THREE.Group>(null),
    arduino: useRef<THREE.Group>(null),
  }
  const timelineRuntimeRef = useRef<Timeline | null>(null)
  const receiptRef = useRef<THREE.Group>(null)
  const cableMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const arduinoLightRef = useRef<THREE.PointLight>(null)
  const starAuraRef = useRef<THREE.PointLight>(null)
  const roseAuraRef = useRef<THREE.PointLight>(null)
  const archiveKeyRef = useRef<THREE.SpotLight>(null)
  const archiveRimRef = useRef<THREE.SpotLight>(null)
  const recognitionKeyRef = useRef<THREE.SpotLight>(null)
  const webcamRimRef = useRef<THREE.SpotLight>(null)
  const printerKeyRef = useRef<THREE.SpotLight>(null)
  const printerRimRef = useRef<THREE.SpotLight>(null)
  const acknowledgementRef = useRef<THREE.PointLight>(null)
  const slotLightRef = useRef<THREE.PointLight>(null)
  const paperGlowRef = useRef<THREE.PointLight>(null)
  const focusShimmerRef = useRef<THREE.SpotLight>(null)
  const floorShimmerRef = useRef<THREE.PointLight>(null)
  const mobileStageFillRef = useRef<THREE.PointLight>(null)
  const floorPoolRef = useRef<THREE.Mesh>(null)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const compact = size.width < 700
  const mobileMain = compact && mainExperience
  const receiptTexture = useMemo(createReceiptTexture, [])
  const receiptMaterial = useMemo(() => createReceiptMaterial(receiptTexture), [receiptTexture])
  const cableCurve = useMemo(() => mobileMain
    ? new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, -1.5, -0.08),
      new THREE.Vector3(0.4, -1.8, 0.1),
      new THREE.Vector3(0.65, -1.72, -0.1),
      new THREE.Vector3(0.86, -1.62, -0.1),
    ])
    : compact ? new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.25, -1.34, -0.08),
      new THREE.Vector3(0.65, -1.7, 0.12),
      new THREE.Vector3(0.8, -1.52, -0.12),
      new THREE.Vector3(1.0, -1.38, -0.1),
    ])
    : new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.35, -1.34, -0.08),
      new THREE.Vector3(1.95, -1.76, 0.12),
      new THREE.Vector3(2.62, -1.48, -0.12),
      new THREE.Vector3(3.2, -1.26, -0.1),
    ]), [compact, mobileMain])

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime
    const timelineTime = timelineRuntimeRef.current?.time() ?? 0
    const chapterIndex = Math.min(MOTION_LAB_CHAPTERS.length - 1, Math.max(0, Math.floor(timelineTime / CHAPTER_DURATION)))
    const holdStrength = holdStrengthAt(timelineTime)
    const motionStrength = reducedMotion ? 0 : mobileMain ? MOBILE_MAIN_STAGE.idleStrength : 1

    MODEL_IDS.forEach((id, index) => {
      const idle = idleRefs[id].current
      const root = refs[id].current
      if (!idle || !root || Math.abs(root.position.x) > (compact ? 4.5 : 7)) return
      const motion = IDLE_MOTION[id]
      const slowTime = elapsed * motion.speed + motion.phase + index * 0.013
      const idleX = Math.sin(slowTime * 0.71) * motion.lateral * motionStrength
      const idleY = Math.sin(slowTime) * motion.float * motionStrength
      idle.position.set(
        mobileMain ? THREE.MathUtils.clamp(idleX, MOBILE_MAIN_STAGE.safeFrame.left - root.position.x, MOBILE_MAIN_STAGE.safeFrame.right - root.position.x) : idleX,
        mobileMain ? THREE.MathUtils.clamp(idleY, MOBILE_MAIN_STAGE.safeFrame.bottom - root.position.y, MOBILE_MAIN_STAGE.safeFrame.top - root.position.y) : idleY,
        Math.cos(slowTime * 0.63) * motion.lateral * 0.55 * motionStrength,
      )
      idle.rotation.set(
        Math.sin(slowTime * 0.48) * motion.drift * 0.45 * motionStrength,
        Math.cos(slowTime * 0.42) * motion.drift * motionStrength,
        Math.sin(slowTime * 0.36) * motion.drift * 0.5 * motionStrength,
      )
      const breath = 1 + Math.sin(slowTime * 0.52) * motion.breathe * motionStrength
      idle.scale.setScalar(breath)
    })

    const floorShimmer = floorShimmerRef.current
    if (floorShimmer) {
      floorShimmer.position.x = Math.sin(elapsed * 0.16) * (compact ? 1.2 : 2.4)
      floorShimmer.position.z = 0.7 + Math.cos(elapsed * 0.13) * 0.35
      floorShimmer.intensity = reducedMotion ? 0.2 : 0.24 + Math.sin(elapsed * 0.31) * 0.04
    }
    const floorPool = floorPoolRef.current
    if (floorPool) {
      floorPool.position.x = reducedMotion ? 0 : Math.sin(elapsed * 0.14) * (compact ? 0.4 : 0.8)
      const material = floorPool.material as THREE.MeshBasicMaterial
      material.opacity = reducedMotion ? 0.04 : 0.045 + Math.sin(elapsed * 0.24) * 0.012
    }

    const focusShimmer = focusShimmerRef.current
    if (focusShimmer) {
      const hero = refs[HERO_BY_CHAPTER[chapterIndex]].current
      if (hero) focusShimmer.target.position.lerp(hero.position, reducedMotion ? 1 : 0.08)
      focusShimmer.position.x = reducedMotion ? -1.6 : -1.6 + Math.sin(elapsed * 0.19) * 0.16
      focusShimmer.position.y = reducedMotion ? 5.8 : 5.8 + Math.cos(elapsed * 0.17) * 0.09
      const heroIntensity = chapterIndex === 2 ? 2.05 : chapterIndex >= 9 ? 0.9 : 0.7
      focusShimmer.intensity = holdStrength * (heroIntensity + Math.sin(elapsed * 0.37) * 0.07)
      focusShimmer.color.copy(chapterIndex <= 3 ? FOCUS_COLORS.archive : chapterIndex <= 6 ? FOCUS_COLORS.recognition : FOCUS_COLORS.output)
    }
  })

  useEffect(() => () => {
    receiptTexture.dispose()
    receiptMaterial.dispose()
  }, [receiptMaterial, receiptTexture])

  const buildTimeline = useCallback(() => {
    const models = Object.fromEntries(MODEL_IDS.map((id) => [id, refs[id].current])) as Record<MotionLabModelId, THREE.Group | null>
    const receipt = receiptRef.current
    const cableMaterial = cableMaterialRef.current
    const archiveKey = archiveKeyRef.current
    const archiveRim = archiveRimRef.current
    const recognitionKey = recognitionKeyRef.current
    const webcamRim = webcamRimRef.current
    const printerKey = printerKeyRef.current
    const printerRim = printerRimRef.current
    const acknowledgement = acknowledgementRef.current
    const slotLight = slotLightRef.current
    const paperGlow = paperGlowRef.current
    const starAura = starAuraRef.current
    const roseAura = roseAuraRef.current
    const arduinoLight = arduinoLightRef.current
    const mobileStageFill = mobileStageFillRef.current
    if (
      Object.values(models).some((model) => !model) || !receipt || !cableMaterial || !archiveKey || !archiveRim ||
      !recognitionKey || !webcamRim || !printerKey || !printerRim || !acknowledgement || !slotLight ||
      !paperGlow || !starAura || !roseAura || !arduinoLight || !(camera instanceof THREE.PerspectiveCamera)
    ) return null

    const poses = createScenePoses(compact, mainExperience)
    const cameraTarget = new THREE.Vector3(...(mobileMain ? MOBILE_MAIN_STAGE.target : [0, -0.08, -0.35] as VectorTuple))
    MODEL_IDS.forEach((id) => {
      const pose = poses.archive[id]
      models[id]!.position.set(...pose.position)
      models[id]!.scale.setScalar(pose.scale)
      models[id]!.quaternion.copy(quaternion(pose.rotation))
    })
    camera.position.set(...(mobileMain ? MOBILE_MAIN_STAGE.camera : compact ? [0, 0.25, 14.6] as VectorTuple : [0, 0.32, 11.7] as VectorTuple))
    camera.fov = mobileMain ? MOBILE_MAIN_STAGE.fov : compact ? 38 : 36
    camera.lookAt(cameraTarget)
    camera.updateProjectionMatrix()

    const firstSlot = receiptSlot(poses.hardware, mobileMain)
    receipt.position.set(...firstSlot)
    receipt.rotation.set(0, 0, 0)
    archiveKey.target.position.set(0, -0.62, -0.35)
    archiveRim.target.position.set(0, -0.5, -0.5)
    recognitionKey.target.position.set(...poses.star.star.position)
    webcamRim.target.position.set(...poses.selection.webcam.position)
    printerKey.target.position.set(...poses.hardware['receipt-printer'].position)
    printerRim.target.position.set(...poses.hardware['receipt-printer'].position)

    const feed = receiptMaterial.uniforms.uFeed
    const curl = receiptMaterial.uniforms.uCurl
    feed.value = 0
    curl.value = 0
    gsap.set([starAura, roseAura, recognitionKey, webcamRim, printerKey, printerRim, acknowledgement, slotLight, paperGlow, arduinoLight], { intensity: 0 })
    if (mobileStageFill) gsap.set(mobileStageFill, { intensity: 2.35 })
    gsap.set(cableMaterial, { opacity: 0 })
    const chapterElements = statusRootRef.current?.querySelectorAll<HTMLElement>('[data-motion-chapter]') ?? []
    const chapterContent = statusRootRef.current?.querySelectorAll<HTMLElement>('.motion-lab__chapter-number, .motion-lab__chapter h1, .motion-lab__chapter p, .motion-lab__chapter small') ?? []
    const temporaryElements = textRootRef.current?.querySelectorAll<HTMLElement>('[data-motion-temporary]') ?? []
    gsap.set(chapterElements, { autoAlpha: 0, y: 10 })
    gsap.set(chapterContent, { autoAlpha: 0, y: 10 })
    gsap.set(temporaryElements, { autoAlpha: 0, y: 10 })

    const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
    timeline.data = { receiptFeed: feed }

    MOTION_LAB_CHAPTERS.forEach((chapter, index) => {
      const start = chapterStart(index)
      timeline.addLabel(chapter.enter, start)
      timeline.addLabel(chapter.hold, start + CHAPTER_ENTER)
      if (chapter.exit) timeline.addLabel(chapter.exit, start + CHAPTER_EXIT)
      revealChapter(timeline, statusRootRef.current, chapter.id, start, chapter.exit ? start + CHAPTER_EXIT : undefined)
      if (chapter.exit) timeline.to(temporaryElements, { autoAlpha: 0, y: -6, duration: 2, ease: 'power2.in' }, start + CHAPTER_EXIT)
    })

    // Archive, clean and training: readable tableaux with a focused book hierarchy.
    timeline.to(archiveKey, { intensity: LIGHTING.archiveKey, duration: 10 }, 0)
    timeline.to(archiveRim, { intensity: LIGHTING.archiveRim, duration: 10 }, 0)
    const cleanHold = chapterStart(1) + CHAPTER_ENTER
    ;['extract', 'ocr', 'clean', 'translate', 'label', 'merge'].forEach((term, index) => {
      showTemporary(timeline, textRootRef.current, `process-${term}`, cleanHold + 3 + index * 4, 48 - index * 4, 2.5)
    })
    const trainingHold = chapterStart(2) + CHAPTER_ENTER
    const cleanExit = chapterStart(1) + CHAPTER_EXIT
    timeline.to(archiveKey, { intensity: LIGHTING.trainingKey, angle: 0.42, duration: trainingHold - cleanExit }, cleanExit)
    timeline.to(archiveRim, { intensity: 1.05, duration: trainingHold - cleanExit }, cleanExit)
    showTemporary(timeline, textRootRef.current, 'qwen', trainingHold + 5, 51)
    showTemporary(timeline, textRootRef.current, 'lora', trainingHold + 10, 46)
    showTemporary(timeline, textRootRef.current, 'bge', trainingHold + 15, 41)
    showTemporary(timeline, textRootRef.current, 'rag', trainingHold + 20, 36)

    // Theme labels have dedicated anchors and fully clear before the next label arrives.
    const themesHold = chapterStart(3) + CHAPTER_ENTER
    const trainingExit = chapterStart(2) + CHAPTER_EXIT
    timeline.to(archiveKey, { intensity: 6.8, angle: 0.65, duration: themesHold - trainingExit }, trainingExit)
    timeline.to(archiveRim, { intensity: 2.5, duration: themesHold - trainingExit }, trainingExit)
    ;['theme-owl', 'theme-snake', 'theme-rose', 'theme-crown', 'theme-star'].forEach((name, index) => {
      showTemporary(timeline, textRootRef.current, name, themesHold + 3 + index * 11, 8, 2.5)
    })

    // Move primarily from EXIT through the following ENTER, arriving at the next HOLD.
    for (let index = 0; index < MOTION_LAB_CHAPTERS.length - 1; index += 1) {
      const current = MOTION_LAB_CHAPTERS[index]
      const next = MOTION_LAB_CHAPTERS[index + 1]
      const transitionStart = chapterStart(index) + CHAPTER_EXIT
      const transitionDuration = CHAPTER_DURATION - CHAPTER_EXIT + CHAPTER_ENTER
      MODEL_IDS.forEach((id) => {
        const customRecognitionPath = (current.id === 'selection' && id === 'star') || (current.id === 'star' && (id === 'star' || id === 'rose'))
        if (customRecognitionPath) return
        if (current.id === 'training' && next.id === 'themes' && id !== 'old-book') {
          const order: readonly MotionLabModelId[] = ['owl', 'snake', 'rose', 'crown', 'star', 'webcam', 'receipt-printer', 'arduino']
          const stagger = Math.max(0, order.indexOf(id)) * 1.15
          tweenPose(timeline, models[id]!, poses[next.id][id], transitionStart + stagger, transitionDuration - stagger)
          return
        }
        tweenPose(timeline, models[id]!, poses[next.id][id], transitionStart, transitionDuration)
      })
    }

    // Star approaches on a curved upper path and holds fully recognised.
    const selectionExit = chapterStart(4) + CHAPTER_EXIT
    const starHold = chapterStart(5) + CHAPTER_ENTER
    timeline.to(models.star!.position, {
      motionPath: {
        path: [
          { x: poses.selection.star.position[0], y: poses.selection.star.position[1] },
          { x: mobileMain ? -0.74 : compact ? -0.8 : -1.45, y: mobileMain ? -0.44 : compact ? 1.55 : 1.2 },
          { x: mobileMain ? -0.42 : compact ? -0.12 : -0.25, y: mobileMain ? -0.7 : 0.94 },
          { x: poses.star.star.position[0], y: poses.star.star.position[1] },
        ],
        curviness: 1.3,
      },
      z: poses.star.star.position[2],
      duration: starHold - selectionExit,
      ease: 'power2.inOut',
    }, selectionExit)
    const starTarget = quaternion(poses.star.star.rotation)
    timeline.to(models.star!.quaternion, { x: starTarget.x, y: starTarget.y, z: starTarget.z, w: starTarget.w, duration: starHold - selectionExit, onUpdate: () => models.star!.quaternion.normalize() }, selectionExit)
    timeline.to(models.star!.scale, { x: poses.star.star.scale, y: poses.star.star.scale, z: poses.star.star.scale, duration: starHold - selectionExit }, selectionExit)
    timeline.to(recognitionKey, { intensity: LIGHTING.recognitionKey, duration: 18 }, selectionExit)
    timeline.to(webcamRim, { intensity: LIGHTING.webcamRim, duration: 18 }, selectionExit)
    timeline.to(archiveKey, { intensity: 1.2, duration: 18 }, selectionExit)
    timeline.to(archiveRim, { intensity: 0.8, duration: 18 }, selectionExit)
    timeline.to(starAura, { intensity: mobileMain ? 3.2 : 2.35, duration: 5, ease: 'power3.out' }, starHold - 3)
    timeline.to(recognitionKey, { intensity: mobileMain ? LIGHTING.recognitionPeak * 1.22 : LIGHTING.recognitionPeak, duration: 3, ease: 'power3.out' }, starHold)
    timeline.to(webcamRim, { intensity: mobileMain ? LIGHTING.webcamPeak * 1.16 : LIGHTING.webcamPeak, duration: 3, ease: 'power3.out' }, starHold)
    timeline.to(acknowledgement, { intensity: LIGHTING.acknowledgement, duration: 3, ease: 'power3.out' }, starHold)
    timeline.to(starAura, { intensity: 0.92, duration: 8, ease: 'power2.inOut' }, starHold + 3)
    timeline.to(recognitionKey, { intensity: LIGHTING.recognitionKey, duration: 8 }, starHold + 3)
    timeline.to(webcamRim, { intensity: LIGHTING.webcamRim, duration: 8 }, starHold + 3)
    timeline.to(acknowledgement, { intensity: 0.38, duration: 8 }, starHold + 3)

    // Star clears to a readable completed position while Rose follows a distinct lower curve.
    const starExit = chapterStart(5) + CHAPTER_EXIT
    const roseHold = chapterStart(6) + CHAPTER_ENTER
    timeline.to(models.star!.position, {
      motionPath: { path: [
        { x: poses.star.star.position[0], y: poses.star.star.position[1] },
        { x: mobileMain ? -0.78 : compact ? -0.6 : -0.8, y: mobileMain ? -0.42 : 1.4 },
        { x: poses.rose.star.position[0], y: poses.rose.star.position[1] },
      ], curviness: 1.2 },
      z: poses.rose.star.position[2], duration: roseHold - starExit,
    }, starExit)
    tweenOrientationAndScale(timeline, models.star!, poses.rose.star, starExit, roseHold - starExit)
    timeline.to(models.rose!.position, {
      motionPath: { path: [
        { x: poses.star.rose.position[0], y: poses.star.rose.position[1] },
        { x: mobileMain ? -1.0 : compact ? -0.45 : -0.7, y: mobileMain ? -0.68 : compact ? -0.65 : -1.25 },
        { x: mobileMain ? -0.5 : 0.05, y: mobileMain ? -0.92 : -0.62 },
        { x: poses.rose.rose.position[0], y: poses.rose.rose.position[1] },
      ], curviness: 1.42 },
      z: poses.rose.rose.position[2], duration: roseHold - starExit,
    }, starExit)
    const roseTarget = quaternion(poses.rose.rose.rotation)
    timeline.to(models.rose!.quaternion, { x: roseTarget.x, y: roseTarget.y, z: roseTarget.z, w: roseTarget.w, duration: roseHold - starExit, onUpdate: () => models.rose!.quaternion.normalize() }, starExit)
    timeline.to(models.rose!.scale, { x: poses.rose.rose.scale, y: poses.rose.rose.scale, z: poses.rose.rose.scale, duration: roseHold - starExit }, starExit)
    timeline.to(starAura, { intensity: 0, duration: 10 }, starExit)
    timeline.to(roseAura, { intensity: mobileMain ? 3.05 : 2.15, duration: 5, ease: 'power3.out' }, roseHold - 3)
    timeline.to(recognitionKey, { intensity: mobileMain ? LIGHTING.recognitionPeak * 1.22 : LIGHTING.recognitionPeak, duration: 3, ease: 'power3.out' }, roseHold)
    timeline.to(webcamRim, { intensity: mobileMain ? LIGHTING.webcamPeak * 1.16 : LIGHTING.webcamPeak, duration: 3, ease: 'power3.out' }, roseHold)
    timeline.to(acknowledgement, { intensity: LIGHTING.acknowledgement, duration: 3, ease: 'power3.out' }, roseHold)
    timeline.to(roseAura, { intensity: 0.88, duration: 8, ease: 'power2.inOut' }, roseHold + 3)
    timeline.to(recognitionKey, { intensity: LIGHTING.recognitionKey, duration: 8 }, roseHold + 3)
    timeline.to(webcamRim, { intensity: LIGHTING.webcamRim, duration: 8 }, roseHold + 3)
    timeline.to(acknowledgement, { intensity: 0.38, duration: 8 }, roseHold + 3)

    const roseExit = chapterStart(6) + CHAPTER_EXIT
    timeline.to(roseAura, { intensity: 0, duration: 12 }, roseExit)
    timeline.to(recognitionKey, { intensity: 0.15, duration: 28 }, roseExit)
    timeline.to(webcamRim, { intensity: 0.4, duration: 28 }, roseExit)
    timeline.to(archiveKey, { intensity: 3.6, duration: 28 }, roseExit)
    timeline.to(archiveRim, { intensity: 1.7, duration: 28 }, roseExit)

    const retrievalHold = chapterStart(7) + CHAPTER_ENTER
    showTemporary(timeline, textRootRef.current, 'retrieval', retrievalHold + 10, 32)
    const generationHold = chapterStart(8) + CHAPTER_ENTER
    showTemporary(timeline, textRootRef.current, 'generation', generationHold + 10, 32)

    // Hardware arrives and connects before the receipt exists.
    const generationExit = chapterStart(8) + CHAPTER_EXIT
    const hardwareHold = chapterStart(9) + CHAPTER_ENTER
    if (mobileStageFill) timeline.to(mobileStageFill, { intensity: 0, duration: hardwareHold - generationExit }, generationExit)
    timeline.to(printerKey, { intensity: LIGHTING.printerKey, duration: hardwareHold - generationExit }, generationExit)
    timeline.to(printerRim, { intensity: LIGHTING.printerRim, duration: hardwareHold - generationExit }, generationExit)
    timeline.to(archiveKey, { intensity: 0.45, duration: hardwareHold - generationExit }, generationExit)
    timeline.to(archiveRim, { intensity: 0.35, duration: hardwareHold - generationExit }, generationExit)
    timeline.to(cableMaterial, { opacity: 0.72, duration: 6, ease: 'power2.out' }, hardwareHold - 8)
    timeline.to(arduinoLight, { intensity: LIGHTING.arduino, duration: 5 }, hardwareHold - 6)
    const printerTarget = mobileMain ? new THREE.Vector3(...MOBILE_MAIN_STAGE.printerTarget) : compact ? new THREE.Vector3(-0.15, -0.25, -0.35) : new THREE.Vector3(0.65, -0.22, -0.38)
    timeline.to(camera.position, { x: mobileMain ? MOBILE_MAIN_STAGE.printerCamera[0] : compact ? 0 : 0.1, y: mobileMain ? MOBILE_MAIN_STAGE.printerCamera[1] : compact ? 0.08 : 0.14, z: mobileMain ? MOBILE_MAIN_STAGE.printerCamera[2] : compact ? 13.2 : 9.8, duration: 40, ease: 'power1.inOut', onUpdate: () => camera.lookAt(cameraTarget) }, generationExit)
    timeline.to(cameraTarget, { x: printerTarget.x, y: printerTarget.y, z: printerTarget.z, duration: 40, ease: 'power1.inOut', onUpdate: () => camera.lookAt(cameraTarget) }, generationExit)

    // Receipt follows the printer's small hardware-to-printing repositioning.
    const hardwareExit = chapterStart(9) + CHAPTER_EXIT
    const printingHold = chapterStart(10) + CHAPTER_ENTER
    const printingSlot = receiptSlot(poses.printing, mobileMain)
    timeline.to(receipt.position, { x: printingSlot[0], y: printingSlot[1], z: printingSlot[2], duration: printingHold - hardwareExit }, hardwareExit)

    // Five paced feed stages: header, objects/themes, cultural DNA, story, footer.
    timeline.to(slotLight, { intensity: 1.1, duration: 4 }, printingHold + 4)
    timeline.to(paperGlow, { intensity: 0.55, duration: 4 }, printingHold + 4)
    timeline.to(feed, { value: 0.14, duration: 5, ease: 'power1.inOut' }, printingHold + 7)
    timeline.to(feed, { value: 0.3, duration: 5, ease: 'power1.inOut' }, printingHold + 17)
    timeline.to(slotLight, { intensity: LIGHTING.slot, duration: 6 }, printingHold + 17)
    timeline.to(paperGlow, { intensity: LIGHTING.paper, duration: 6 }, printingHold + 17)
    timeline.to(feed, { value: 0.46, duration: 5, ease: 'power1.inOut' }, printingHold + 27)
    timeline.to(feed, { value: 0.9, duration: 14, ease: 'none' }, printingHold + 37)
    timeline.to(curl, { value: 0.9, duration: 12, ease: 'power2.inOut' }, printingHold + 40)
    timeline.to(feed, { value: 1, duration: 5, ease: 'power1.out' }, printingHold + 54)
    timeline.to(curl, { value: 1, duration: 5 }, printingHold + 54)
    timeline.to(slotLight, { intensity: 2.4, duration: 10 }, printingHold + 54)
    timeline.to(paperGlow, { intensity: 2.65, duration: 10 }, printingHold + 54)

    const finalEnter = chapterStart(11)
    const finalHold = finalEnter + CHAPTER_ENTER
    const finalSlot = receiptSlot(poses.final, mobileMain)
    timeline.to(receipt.position, { x: finalSlot[0], y: finalSlot[1], z: finalSlot[2], duration: finalHold - (chapterStart(10) + CHAPTER_EXIT) }, chapterStart(10) + CHAPTER_EXIT)
    timeline.to(receipt.rotation, { z: -0.025, x: 0.035, duration: finalHold - finalEnter, ease: 'power2.out' }, finalEnter)
    const holdProxy = { value: 0 }
    timeline.to(holdProxy, { value: 1, duration: CHAPTER_DURATION - CHAPTER_ENTER, ease: 'none' }, finalHold)

    timelineRuntimeRef.current = timeline
    timeline.progress(reducedMotion ? 1 : 0)
    invalidate()
    return timeline
  }, [camera, compact, invalidate, mainExperience, mobileMain, receiptMaterial.uniforms, reducedMotion, statusRootRef, textRootRef])

  useGSAP(() => {
    const timeline = buildTimeline()
    if (!timeline) return
    onTimelineReady(timeline)
    return () => {
      onTimelineReady(null)
      timelineRuntimeRef.current = null
      timeline.kill()
    }
  }, { dependencies: [buildTimeline, onTimelineReady], revertOnUpdate: true })

  const initialPoses = createScenePoses(false, mainExperience).archive
  return <>
    <ambientLight color="#d2dbe3" intensity={LIGHTING.fill} />
    <hemisphereLight args={['#a0b4c6', '#101215', LIGHTING.hemisphere]} />
    <rectAreaLight color="#e8edf2" intensity={LIGHTING.frontFill} width={8.5} height={4.6} position={[0, 2.2, 6.6]} rotation={[-0.18, 0, 0]} />
    <spotLight ref={archiveKeyRef} color="#f0c890" intensity={0} position={[-2.4, 5.4, 5.2]} angle={0.65} penumbra={0.92} target-position={[0, -0.62, -0.35]} />
    <spotLight ref={archiveRimRef} color="#bdc9da" intensity={0} position={[3.6, 4.6, -1.6]} angle={0.62} penumbra={0.9} target-position={[0, -0.5, -0.5]} />
    <spotLight ref={recognitionKeyRef} color="#e8eef5" intensity={0} position={[-4.8, 5.8, 6.3]} angle={0.62} penumbra={0.9} target-position={[0.65, 0.34, 0.86]} />
    <spotLight ref={webcamRimRef} color="#b8c8d8" intensity={0} position={[4.4, 5.2, -1.4]} angle={0.55} penumbra={0.92} target-position={[2.05, 0.16, -0.65]} />
    <spotLight ref={printerKeyRef} color="#f2e9dc" intensity={0} position={[-1.2, 5.8, 5.4]} angle={0.62} penumbra={0.9} target-position={[0.62, -0.1, -0.4]} />
    <spotLight ref={printerRimRef} color="#b9c6d5" intensity={0} position={[4.4, 3.8, -1.2]} angle={0.5} penumbra={0.94} target-position={[0.62, -0.1, -0.4]} />
    <spotLight ref={focusShimmerRef} color="#f0c994" intensity={0} position={[-1.6, 5.8, 4.8]} angle={0.54} penumbra={0.96} target-position={[0, -0.4, -0.35]} />
    <pointLight ref={floorShimmerRef} color="#8fa9bd" intensity={0.2} distance={5.2} decay={2} position={[0, -1.78, 0.7]} />
    {mobileMain && <pointLight ref={mobileStageFillRef} color="#ced8e2" intensity={2.35} distance={7.2} decay={2} position={[0, -0.72, 4.5]} />}
    <pointLight ref={acknowledgementRef} color="#d9ecff" intensity={0} distance={2.6} decay={2} position={[0.7, 0.32, 1.02]} />
    <pointLight ref={slotLightRef} color="#f2dfbd" intensity={0} distance={2.2} decay={2} position={[0.9, -0.68, 0.94]} />
    <pointLight ref={paperGlowRef} color="#ffc47b" intensity={0} distance={3.1} decay={2} position={[0.9, -1.1, 0.72]} />
    <directionalLight color="#e6edf3" intensity={2.35} position={[-3.5, 5.8, 7.8]} />
    <directionalLight color="#a9bacb" intensity={1.65} position={[5.4, 3.6, 4.2]} />
    {mobileMain ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.12, -0.3]}>
      <planeGeometry args={[7.2, 4.8]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        toneMapped={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          void main() {
            vec2 centred = (vUv - 0.5) * vec2(1.0, 1.32);
            float falloff = 1.0 - smoothstep(0.16, 0.46, length(centred));
            gl_FragColor = vec4(vec3(0.10, 0.112, 0.126), falloff * 0.16);
          }
        `}
      />
    </mesh> : <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, -1.2]}>
        <planeGeometry args={[28, 28]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          toneMapped={false}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              vec2 centred = (vUv - 0.5) * vec2(0.82, 1.0);
              float falloff = 1.0 - smoothstep(0.08, 0.54, length(centred));
              gl_FragColor = vec4(vec3(0.055, 0.062, 0.071), falloff * 0.82);
            }
          `}
        />
      </mesh>
      <mesh ref={floorPoolRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.142, -0.35]} scale={[5.4, 1.35, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#536878" transparent opacity={0.04} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.135, -0.4]} scale={[3.3, 0.7, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#070809" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </>}
    <Model id="old-book" modelRef={refs['old-book']} idleRef={idleRefs['old-book']} pose={initialPoses['old-book']} displayRotation={[0.6, -0.56, 0.035]} onError={onModelError} />
    <Model id="owl" modelRef={refs.owl} idleRef={idleRefs.owl} pose={initialPoses.owl} onError={onModelError} />
    <Model id="snake" modelRef={refs.snake} idleRef={idleRefs.snake} pose={initialPoses.snake} onError={onModelError} />
    <Model id="rose" modelRef={refs.rose} idleRef={idleRefs.rose} pose={initialPoses.rose} onError={onModelError}>
      <pointLight ref={roseAuraRef} color="#b8d8ff" intensity={0} distance={2.75} decay={2} position={[0, 0.1, 0.52]} />
    </Model>
    <Model id="crown" modelRef={refs.crown} idleRef={idleRefs.crown} pose={initialPoses.crown} onError={onModelError} />
    <Model id="star" modelRef={refs.star} idleRef={idleRefs.star} pose={initialPoses.star} onError={onModelError}>
      <pointLight ref={starAuraRef} color="#a9d7ff" intensity={0} distance={2.75} decay={2} position={[0, 0.08, 0.54]} />
    </Model>
    <Model id="webcam" modelRef={refs.webcam} idleRef={idleRefs.webcam} pose={initialPoses.webcam} displayRotation={[0.02, -1.18, 0]} onError={onModelError} />
    <Model id="receipt-printer" modelRef={refs['receipt-printer']} idleRef={idleRefs['receipt-printer']} pose={initialPoses['receipt-printer']} onError={onModelError} />
    <Model id="arduino" modelRef={refs.arduino} idleRef={idleRefs.arduino} pose={initialPoses.arduino} onError={onModelError}>
      <pointLight ref={arduinoLightRef} color="#91d8a1" intensity={0} distance={1.5} decay={2} position={[0.15, 0.18, 0.45]} />
    </Model>
    <group ref={receiptRef} position={[0.62, -0.72, 0.78]} scale={mobileMain ? 0.78 : 1}>
      <mesh><planeGeometry args={[1.02, 2.8, 16, 96]} /><primitive object={receiptMaterial} attach="material" /></mesh>
    </group>
    <mesh>
      <tubeGeometry args={[cableCurve, 32, 0.026, 8, false]} />
      <meshStandardMaterial ref={cableMaterialRef} color="#31353a" roughness={0.82} metalness={0.2} transparent opacity={0} />
    </mesh>
  </>
}

export function MotionLabStage({ mainExperience, renderActive, reducedMotion, onContextFailure, onTimelineReady, statusRootRef, textRootRef }: MotionLabStageProps) {
  const [modelErrors, setModelErrors] = useState<ReadonlyMap<string, string>>(() => new Map())
  const [mobileViewport, setMobileViewport] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  const onModelError = useCallback((asset: ModelAsset, error: Error) => {
    setModelErrors((current) => new Map(current).set(asset.id, `${asset.label}: ${error.message}`))
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const update = () => setMobileViewport(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return <div className="motion-lab__canvas" role="img" aria-label="Twelve held exhibition chapters connect the archive, object recognition, story generation, printer and Arduino fallback.">
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.32, 11.7], fov: 36, near: 0.1, far: 45 }}
      dpr={mobileViewport ? 1 : [1, 1.5]}
      frameloop={!renderActive ? 'never' : reducedMotion ? 'demand' : 'always'}
      shadows={false}
      gl={{ alpha: false, antialias: true, depth: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0c0d0f', 1)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.4
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <ContextLossListener onContextFailure={onContextFailure} />
      <Suspense fallback={null}>
        <StageSequence mainExperience={mainExperience} reducedMotion={reducedMotion} onModelError={onModelError} onTimelineReady={onTimelineReady} statusRootRef={statusRootRef} textRootRef={textRootRef} />
      </Suspense>
    </Canvas>
    {modelErrors.size > 0 && <p className="motion-lab__model-error" role="status">3D fallback active · {[...modelErrors.values()].join(' · ')}</p>}
  </div>
}

for (const id of MODEL_IDS) useGLTF.preload(modelUrl(findModelAsset(id)))
