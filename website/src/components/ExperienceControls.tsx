export type MotionMode = 'system' | 'calm'
export type VisualMode = 'stage' | 'without-3d'
export type WebGLStatus = 'checking' | 'available' | 'unavailable'

interface ExperienceControlsProps {
  readonly motionMode: MotionMode
  readonly visualMode: VisualMode
  readonly webglStatus: WebGLStatus
  readonly onMotionChange: (mode: MotionMode) => void
  readonly onVisualChange: (mode: VisualMode) => void
}

export function ExperienceControls({
  motionMode,
  visualMode,
  webglStatus,
  onMotionChange,
  onVisualChange,
}: ExperienceControlsProps) {
  const stageUnavailable = webglStatus === 'unavailable'

  return (
    <section className="experience-controls" aria-labelledby="experience-heading">
      <div>
        <p className="control-kicker">Your experience</p>
        <h2 id="experience-heading">Choose the pace and visual layer</h2>
      </div>
      <div className="control-groups">
        <fieldset>
          <legend>Motion</legend>
          <button
            type="button"
            aria-pressed={motionMode === 'system'}
            onClick={() => onMotionChange('system')}
          >
            Use device setting
          </button>
          <button
            type="button"
            aria-pressed={motionMode === 'calm'}
            onClick={() => onMotionChange('calm')}
          >
            Calm version
          </button>
        </fieldset>
        <fieldset>
          <legend>Visual layer</legend>
          <button
            type="button"
            aria-pressed={visualMode === 'stage'}
            disabled={stageUnavailable}
            onClick={() => onVisualChange('stage')}
          >
            Visual stage
          </button>
          <button
            type="button"
            aria-pressed={visualMode === 'without-3d'}
            onClick={() => onVisualChange('without-3d')}
          >
            View without 3D
          </button>
        </fieldset>
      </div>
      <p className="control-status" role="status" aria-live="polite">
        {webglStatus === 'checking' && 'Checking visual-stage support…'}
        {webglStatus === 'available' &&
          (visualMode === 'without-3d'
            ? 'The 3D layer is off. Every stage remains available as text.'
            : 'The persistent 3D stage is active. Every stage remains available as text.')}
        {webglStatus === 'unavailable' &&
          'WebGL is unavailable. The complete semantic narrative remains active.'}
      </p>
    </section>
  )
}
