export interface NarrativeScene {
  readonly id: string
  readonly number: string
  readonly eyebrow: string
  readonly title: string
  readonly summary: string
  readonly details: readonly string[]
}

export const preparationSteps = [
  ['Collect', 'Human-selected stories are gathered from books and public sources.'],
  ['Extract', 'Text is transcribed or lifted from source material.'],
  ['OCR', 'Scanned pages become editable text, with uncertainty retained as a limitation.'],
  ['Clean', 'Noise and inconsistent characters are removed.'],
  ['Translate', 'Stories are brought into English and checked where possible.'],
  ['Label', 'Preliminary tags are consolidated by people into five controlled themes.'],
  ['Merge', 'Regional files become one searchable archive.'],
] as const

export const tokenMappings = [
  { object: 'Purple owl', theme: 'Wisdom', colour: 'violet' },
  { object: 'Green snake', theme: 'Greed', colour: 'green' },
  { object: 'Pink rose', theme: 'Love', colour: 'pink' },
  { object: 'Yellow crown', theme: 'Power', colour: 'yellow' },
  { object: 'Blue star', theme: 'Mysticism', colour: 'blue' },
] as const

export const narrativeScenes: readonly NarrativeScene[] = [
  {
    id: 'missing-archive',
    number: '02',
    eyebrow: 'Why this begins',
    title: 'The missing archive',
    summary:
      'Folklore in low-resource languages is poorly represented in the datasets used to build contemporary language technologies.',
    details: [
      'This project gives a selected, incomplete collection a documented machine-readable form.',
      'It does not claim to represent whole cultures, languages or regions.',
    ],
  },
  {
    id: 'dataset',
    number: '03',
    eyebrow: 'Curated folklore → dataset',
    title: 'Building material the machine can search',
    summary:
      'Collection is followed by extraction, OCR, cleaning, translation, theme consolidation and regional CSV merging.',
    details: [
      'The current CSV contains 231 complete story records across seven origins and 18 source-language labels.',
      'Project documentation states 232; the implementation audit identifies one incomplete Latin America row and excludes it.',
    ],
  },
  {
    id: 'tokens',
    number: '04',
    eyebrow: 'Dataset → physical token',
    title: 'The objects are interfaces',
    summary:
      'Each 3D-printed object points the system toward a controlled theme. The object does not contain a story.',
    details: [
      'Five recognisable forms make an otherwise hidden retrieval choice physical.',
      'The blue star and pink rose form the recorded end-to-end remix shown here.',
    ],
  },
  {
    id: 'recognition',
    number: '05',
    eyebrow: 'Physical token → camera recognition',
    title: 'Two objects enter, one at a time',
    summary:
      'A frozen CLIP image encoder and a small trained classifier recognise the first token, wait for a clear frame, then lock the second.',
    details: [
      'Blue star → Mysticism → locked 1/2.',
      'Clear frame.',
      'Pink rose → Love → locked 2/2.',
      'The implemented confidence threshold is 0.50; no confidence value is attached to the recorded receipt.',
    ],
  },
  {
    id: 'retrieval',
    number: '06',
    eyebrow: 'Recognition → RAG retrieval',
    title: 'The system remembers',
    summary:
      'BAAI/bge-m3 embeddings compare each theme query with the story archive using cosine similarity.',
    details: [
      'For each theme, the runtime narrows candidates to a top pool of 12.',
      'Remix mode randomly selects two source stories per theme, then merges and de-duplicates them.',
      'Different selections mean the same object can prompt a different result on another run.',
    ],
  },
  {
    id: 'generation',
    number: '07',
    eyebrow: 'Retrieved material → new composition',
    title: 'The system imagines',
    summary:
      'RAG changes the source material in view; a LoRA adapter shapes the storytelling voice of the locally running Qwen3-8B model.',
    details: [
      'Retrieved stories remain inspiration, not output to be copied.',
      'The final installation uses a lean single-pass route.',
      'A separate exploratory implementation tested Planner → Writer → Editor.',
    ],
  },
  {
    id: 'printing',
    number: '08',
    eyebrow: 'Generation → thermal receipt',
    title: 'The story leaves the screen',
    summary:
      'Printer-safe text is sent to a TiMini BLE thermal printer, with an Arduino serial handshake available as a fallback.',
    details: [
      'The digital reconstruction will eventually feed the same recorded story line by line.',
      'For now, the complete authentic transcript is available below without animation or WebGL.',
    ],
  },
  {
    id: 'provenance',
    number: '09',
    eyebrow: 'Sources remain visible',
    title: 'What Cultural DNA means',
    summary:
      'Cultural DNA records where the retrieved source stories came from. It is an account of the material that inspired a generated story, not a measurement of the generated text itself.',
    details: [
      'It is not a score for cultural accuracy, ownership or authenticity.',
      'Percentages reflect retrieved-source counts and can include rounding.',
    ],
  },
  {
    id: 'archive',
    number: '10',
    eyebrow: 'Receipt → growing archive',
    title: 'Recorded outputs accumulate',
    summary:
      'Fourteen supplied logs extend the physical paper archive online: 12 single-object stories and two remixes.',
    details: [
      'Every receipt shown comes from the supplied archive JSON.',
      'No Crown / Power output was supplied, so none is invented here.',
    ],
  },
  {
    id: 'limitations',
    number: '11',
    eyebrow: 'Process honesty',
    title: 'What the archive cannot claim',
    summary:
      'The collection is curated and incomplete, with uneven geographic and linguistic coverage and mixed origin granularity.',
    details: [
      'OCR and translation can introduce errors; theme labels reflect the group’s interpretation.',
      'Public folklore still carries cultural and contextual sensitivities.',
      'Folklore is not factual or historical documentation.',
      'No formal ethics review was conducted.',
    ],
  },
] as const
