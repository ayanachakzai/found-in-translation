import { withBasePath } from './basePath'

export type AssetLoadGroup = 'hero' | 'recognition' | 'dataset' | 'output' | 'detail'
export type StagePlacement = 'constellation' | 'remix-anchors' | 'dataset' | 'recognition' | 'output' | 'detail'
export type Vector3Tuple = readonly [number, number, number]

export interface ModelPlacement {
  readonly position: Vector3Tuple
  readonly scale?: number
  readonly rotation?: Vector3Tuple
}

export interface AssetAttribution {
  readonly creator: string
  readonly title: string
  readonly source: string
  readonly licence: string
  readonly licenceUrl: string
}

export interface ModelAsset {
  readonly id: string
  readonly file: string
  readonly sourceFile: string
  readonly label: string
  readonly role: string
  readonly byteSize: number
  readonly sourceByteSize: number
  readonly loadGroup: AssetLoadGroup
  readonly targetSize: number
  readonly displayRotation: Vector3Tuple
  readonly contentNodes?: readonly string[]
  readonly placements: Partial<Record<StagePlacement, ModelPlacement>>
  readonly idle?: {
    readonly amplitude: number
    readonly speed: number
    readonly phase: number
    readonly tilt: number
  }
  readonly attribution?: AssetAttribution
}

/**
 * The single source of truth for every GLB path, measured normalization rule,
 * display orientation and Phase 2 stage placement.
 *
 * `targetSize` is applied after the selected content has been centred from its
 * measured bounding box. Known Blender helper cubes are excluded by selecting
 * only the named content mesh for the five token exports.
 */
export const modelRegistry = [
  {
    id: 'owl',
    file: 'web/owl-web.glb',
    sourceFile: 'owl.glb',
    label: 'Purple owl',
    role: 'Wisdom token',
    byteSize: 21_536,
    sourceByteSize: 66_780,
    loadGroup: 'hero',
    targetSize: 1.55,
    displayRotation: [0.02, -0.38, -0.03],
    contentNodes: ['lowpolyowl'],
    placements: {
      constellation: { position: [-1.55, 0.95, 0.1] },
    },
    idle: { amplitude: 0.06, speed: 0.62, phase: 0.2, tilt: 0.025 },
  },
  {
    id: 'snake',
    file: 'web/snake-web.glb',
    sourceFile: 'snake.glb',
    label: 'Green snake',
    role: 'Greed token',
    byteSize: 3_989_532,
    sourceByteSize: 26_900_592,
    loadGroup: 'hero',
    targetSize: 1.48,
    displayRotation: [0.02, -0.16, 0],
    contentNodes: ['single_color-25'],
    placements: {
      constellation: { position: [1.45, -0.85, -0.25] },
    },
    idle: { amplitude: 0.045, speed: 0.54, phase: 2.6, tilt: 0.018 },
  },
  {
    id: 'rose',
    file: 'web/rose-web.glb',
    sourceFile: 'rose.glb',
    label: 'Pink rose',
    role: 'Love token and second remix trigger',
    byteSize: 4_958_816,
    sourceByteSize: 35_036_964,
    loadGroup: 'hero',
    targetSize: 1.38,
    displayRotation: [-0.04, 0.38, -0.04],
    contentNodes: ['rosebud'],
    placements: {
      constellation: { position: [0.05, -0.5, 0.3] },
      'remix-anchors': { position: [1.65, -0.2, 0.25], scale: 0.9 },
      recognition: { position: [1.45, -0.28, 0.3], scale: 0.72 },
    },
    idle: { amplitude: 0.07, speed: 0.48, phase: 1.4, tilt: 0.02 },
  },
  {
    id: 'crown',
    file: 'web/crown-web.glb',
    sourceFile: 'crown.glb',
    label: 'Yellow crown',
    role: 'Power token; no recorded receipt',
    byteSize: 687_908,
    sourceByteSize: 4_387_592,
    loadGroup: 'hero',
    targetSize: 1.18,
    displayRotation: [-0.08, -0.32, 0.03],
    contentNodes: ['Crown'],
    placements: {
      constellation: { position: [1.42, 1.02, -0.35] },
    },
    idle: { amplitude: 0.055, speed: 0.58, phase: 3.8, tilt: 0.02 },
  },
  {
    id: 'star',
    file: 'web/star-web.glb',
    sourceFile: 'star.glb',
    label: 'Blue star',
    role: 'Mysticism token and first remix trigger',
    byteSize: 847_092,
    sourceByteSize: 4_193_412,
    loadGroup: 'hero',
    targetSize: 1.08,
    displayRotation: [0.08, -0.42, 0.08],
    contentNodes: ['5d9253398c9e4efc349569ffd16b8340'],
    placements: {
      constellation: { position: [-1.42, -0.82, 0.35] },
      'remix-anchors': { position: [-1.65, -0.18, 0.25], scale: 0.92 },
      recognition: { position: [-0.48, -0.34, 0.32], scale: 0.76 },
    },
    idle: { amplitude: 0.065, speed: 0.67, phase: 4.8, tilt: 0.035 },
  },
  {
    id: 'webcam',
    file: 'web/webcam-web.glb',
    sourceFile: 'webcam.glb',
    label: 'Webcam',
    role: 'Recognition device',
    byteSize: 2_209_088,
    sourceByteSize: 22_350_456,
    loadGroup: 'recognition',
    targetSize: 3.05,
    displayRotation: [0.02, Math.PI, 0],
    placements: {
      recognition: { position: [0.55, -0.25, -0.55], scale: 0.88 },
    },
  },
  {
    id: 'old-book',
    file: 'web/old_book-web.glb',
    sourceFile: 'old_book.glb',
    label: 'Old book',
    role: 'Collection and preparation stage',
    byteSize: 346_712,
    sourceByteSize: 3_012_744,
    loadGroup: 'dataset',
    targetSize: 2.85,
    displayRotation: [1.03, -0.26, -0.08],
    placements: {
      dataset: { position: [0.8, -0.05, 0] },
    },
    attribution: {
      creator: 'NameNotVisible (@jayprataps36)',
      title: 'Leather Book',
      source: 'https://sketchfab.com/3d-models/leather-book-a86010ad79aa44d3ac7df5897060ccb6',
      licence: 'CC BY-NC 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-nc/4.0/',
    },
  },
  {
    id: 'receipt-printer',
    file: 'web/receipt-printer-web.glb',
    sourceFile: 'receipt-printer.glb',
    label: 'Thermal printer',
    role: 'Physical story output',
    byteSize: 1_507_728,
    sourceByteSize: 11_363_772,
    loadGroup: 'output',
    targetSize: 3.15,
    displayRotation: [0.02, Math.PI, 0],
    placements: {
      output: { position: [0.72, -0.45, -0.2], scale: 0.92 },
    },
  },
  {
    id: 'paper-roll',
    file: 'web/paper-roll-web.glb',
    sourceFile: 'paper-roll.glb',
    label: 'Paper roll',
    role: 'Printer paper source',
    byteSize: 6_396,
    sourceByteSize: 20_772,
    loadGroup: 'output',
    targetSize: 1.05,
    displayRotation: [0.15, 0.2, Math.PI / 2],
    placements: {
      output: { position: [-0.88, 1.0, 0.15] },
    },
    attribution: {
      creator: 'Maggatron (@MaggaModels)',
      title: 'Toilet Paper Roll',
      source: 'https://sketchfab.com/3d-models/toilet-paper-roll-b815f69f42a34343ae61de83953cb0b9',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
  {
    id: 'arduino',
    file: 'web/arduino-web.glb',
    sourceFile: 'arduino.glb',
    label: 'Arduino',
    role: 'Serial printer fallback route',
    byteSize: 227_212,
    sourceByteSize: 4_491_236,
    loadGroup: 'detail',
    targetSize: 2.2,
    displayRotation: [0.42, -0.28, -0.12],
    placements: {
      detail: { position: [1.5, -0.08, 0] },
    },
    attribution: {
      creator: 'kakaeka',
      title: 'Arduino Uno',
      source: 'https://sketchfab.com/3d-models/arduino-uno-775a2bf901a74fd190f175f5f0dcf2d0',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
] as const satisfies readonly ModelAsset[]

// Kept as a compatibility alias for the Phase 0 validator and existing imports.
export const modelAssets: readonly ModelAsset[] = modelRegistry
export const attributedModelAssets = modelAssets.filter(
  (asset): asset is ModelAsset & { readonly attribution: AssetAttribution } =>
    Boolean(asset.attribution),
)

export type ModelAssetId = (typeof modelRegistry)[number]['id']

export function modelUrl(asset: ModelAsset): string {
  return withBasePath(`models/${asset.file}`)
}

export function findModelAsset(id: ModelAssetId): ModelAsset {
  const asset = modelRegistry.find((candidate) => candidate.id === id)
  if (!asset) {
    throw new Error(`Unknown model asset: ${id}`)
  }
  return asset
}
