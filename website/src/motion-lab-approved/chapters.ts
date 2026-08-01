export const CHAPTER_DURATION = 100
export const CHAPTER_ENTER = 20
export const CHAPTER_EXIT = 80

export type MotionLabChapterId =
  | 'archive'
  | 'clean'
  | 'training'
  | 'themes'
  | 'selection'
  | 'star'
  | 'rose'
  | 'retrieval'
  | 'generation'
  | 'hardware'
  | 'printing'
  | 'final'

export interface MotionLabChapter {
  readonly id: MotionLabChapterId
  readonly number: string
  readonly heading: string
  readonly description: string
  readonly fact?: string
  readonly enter: string
  readonly hold: string
  readonly exit?: string
  readonly shortLabel: string
}

export const MOTION_LAB_CHAPTERS: readonly MotionLabChapter[] = [
  {
    id: 'archive', number: '01', heading: 'BUILDING THE ARCHIVE', shortLabel: 'ARCHIVE',
    description: 'Stories were manually collected from books, archives, scanned pages and public folklore sources.',
    enter: 'archive-enter', hold: 'archive-hold', exit: 'archive-exit',
  },
  {
    id: 'clean', number: '02', heading: 'CLEANING AND TRANSLATING', shortLabel: 'CLEAN',
    description: 'Scanned and scraped text was cleaned, translated into English and checked before the regional files were merged.',
    enter: 'clean-enter', hold: 'clean-hold', exit: 'clean-exit',
  },
  {
    id: 'training', number: '03', heading: 'TRAINING THE STORYTELLER', shortLabel: 'TRAINING',
    description: 'LoRA fine-tuning adapts Qwen3-8B to the archive’s storytelling voice. RAG uses BAAI/bge-m3 embeddings to retrieve related source stories.',
    enter: 'training-enter', hold: 'training-hold', exit: 'training-exit',
  },
  {
    id: 'themes', number: '04', heading: 'FIVE THEMES READY', shortLabel: 'THEMES',
    description: 'Five physical objects represent the archive themes: wisdom, greed, love, power and mysticism.',
    enter: 'themes-enter', hold: 'themes-hold', exit: 'themes-exit',
  },
  {
    id: 'selection', number: '05', heading: 'SELECT TWO OBJECTS', shortLabel: 'SELECTION',
    description: 'The demonstration uses the Blue Star and Pink Rose to create a Mysticism and Love remix.',
    enter: 'selection-enter', hold: 'selection-hold', exit: 'selection-exit',
  },
  {
    id: 'star', number: '06', heading: 'STAR RECOGNISED', shortLabel: 'STAR',
    description: 'The Blue Star maps to Mysticism.',
    enter: 'star-enter', hold: 'star-hold', exit: 'star-exit',
  },
  {
    id: 'rose', number: '07', heading: 'ROSE RECOGNISED', shortLabel: 'ROSE',
    description: 'The Pink Rose maps to Love. Both themes are now locked for the remix.',
    enter: 'rose-enter', hold: 'rose-hold', exit: 'rose-exit',
  },
  {
    id: 'retrieval', number: '08', heading: 'RETRIEVING STORIES', shortLabel: 'RETRIEVAL',
    description: 'BAAI/bge-m3 embeddings search the archive for source stories connected to both selected themes.',
    enter: 'retrieval-enter', hold: 'retrieval-hold', exit: 'retrieval-exit',
  },
  {
    id: 'generation', number: '09', heading: 'GENERATING STORY', shortLabel: 'GENERATION',
    description: 'Retrieved source fragments guide Qwen3-8B while the LoRA adapter supplies the archive-shaped folk-tale voice.',
    enter: 'generation-enter', hold: 'generation-hold', exit: 'generation-exit',
  },
  {
    id: 'hardware', number: '10', heading: 'HARDWARE OUTPUT', shortLabel: 'HARDWARE',
    description: 'The primary printer uses Bluetooth. An Arduino serial connection provides a fallback path for older thermal printers.',
    fact: 'ARDUINO FALLBACK READY',
    enter: 'hardware-enter', hold: 'hardware-hold', exit: 'hardware-exit',
  },
  {
    id: 'printing', number: '11', heading: 'PRINTING RECEIPT', shortLabel: 'PRINTING',
    description: 'The generated story is sanitised for the printer and fed onto a physical thermal receipt.',
    enter: 'printing-enter', hold: 'printing-hold', exit: 'printing-exit',
  },
  {
    id: 'final', number: '12', heading: 'STORY ARCHIVED', shortLabel: 'FINAL',
    description: 'Every printed story becomes part of the growing physical and digital archive.',
    enter: 'archive-final-enter', hold: 'archive-final-hold',
  },
] as const

export const MOTION_LAB_MARKERS = MOTION_LAB_CHAPTERS.flatMap((chapter) =>
  chapter.exit ? [chapter.enter, chapter.hold, chapter.exit] : [chapter.enter, chapter.hold],
)

export function chapterStart(index: number) {
  return index * CHAPTER_DURATION
}

export function chapterForTime(time: number) {
  const index = Math.min(MOTION_LAB_CHAPTERS.length - 1, Math.max(0, Math.floor(time / CHAPTER_DURATION)))
  return MOTION_LAB_CHAPTERS[index]
}

// Mirrors the text timeline: headings begin a gradual entrance near chapter
// start, remain stable throughout HOLD, and finish exiting before the next one.
export function visibleChapterHeadingsAt(time: number) {
  return MOTION_LAB_CHAPTERS.filter((chapter, index) => {
    const start = chapterStart(index)
    const visibleFrom = start + 1
    const visibleUntil = chapter.exit ? start + CHAPTER_EXIT + 6 : Number.POSITIVE_INFINITY
    return time >= visibleFrom && time < visibleUntil
  })
}
