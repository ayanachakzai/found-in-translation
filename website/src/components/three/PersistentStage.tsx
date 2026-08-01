import { useProgress } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import type { MotionMode } from '../ExperienceControls'
import type { ModelAsset } from '../../lib/assets'
import {
  sceneIndex,
  useActiveScene,
  type SceneId,
} from '../../scene/sceneStore'
import { RegisteredModel } from './RegisteredModel'

interface PersistentStageProps {
  readonly motionMode: MotionMode
  readonly onWebglFailure: (reason: string) => void
}

interface CanvasErrorBoundaryProps {
  readonly onError: (error: Error) => void
  readonly children: ReactNode
}

const sceneLabels: Record<SceneId, string> = {
  top: 'Five trigger objects',
  'missing-archive': 'The missing archive',
  dataset: 'Building the dataset',
  tokens: 'Tokens as interfaces',
  recognition: 'Recognition stage',
  retrieval: 'Retrieval stage',
  generation: 'Generation stage',
  printing: 'Thermal output',
  provenance: 'Source provenance',
  archive: 'Recorded archive',
  limitations: 'Process limitations',
  credits: 'Fallback hardware',
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function usePageBreakpoints() {
  const read = () => ({
    compact: window.innerWidth < 700,
    tablet: window.innerWidth >= 700 && window.innerWidth < 1080,
  })
  const [breakpoints, setBreakpoints] = useState(read)

  useEffect(() => {
    const update = () => setBreakpoints(read())
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  return breakpoints
}

function useReachedScene(target: SceneId): boolean {
  const activeScene = useActiveScene()
  const [reached, setReached] = useState(
    () => sceneIndex(activeScene) >= sceneIndex(target),
  )

  useEffect(() => {
    if (sceneIndex(activeScene) >= sceneIndex(target)) setReached(true)
  }, [activeScene, target])

  return reached
}

function ResponsiveCamera({
  compact,
  tablet,
}: {
  readonly compact: boolean
  readonly tablet: boolean
}) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    camera.position.set(0, compact ? 0.08 : 0, compact ? 8.9 : tablet ? 8.5 : 8.1)
    camera.fov = compact ? 49 : tablet ? 46 : 42
    camera.near = 0.1
    camera.far = 32
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, compact, size.height, size.width, tablet])

  return null
}

function ContextLossListener({
  onFailure,
}: {
  readonly onFailure: (reason: string) => void
}) {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const canvas = gl.domElement
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      onFailure('The WebGL context was lost.')
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost)
  }, [gl, onFailure])

  return null
}

function StageLighting() {
  return (
    <>
      <hemisphereLight args={['#efe7d5', '#17130f', 1.25]} />
      <directionalLight color="#fff1d6" intensity={2.8} position={[4, 6, 7]} />
      <directionalLight color="#7097ba" intensity={1.05} position={[-4, 1.5, 4]} />
    </>
  )
}

function StageModels({
  motionEnabled,
  compact,
  tablet,
  onModelError,
}: {
  readonly motionEnabled: boolean
  readonly compact: boolean
  readonly tablet: boolean
  readonly onModelError: (asset: ModelAsset, error: Error) => void
}) {
  const activeScene = useActiveScene()
  const reachedDataset = useReachedScene('dataset')
  const reachedRecognition = useReachedScene('recognition')
  const reachedOutput = useReachedScene('printing')
  const reachedDetail = useReachedScene('credits')

  const showConstellation = (
    ['top', 'missing-archive', 'tokens'] as SceneId[]
  ).includes(activeScene)
  const showRemixAnchors = (
    ['retrieval', 'generation'] as SceneId[]
  ).includes(activeScene)
  const showRecognition = activeScene === 'recognition'
  const showBook = activeScene === 'dataset'
  const showOutput = (
    ['printing', 'provenance', 'archive', 'limitations'] as SceneId[]
  ).includes(activeScene)
  const showDetail = activeScene === 'credits'
  const sceneScale = compact ? 0.78 : tablet ? 0.9 : 1

  return (
    <group scale={sceneScale}>
      <RegisteredModel
        id="owl"
        placement="constellation"
        visible={showConstellation}
        motionEnabled={motionEnabled}
        onError={onModelError}
      />
      <RegisteredModel
        id="snake"
        placement="constellation"
        visible={showConstellation}
        motionEnabled={motionEnabled}
        onError={onModelError}
      />
      <RegisteredModel
        id="crown"
        placement="constellation"
        visible={showConstellation}
        motionEnabled={motionEnabled}
        onError={onModelError}
      />
      <RegisteredModel
        id="star"
        placement={
          showRecognition
            ? 'recognition'
            : showRemixAnchors
              ? 'remix-anchors'
              : 'constellation'
        }
        visible={showConstellation || showRecognition || showRemixAnchors}
        motionEnabled={motionEnabled}
        onError={onModelError}
      />
      <RegisteredModel
        id="rose"
        placement={
          showRecognition
            ? 'recognition'
            : showRemixAnchors
              ? 'remix-anchors'
              : 'constellation'
        }
        visible={showConstellation || showRecognition || showRemixAnchors}
        motionEnabled={motionEnabled}
        onError={onModelError}
      />

      {reachedDataset && (
        <RegisteredModel
          id="old-book"
          placement="dataset"
          visible={showBook}
          motionEnabled={false}
          onError={onModelError}
        />
      )}
      {reachedRecognition && (
        <RegisteredModel
          id="webcam"
          placement="recognition"
          visible={showRecognition}
          motionEnabled={false}
          onError={onModelError}
        />
      )}
      {reachedOutput && (
        <>
          <RegisteredModel
            id="receipt-printer"
            placement="output"
            visible={showOutput}
            motionEnabled={false}
            onError={onModelError}
          />
          <RegisteredModel
            id="paper-roll"
            placement="output"
            visible={showOutput}
            motionEnabled={false}
            onError={onModelError}
          />
        </>
      )}
      {reachedDetail && (
        <RegisteredModel
          id="arduino"
          placement="detail"
          visible={showDetail}
          motionEnabled={false}
          onError={onModelError}
        />
      )}
    </group>
  )
}

function StageStatus({
  activeScene,
  modelErrors,
}: {
  readonly activeScene: SceneId
  readonly modelErrors: ReadonlyMap<string, string>
}) {
  const { active, progress, loaded, total } = useProgress()
  const roundedProgress = Math.round(progress)

  return (
    <div
      className="webgl-stage-status"
      data-loading={active ? 'true' : 'false'}
      role="status"
      aria-live="polite"
    >
      <span className="webgl-stage-status__signal" aria-hidden="true" />
      <span>
        {active
          ? `Loading 3D archive · ${roundedProgress}%`
          : `3D stage · ${sceneLabels[activeScene]}`}
      </span>
      {active && (
        <progress
          aria-label="3D model loading progress"
          max={100}
          value={roundedProgress}
        />
      )}
      {total > 0 && active && (
        <span className="webgl-stage-status__count">
          {loaded}/{total} resources
        </span>
      )}
      {modelErrors.size > 0 && (
        <span className="webgl-stage-status__error">
          {modelErrors.size} model {modelErrors.size === 1 ? 'fallback' : 'fallbacks'} active
        </span>
      )}
    </div>
  )
}

export function PersistentStage({
  motionMode,
  onWebglFailure,
}: PersistentStageProps) {
  const activeScene = useActiveScene()
  const { compact, tablet } = usePageBreakpoints()
  const [modelErrors, setModelErrors] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  )
  const motionEnabled = motionMode !== 'calm'
  const hasVisibleIdleMotion =
    motionEnabled &&
    (
      [
        'top',
        'missing-archive',
        'tokens',
        'recognition',
        'retrieval',
        'generation',
      ] as SceneId[]
    ).includes(activeScene)

  const handleModelError = useCallback((asset: ModelAsset, error: Error) => {
    setModelErrors((current) => {
      const next = new Map(current)
      next.set(asset.id, error.message)
      return next
    })
  }, [])

  const handleCanvasError = useCallback(
    (error: Error) => onWebglFailure(error.message || 'The 3D stage could not start.'),
    [onWebglFailure],
  )

  const dpr = useMemo<[number, number]>(
    () => (compact ? [0.75, 1.1] : tablet ? [0.9, 1.3] : [1, 1.5]),
    [compact, tablet],
  )

  return (
    <div
      className="webgl-stage"
      data-scene={activeScene}
    >
      <div
        className="webgl-stage__canvas"
        role="img"
        aria-label="A persistent three-dimensional reconstruction of the installation objects. All explanatory content is repeated in the page text."
      >
        <CanvasErrorBoundary onError={handleCanvasError}>
          <Canvas
            aria-hidden="true"
            camera={{ position: [0, 0, 8.1], fov: 42, near: 0.1, far: 32 }}
            dpr={dpr}
            frameloop={hasVisibleIdleMotion ? 'always' : 'demand'}
            gl={{
              alpha: true,
              antialias: !compact,
              depth: true,
              // Software-backed contexts still get the deliberately lightweight
              // stage; visitors can opt out with the persistent no-3D control.
              failIfMajorPerformanceCaveat: false,
              powerPreference: 'high-performance',
              stencil: false,
            }}
            performance={{ min: 0.6 }}
            onCreated={({ gl }) => {
              gl.setClearColor('#0b0b0a', 0)
              gl.toneMapping = THREE.ACESFilmicToneMapping
              gl.toneMappingExposure = 1.08
            }}
          >
            <ResponsiveCamera compact={compact} tablet={tablet} />
            <ContextLossListener onFailure={onWebglFailure} />
            <StageLighting />
            <StageModels
              motionEnabled={motionEnabled}
              compact={compact}
              tablet={tablet}
              onModelError={handleModelError}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </div>
      <StageStatus activeScene={activeScene} modelErrors={modelErrors} />
    </div>
  )
}
