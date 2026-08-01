import { describe, expect, it } from 'vitest'
import { CHAPTER_DURATION, MOTION_LAB_CHAPTERS, chapterStart, visibleChapterHeadingsAt } from './chapters'

describe('motion-lab chapter pacing', () => {
  it('never allows more than one chapter heading to be visible', () => {
    const duration = MOTION_LAB_CHAPTERS.length * CHAPTER_DURATION
    for (let time = 0; time <= duration; time += 0.25) {
      expect(visibleChapterHeadingsAt(time).length).toBeLessThanOrEqual(1)
    }
  })

  it('keeps exactly one heading visible at every hold midpoint', () => {
    MOTION_LAB_CHAPTERS.forEach((chapter, index) => {
      const visible = visibleChapterHeadingsAt(chapterStart(index) + 50)
      expect(visible.map((item) => item.id)).toEqual([chapter.id])
    })
  })

  it('gives every non-final chapter enter, hold and exit labels', () => {
    MOTION_LAB_CHAPTERS.slice(0, -1).forEach((chapter) => {
      expect(chapter.enter.endsWith('-enter')).toBe(true)
      expect(chapter.hold.endsWith('-hold')).toBe(true)
      expect(chapter.exit?.endsWith('-exit')).toBe(true)
    })
  })
})
