import { describe, expect, it } from 'vitest'
import {
  attributedModelAssets,
  findModelAsset,
  modelAssets,
  modelRegistry,
  modelUrl,
} from './assets'

describe('model asset manifest', () => {
  it('contains the ten supplied models once each', () => {
    expect(modelAssets).toHaveLength(10)
    expect(new Set(modelAssets.map((asset) => asset.id)).size).toBe(10)
    expect(new Set(modelAssets.map((asset) => asset.file)).size).toBe(10)
  })

  it('builds base-aware public URLs', () => {
    expect(modelUrl(findModelAsset('star'))).toBe('/models/web/star-web.glb')
    expect(modelAssets.every((asset) => !asset.file.startsWith('/'))).toBe(true)
  })

  it('defines measured normalization and at least one placement for every model', () => {
    expect(
      modelRegistry.every(
        (asset) =>
          asset.byteSize > 0 &&
          asset.targetSize > 0 &&
          asset.displayRotation.length === 3 &&
          Object.keys(asset.placements).length > 0,
      ),
    ).toBe(true)
    expect(modelRegistry.reduce((total, asset) => total + asset.byteSize, 0)).toBe(
      14_802_020,
    )
  })

  it('contains the verified old-book attribution', () => {
    const book = findModelAsset('old-book')
    expect(book.attribution).toMatchObject({
      creator: 'NameNotVisible (@jayprataps36)',
      title: 'Leather Book',
      licence: 'CC BY-NC 4.0',
    })
    expect(attributedModelAssets.map((asset) => asset.id)).toEqual([
      'old-book',
      'paper-roll',
      'arduino',
    ])
  })
})
