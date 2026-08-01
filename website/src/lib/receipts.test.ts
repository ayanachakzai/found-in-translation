import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { defaultRemixReceipt, parseReceiptArchive } from './receipts'

const receiptFile = fileURLToPath(
  new URL('../../public/data/receipts.json', import.meta.url),
)

describe('receipt archive schema', () => {
  it('validates every supplied receipt and preserves the recorded coverage', async () => {
    const archive = parseReceiptArchive(
      JSON.parse(await readFile(receiptFile, 'utf8')) as unknown,
    )

    expect(archive.receipts).toHaveLength(14)
    expect(archive.receipts.filter((receipt) => receipt.mode === 'single')).toHaveLength(12)
    expect(archive.receipts.filter((receipt) => receipt.mode === 'remix')).toHaveLength(2)
    expect(archive.receipts.some((receipt) => receipt.themes.includes('Power'))).toBe(false)
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

  it('rejects a fabricated Power receipt', () => {
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
