import { useSyncExternalStore } from 'react'

export const sceneOrder = [
  'top',
  'missing-archive',
  'dataset',
  'tokens',
  'recognition',
  'retrieval',
  'generation',
  'printing',
  'provenance',
  'archive',
  'limitations',
  'credits',
] as const

export type SceneId = (typeof sceneOrder)[number]

export interface SceneProgressState {
  readonly activeScene: SceneId
  readonly globalProgress: number
  readonly localProgress: number
}

export interface SectionMeasurement {
  readonly id: SceneId
  readonly top: number
  readonly height: number
}

const initialState: SceneProgressState = {
  activeScene: 'top',
  globalProgress: 0,
  localProgress: 0,
}

let snapshot = initialState
const listeners = new Set<() => void>()

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function calculateSceneProgress(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number,
  sections: readonly SectionMeasurement[],
): SceneProgressState {
  const maximumScroll = Math.max(1, documentHeight - viewportHeight)
  const globalProgress = clamp01(scrollY / maximumScroll)
  const viewportFocus = scrollY + viewportHeight * 0.46

  let active = sections[0] ?? { id: 'top' as const, top: 0, height: viewportHeight }
  let closestDistance = Number.POSITIVE_INFINITY

  for (const section of sections) {
    const sectionCentre = section.top + section.height / 2
    const distance = Math.abs(sectionCentre - viewportFocus)
    if (distance < closestDistance) {
      active = section
      closestDistance = distance
    }
    if (viewportFocus >= section.top && viewportFocus <= section.top + section.height) {
      active = section
      break
    }
  }

  return {
    activeScene: active.id,
    globalProgress,
    localProgress: clamp01((viewportFocus - active.top) / Math.max(1, active.height)),
  }
}

function publish(next: SceneProgressState): void {
  snapshot = next
  listeners.forEach((listener) => listener())
}

export const sceneProgressStore = {
  getSnapshot: (): SceneProgressState => snapshot,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  set: publish,
}

export function useActiveScene(): SceneId {
  return useSyncExternalStore(
    sceneProgressStore.subscribe,
    () => sceneProgressStore.getSnapshot().activeScene,
    () => initialState.activeScene,
  )
}

export function sceneIndex(scene: SceneId): number {
  return sceneOrder.indexOf(scene)
}

function measureSections(): SectionMeasurement[] {
  return sceneOrder.flatMap((id) => {
    const element = document.getElementById(id)
    if (!element) return []
    const bounds = element.getBoundingClientRect()
    return [{
      id,
      top: bounds.top + window.scrollY,
      height: Math.max(1, bounds.height),
    }]
  })
}

export function installSceneProgressTracking(): () => void {
  let frame = 0
  let measurements = measureSections()

  const update = () => {
    frame = 0
    publish(
      calculateSceneProgress(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
        measurements,
      ),
    )
  }

  const schedule = () => {
    if (frame) return
    frame = window.requestAnimationFrame(update)
  }

  const remeasure = () => {
    measurements = measureSections()
    schedule()
  }

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', remeasure, { passive: true })
  window.addEventListener('load', remeasure, { once: true })
  document.fonts?.ready.then(remeasure).catch(() => undefined)
  remeasure()

  return () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', remeasure)
    window.removeEventListener('load', remeasure)
    if (frame) window.cancelAnimationFrame(frame)
  }
}
