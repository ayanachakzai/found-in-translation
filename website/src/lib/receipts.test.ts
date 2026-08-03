import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { defaultRemixReceipt, GENERATED_RECEIPT_IDS, parseReceiptArchive } from './receipts'

const receiptFile = fileURLToPath(
  new URL('../../public/data/receipts.json', import.meta.url),
)

describe('receipt archive schema', () => {
  it('validates every supplied receipt and preserves the recorded coverage', async () => {
    const archive = parseReceiptArchive(
      JSON.parse(await readFile(receiptFile, 'utf8')) as unknown,
    )

    expect(archive.receipts).toHaveLength(19)
    expect(archive.receipts.filter((receipt) => receipt.mode === 'single')).toHaveLength(15)
    expect(archive.receipts.filter((receipt) => receipt.mode === 'remix')).toHaveLength(4)
    expect(archive.receipts.some((receipt) => receipt.sourceFile === 'story_20260730_152301.txt' && receipt.themes.includes('Power'))).toBe(true)
  })

  it('finds the authentic default remix receipt', async () => {
    const archive = parseReceiptArchive(
      JSON.parse(await readFile(receiptFile, 'utf8')) as unknown,
    )
    const receipt = defaultRemixReceipt(archive)

    expect(receipt?.objects).toEqual(['blue star', 'pink rose'])
    expect(receipt?.themes).toEqual(['Mysticism', 'Love'])
    expect(receipt?.culturalDna).toEqual({ 'Latin America': 50, India: 50 })
  })

  it('preserves the exact five supplied July story records', async () => {
    const archive = parseReceiptArchive(
      JSON.parse(await readFile(receiptFile, 'utf8')) as unknown,
    )
    const expected = [
      ['pink rose + blue star', 'Love + Mysticism', '2026-07-30 15:24', 'Europe 50% - South Asia 25% - Latin America 25%', 'ede226588911a83801d000f675ad0e1813c607b21935fc573430fc15432c7710'],
      ['blue star', 'Mysticism', '2026-07-30 15:28', 'Europe 100%', '5d42945be69e6e7279a916a6105e8ee183cd93b598c74645944ea4a297fa2d05'],
      ['purple owl', 'Wisdom', '2026-07-30 15:29', 'Europe 67% - South Asia 33%', '7d141ee7ed5ede9336ebdf65ffc98410ce87ab91a8e8e05e4c676e77567a269f'],
      ['yellow crown', 'Power', '2026-07-30 15:23', 'Europe 67% - Sub-Saharan Africa 33%', '7b77a83fd3f01103af2f0cce8a76f58d7f2e5e009dca4db961eca435af8681c0'],
      ['green snake + blue star', 'Greed + Mysticism', '2026-07-30 15:26', 'Europe 50% - Central & East Asia 25% - Middle East & North Africa 25%', '8b0a23257c4cf69931fc0828fbaf73b3b3e0489dfab067206e47b64882b6323a'],
    ] as const

    GENERATED_RECEIPT_IDS.forEach((id, index) => {
      const receipt = archive.receipts.find((candidate) => candidate.id === id)
      expect(receipt).toBeDefined()
      expect([
        receipt?.objectLabel,
        receipt?.themeLabel,
        receipt?.dateLabel,
        receipt?.culturalDnaLabel,
        createHash('sha256').update(receipt?.story ?? '').digest('hex'),
      ]).toEqual(expected[index])
    })
  })

  it('rejects an incomplete receipt record', () => {
    expect(() =>
      parseReceiptArchive({
        project: 'Found in Translation',
        receiptCount: 1,
        receipts: [
          {
            id: 'invented',
            sourceFile: 'invented.txt',
            timestamp: '2026-01-01T12:00:00',
            mode: 'single',
            objectLabel: 'yellow crown',
            objects: ['yellow crown'],
            themeLabel: 'Power',
            themes: ['Power'],
            culturalDna: { Unknown: 100 },
            story: '',
            wordCount: 0,
          },
        ],
      }),
    ).toThrow()
  })
})
