import type { NarrativeScene } from '../content'

interface NarrativeSectionProps {
  readonly scene: NarrativeScene
  readonly children?: React.ReactNode
}

export function NarrativeSection({ scene, children }: NarrativeSectionProps) {
  return (
    <section className="scene" id={scene.id} aria-labelledby={`${scene.id}-title`}>
      <div className="scene-marker" aria-hidden="true">
        {scene.number}
      </div>
      <div className="scene-copy">
        <p className="eyebrow">{scene.eyebrow}</p>
        <h2 id={`${scene.id}-title`}>{scene.title}</h2>
        <p className="scene-summary">{scene.summary}</p>
        <ul className="scene-details">
          {scene.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        {children}
      </div>
    </section>
  )
}
