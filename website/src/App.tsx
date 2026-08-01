import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { supportsWebGL } from './lib/webgl'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const MotionLabExperience = lazy(() =>
  import('./motion-lab/MotionLab').then((module) => ({
    default: module.MotionLabExperience,
  })),
)

interface IntroSequenceProps {
  readonly onInstallationAccessibleChange: (accessible: boolean) => void
  readonly onIdleActiveChange: (active: boolean) => void
}

function syncChapterHandoff(progress: number) {
  const api = window.__motionLab as (typeof window.__motionLab & {
    setIntroOpeningProgress?: (value: number) => void
    setChapterScrollEnabled?: (enabled: boolean) => void
  })
  const openingProgress = gsap.utils.clamp(0, 1, (progress - 0.82) / 0.18)
  if (progress >= 0.999) {
    api?.setIntroOpeningProgress?.(1)
    api?.setChapterScrollEnabled?.(true)
    return
  }
  api?.setChapterScrollEnabled?.(false)
  api?.setIntroOpeningProgress?.(openingProgress)
}

function IntroSequence({ onInstallationAccessibleChange, onIdleActiveChange }: IntroSequenceProps) {
  const introRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const blackoutRef = useRef<HTMLDivElement>(null)
  const titleGroupRef = useRef<HTMLDivElement>(null)
  const titleHeadingRef = useRef<HTMLHeadingElement>(null)
  const titleCueRef = useRef<HTMLParagraphElement>(null)
  const teamNamesRef = useRef<HTMLParagraphElement>(null)
  const teamCueRef = useRef<HTMLParagraphElement>(null)
  const idleActiveRef = useRef(false)
  const installationAccessibleRef = useRef(false)

  const setIdleActive = useCallback((active: boolean) => {
    if (idleActiveRef.current === active) return
    idleActiveRef.current = active
    onIdleActiveChange(active)
  }, [onIdleActiveChange])

  const setInstallationAccessible = useCallback((accessible: boolean) => {
    if (installationAccessibleRef.current === accessible) return
    installationAccessibleRef.current = accessible
    onInstallationAccessibleChange(accessible)
  }, [onInstallationAccessibleChange])

  useGSAP(() => {
    const intro = introRef.current
    const stage = stageRef.current
    const blackout = blackoutRef.current
    const titleGroup = titleGroupRef.current
    const titleHeading = titleHeadingRef.current
    const titleCue = titleCueRef.current
    const teamNames = teamNamesRef.current
    const teamCue = teamCueRef.current
    if (!intro || !stage || !blackout || !titleGroup || !titleHeading || !titleCue || !teamNames || !teamCue) return

    gsap.set(blackout, { opacity: 1 })
    gsap.set([titleGroup, titleCue], { autoAlpha: 1, y: 0 })
    gsap.set([teamNames, teamCue], { autoAlpha: 0 })

    const playhead = { progress: 0 }
    const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    timeline
      .addLabel('title-hold', 0)
      .to(playhead, { progress: 1, duration: 100 }, 0)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timeline
        .set([titleGroup, titleCue], { autoAlpha: 0 }, 35)
        .set([teamNames, teamCue], { autoAlpha: 1, x: 0, y: 0 }, 40)
        .set([teamNames, teamCue], { autoAlpha: 0 }, 70)
        .set(blackout, { opacity: 0 }, 88)
    } else {
      timeline
        .to(titleHeading, { scaleX: 1.012, scaleY: 1.006, duration: 25, ease: 'sine.inOut' }, 0)
        .addLabel('title-exit', 25)
        .to(titleGroup, { autoAlpha: 0, y: -18, duration: 10, ease: 'power2.in' }, 25)
        .to(titleCue, { autoAlpha: 0, y: -6, duration: 7, ease: 'power2.in' }, 25)
        .addLabel('team-enter', 40)
        .fromTo(teamNames, { autoAlpha: 0, x: -14, y: 0 }, { autoAlpha: 1, x: 0, y: 0, duration: 6, ease: 'power3.out', immediateRender: false }, 40)
        .fromTo(teamCue, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 5, ease: 'power3.out', immediateRender: false }, 42)
        .addLabel('team-exit', 65)
        .to(teamNames, { autoAlpha: 0, y: -18, duration: 9, ease: 'power2.out' }, 65)
        .to(teamCue, { autoAlpha: 0, y: -6, duration: 6, ease: 'power2.out' }, 65)
        .addLabel('installation-reveal', 68)
        .to(blackout, { opacity: 0, duration: 32, ease: 'none' }, 68)
    }

    ScrollTrigger.create({
      id: 'home-intro',
      trigger: intro,
      start: 'top top',
      end: 'bottom top',
      animation: timeline,
      scrub: true,
      pin: stage,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setIdleActive(self.progress >= 0.68)
        setInstallationAccessible(self.progress >= 0.9)
        syncChapterHandoff(self.progress)
      },
      onLeave: () => {
        setIdleActive(true)
        setInstallationAccessible(true)
        syncChapterHandoff(1)
      },
      onEnterBack: (self) => {
        setInstallationAccessible(self.progress >= 0.9)
        syncChapterHandoff(self.progress)
      },
    })
  }, { dependencies: [setIdleActive, setInstallationAccessible], scope: introRef })

  return (
    <div ref={introRef} className="home-intro">
      <div ref={stageRef} className="home-intro-stage">
        <div ref={blackoutRef} className="home-intro-blackout" aria-hidden="true" />
        <section className="home-intro-panel home-intro-panel--title" aria-labelledby="home-title">
          <div ref={titleGroupRef} className="home-intro-title-group">
            <h1 ref={titleHeadingRef} id="home-title">FOUND IN TRANSLATION</h1>
            <p className="home-intro-disclaimer">A curated artistic research project — not a complete cultural archive.</p>
          </div>
          <p ref={titleCueRef} className="home-intro-cue">SCROLL TO CONTINUE</p>
        </section>
        <section className="home-intro-panel home-intro-panel--team" aria-label="Project team">
          <p ref={teamNamesRef} className="home-intro-team-names">
            <span>Maria Naqvi · Daria Cotocu ·</span>{' '}
            <span>Muhammad Ayan Achakzai · Harshada Pathare</span>
          </p>
          <p ref={teamCueRef} className="home-intro-cue">SCROLL TO ENTER THE INSTALLATION</p>
        </section>
      </div>
    </div>
  )
}

export function App() {
  const [webglStatus, setWebglStatus] = useState<'checking' | 'ready' | 'failed'>('checking')
  const [idleActive, setIdleActive] = useState(false)
  const [installationAccessible, setInstallationAccessible] = useState(false)
  const [workflowReady, setWorkflowReady] = useState(false)
  const handleContextFailure = useCallback(() => setWebglStatus('failed'), [])
  const handleWorkflowReady = useCallback(() => {
    setWorkflowReady(true)
    syncChapterHandoff(ScrollTrigger.getById('home-intro')?.progress ?? 0)
  }, [])

  useEffect(() => {
    setWebglStatus(supportsWebGL() ? 'ready' : 'failed')
  }, [])

  return (
    <main className="home-experience">
      <IntroSequence
        onIdleActiveChange={setIdleActive}
        onInstallationAccessibleChange={setInstallationAccessible}
      />

      <div
        className="home-workflow-layer"
        data-idle-active={idleActive ? 'true' : 'false'}
        data-ready={workflowReady ? 'true' : 'false'}
        aria-hidden={!installationAccessible}
      >
        {webglStatus === 'failed' ? (
          <section className="home-workflow-fallback" aria-label="Animated workflow unavailable">
            <p>3D unavailable</p>
            <h2>Blue star. Pink rose. One printed story.</h2>
          </section>
        ) : (
          <Suspense fallback={<section className="home-workflow-boot" aria-label="Preparing the animated workflow" />}>
            {webglStatus === 'ready' && (
              <MotionLabExperience
                embedded
                deferOpeningToIntro
                renderActive={idleActive}
                onReady={handleWorkflowReady}
                onContextFailure={handleContextFailure}
              />
            )}
          </Suspense>
        )}
      </div>
    </main>
  )
}
