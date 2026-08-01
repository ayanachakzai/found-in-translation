import { useGSAP } from '@gsap/react'
import { useProgress } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supportsWebGL } from '../lib/webgl'
import { MOTION_LAB_CHAPTERS, MOTION_LAB_MARKERS, chapterForTime } from './chapters'
import { MotionLabStage } from './MotionLabStage'
import './motion-lab.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

type Timeline = ReturnType<typeof gsap.timeline>

export interface MotionLabApi {
  readonly ready: boolean
  readonly labels: Readonly<Record<string, number>>
  getDiagnostics: () => { readonly duration: number; readonly feed: number; readonly time: number }
  getProgress: () => number
  setProgress: (progress: number) => void
}

declare global { interface Window { __motionLab?: MotionLabApi } }

function reducedMotionPreference() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function statusAt(timeline: Timeline, progress: number) {
  return chapterForTime(timeline.duration() * progress).heading
}

function markerAt(timeline: Timeline, progress: number) {
  const time = timeline.duration() * progress
  let marker: string = MOTION_LAB_MARKERS[0]
  for (const candidate of MOTION_LAB_MARKERS) {
    if ((timeline.labels[candidate] ?? Infinity) <= time + 0.0001) marker = candidate
  }
  return marker
}

function MotionLabLoadStatus() {
  const { active, progress } = useProgress()
  if (!active) return null
  return <p className="motion-lab__loading" role="status">Loading the physical sequence · {Math.round(progress)}%</p>
}

function MotionFallback() {
  return <main className="motion-lab-fallback"><p>3D unavailable</p><h1>Blue star. Pink rose. One printed story.</h1></main>
}

interface MotionLabExperienceProps {
  readonly embedded?: boolean
  readonly forceReducedMotion?: boolean
  readonly onContextFailure?: () => void
}

export function MotionLabExperience({ embedded = false, forceReducedMotion = false, onContextFailure }: MotionLabExperienceProps) {
  const rootRef = useRef<HTMLElement>(null)
  const timelineRef = useRef<Timeline | null>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const progressRef = useRef<HTMLOutputElement>(null)
  const markerRef = useRef<HTMLOutputElement>(null)
  const chapterRef = useRef<HTMLOutputElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)
  const liveRef = useRef<HTMLParagraphElement>(null)
  const statusRootRef = useRef<HTMLDivElement>(null)
  const textRootRef = useRef<HTMLDivElement>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)
  const reducedMotion = forceReducedMotion || systemReducedMotion
  const showDeveloperControls = import.meta.env.DEV && !embedded

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setSystemReducedMotion(media.matches)
    if (!embedded) document.documentElement.dataset.page = 'motion-lab'
    if (embedded) document.documentElement.dataset.workflow = 'embedded'
    sync()
    media.addEventListener('change', sync)
    return () => {
      if (!embedded) delete document.documentElement.dataset.page
      if (embedded) delete document.documentElement.dataset.workflow
      delete window.__motionLab
      media.removeEventListener('change', sync)
    }
  }, [embedded])

  const syncInterface = useCallback((activeTimeline: Timeline, value: number) => {
    const progress = gsap.utils.clamp(0, 1, value)
    if (sliderRef.current) sliderRef.current.value = String(progress)
    if (progressRef.current) progressRef.current.value = `${Math.round(progress * 100)}%`
    if (markerRef.current) markerRef.current.value = markerAt(activeTimeline, progress)
    if (chapterRef.current) chapterRef.current.value = chapterForTime(activeTimeline.duration() * progress).shortLabel
    if (liveRef.current) liveRef.current.textContent = statusAt(activeTimeline, progress)
  }, [])

  const seek = useCallback((value: number) => {
    const activeTimeline = timelineRef.current
    if (!activeTimeline) return
    const progress = gsap.utils.clamp(0, 1, value)
    const trigger = triggerRef.current
    if (trigger && !reducedMotion) {
      window.scrollTo({ top: gsap.utils.interpolate(trigger.start, trigger.end, progress), behavior: 'auto' })
      trigger.update()
    }
    activeTimeline.progress(progress)
    syncInterface(activeTimeline, progress)
  }, [reducedMotion, syncInterface])

  const onTimelineReady = useCallback((nextTimeline: Timeline | null) => {
    timelineRef.current = nextTimeline
    setTimeline(nextTimeline)
  }, [])

  useGSAP(() => {
    if (!timeline || !rootRef.current) return
    if (reducedMotion) {
      timeline.progress(1)
      syncInterface(timeline, 1)
      window.__motionLab = {
        ready: true, labels: { ...timeline.labels }, getProgress: () => timeline.progress(),
        getDiagnostics: () => ({ duration: timeline.duration(), feed: (timeline.data as { receiptFeed?: { value: number } }).receiptFeed?.value ?? 0, time: timeline.time() }),
        setProgress: () => seek(1),
      }
      return
    }
    timeline.progress(0)
    const driver = gsap.to(timeline, { progress: 1, duration: 1, paused: true, ease: 'none', onUpdate: () => syncInterface(timeline, timeline.progress()) })
    const trigger = ScrollTrigger.create({
      id: 'motion-lab-master',
      trigger: rootRef.current,
      start: 'top top',
      end: () => `+=${Math.max(window.innerHeight, rootRef.current!.offsetHeight - window.innerHeight)}`,
      animation: driver,
      scrub: 1.2,
      invalidateOnRefresh: true,
    })
    triggerRef.current = trigger
    ScrollTrigger.refresh()
    syncInterface(timeline, trigger.progress)
    window.__motionLab = {
      ready: true, labels: { ...timeline.labels }, getProgress: () => timeline.progress(),
      getDiagnostics: () => ({ duration: timeline.duration(), feed: (timeline.data as { receiptFeed?: { value: number } }).receiptFeed?.value ?? 0, time: timeline.time() }),
      setProgress: seek,
    }
    return () => {
      trigger.kill()
      driver.kill()
      triggerRef.current = null
      delete window.__motionLab
    }
  }, { dependencies: [timeline, reducedMotion, seek, syncInterface], scope: rootRef, revertOnUpdate: true })

  const stage = <div className="motion-lab__stage-shell">
    <MotionLabStage reducedMotion={reducedMotion} onContextFailure={onContextFailure ?? (() => undefined)} onTimelineReady={onTimelineReady} statusRootRef={statusRootRef} textRootRef={textRootRef} />
    <MotionLabLoadStatus />
    <div ref={statusRootRef} className="motion-lab__chapters">
      {MOTION_LAB_CHAPTERS.map((chapter) => <article key={chapter.id} data-motion-chapter={chapter.id} className="motion-lab__chapter">
        <span className="motion-lab__chapter-number">{chapter.number}</span>
        <h1>{chapter.heading}</h1>
        <p>{chapter.description}</p>
        {chapter.fact && <small>{chapter.fact}</small>}
      </article>)}
    </div>
    <div ref={textRootRef} className="motion-lab__temporary-text" aria-hidden="true">
      <div className="motion-lab__process-terms">
        {['EXTRACT', 'OCR', 'CLEAN', 'TRANSLATE', 'LABEL', 'MERGE'].map((term) => <span key={term} data-motion-temporary={`process-${term.toLowerCase()}`}>{term}</span>)}
      </div>
      <div className="motion-lab__training-terms">
        <span data-motion-temporary="qwen" className="motion-lab__technical-term"><strong>Qwen3-8B</strong><small>generation model</small></span>
        <span data-motion-temporary="lora" className="motion-lab__technical-term"><strong>LoRA</strong><small>fine-tuning adapter</small></span>
        <span data-motion-temporary="bge" className="motion-lab__technical-term"><strong>BAAI/bge-m3</strong><small>embedding model</small></span>
        <span data-motion-temporary="rag" className="motion-lab__technical-term"><strong>RAG</strong><small>retrieval method</small></span>
      </div>
      <span data-motion-temporary="theme-owl" className="motion-lab__theme-label motion-lab__theme-label--owl">OWL — WISDOM</span>
      <span data-motion-temporary="theme-snake" className="motion-lab__theme-label motion-lab__theme-label--snake">SNAKE — GREED</span>
      <span data-motion-temporary="theme-rose" className="motion-lab__theme-label motion-lab__theme-label--rose">ROSE — LOVE</span>
      <span data-motion-temporary="theme-crown" className="motion-lab__theme-label motion-lab__theme-label--crown">CROWN — POWER</span>
      <span data-motion-temporary="theme-star" className="motion-lab__theme-label motion-lab__theme-label--star">STAR — MYSTICISM</span>
      <div data-motion-temporary="retrieval" className="motion-lab__retrieval-terms"><span>folk story</span><span>mysticism</span><span>love</span><span>source fragment</span></div>
      <div data-motion-temporary="generation" className="motion-lab__generation-terms">
        {['SOUTH ASIA', 'EAST ASIA', 'CENTRAL ASIA', 'LATIN AMERICA', 'WESTERN EUROPE', 'EASTERN EUROPE', 'MENA'].map((region) => <span key={region}>{region}</span>)}
      </div>
    </div>
    <p ref={liveRef} className="sr-only" role="status" aria-live="polite">BUILDING THE ARCHIVE</p>
    {showDeveloperControls && <div className="motion-lab__scrubber" data-testid="motion-lab-scrubber">
      <label htmlFor="motion-lab-progress">Developer scrub</label>
      <input ref={sliderRef} id="motion-lab-progress" type="range" min="0" max="1" step="0.001" defaultValue={reducedMotion ? '1' : '0'} disabled={!timeline || reducedMotion} onInput={(event) => seek(Number(event.currentTarget.value))} />
      <output ref={progressRef} htmlFor="motion-lab-progress">{reducedMotion ? '100%' : '0%'}</output>
      <output ref={chapterRef} className="motion-lab__chapter-marker">{reducedMotion ? 'FINAL' : 'ARCHIVE'}</output>
      <output ref={markerRef} className="motion-lab__marker">{reducedMotion ? 'archive-final-hold' : 'archive-enter'}</output>
    </div>}
  </div>

  if (embedded) return <section id="workflow" className="motion-lab motion-lab--embedded" ref={rootRef} aria-label="Found in Translation animated workflow">{stage}</section>
  return <main className="motion-lab" ref={rootRef}>
    {stage}
  </main>
}

export function MotionLab() {
  const [webglStatus, setWebglStatus] = useState<'checking' | 'ready' | 'failed'>('checking')

  useEffect(() => {
    setWebglStatus(supportsWebGL() ? 'ready' : 'failed')
  }, [])

  if (webglStatus === 'failed') return <MotionFallback />
  if (webglStatus === 'checking') return <main className="motion-lab-boot" aria-live="polite">Preparing the motion lab…</main>
  return <MotionLabExperience onContextFailure={() => setWebglStatus('failed')} />
}
