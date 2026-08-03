import { withBasePath } from './basePath'

export const objectThemeMap = {
  'purple owl': 'Wisdom',
  'green snake': 'Greed',
  'pink rose': 'Love',
  'yellow crown': 'Power',
  'blue star': 'Mysticism',
} as const

export type TriggerObject = keyof typeof objectThemeMap
export type Theme = (typeof objectThemeMap)[TriggerObject]
export type ReceiptMode = 'single' | 'remix'

export interface ReceiptRecord {
  readonly id: string
  readonly sourceFile: string
  readonly timestamp: string
  readonly mode: ReceiptMode
  readonly objectLabel: string
  readonly objects: readonly TriggerObject[]
  readonly themeLabel: string
  readonly themes: readonly Theme[]
  readonly culturalDna: Readonly<Record<string, number>>
  readonly culturalDnaLabel?: string
  readonly dateLabel?: string
  readonly story: string
  readonly wordCount: number
}

export const GENERATED_RECEIPT_IDS = [
  '20260730_152434',
  '20260730_152832',
  '20260730_152934',
  '20260730_152301',
  '20260730_152624',
] as const

export interface ReceiptArchive {
  readonly project: 'Found in Translation'
  readonly receiptCount: number
  readonly receipts: readonly ReceiptRecord[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invalid receipt archive: ${message}`)
  }
}

function isTriggerObject(value: unknown): value is TriggerObject {
  return typeof value === 'string' && value in objectThemeMap
}

function parseReceipt(value: unknown, index: number): ReceiptRecord {
  assert(isObject(value), `receipt ${index} is not an object`)
  const record = value

  assert(typeof record.id === 'string' && record.id.length > 0, `receipt ${index} has no id`)
  assert(typeof record.sourceFile === 'string' && record.sourceFile.length > 0, `${record.id} has no sourceFile`)
  assert(typeof record.timestamp === 'string' && !Number.isNaN(Date.parse(record.timestamp)), `${record.id} has an invalid timestamp`)
  assert(record.mode === 'single' || record.mode === 'remix', `${record.id} has an invalid mode`)
  assert(Array.isArray(record.objects) && record.objects.every(isTriggerObject), `${record.id} has invalid objects`)
  assert(Array.isArray(record.themes) && record.themes.every((theme) => typeof theme === 'string'), `${record.id} has invalid themes`)

  const objects = record.objects as TriggerObject[]
  const themes = record.themes as string[]
  const expectedLength = record.mode === 'single' ? 1 : 2
  assert(objects.length === expectedLength, `${record.id} object count does not match its mode`)
  assert(themes.length === expectedLength, `${record.id} theme count does not match its mode`)
  assert(
    objects.every((object, objectIndex) => objectThemeMap[object] === themes[objectIndex]),
    `${record.id} object and theme order do not match`,
  )

  assert(typeof record.objectLabel === 'string' && record.objectLabel === objects.join(' + '), `${record.id} has an invalid objectLabel`)
  assert(typeof record.themeLabel === 'string' && record.themeLabel === themes.join(' + '), `${record.id} has an invalid themeLabel`)
  assert(isObject(record.culturalDna) && Object.keys(record.culturalDna).length > 0, `${record.id} has no Cultural DNA`)
  if (record.culturalDnaLabel !== undefined) {
    assert(typeof record.culturalDnaLabel === 'string' && record.culturalDnaLabel.length > 0, `${record.id} has an invalid Cultural DNA label`)
  }
  if (record.dateLabel !== undefined) {
    assert(typeof record.dateLabel === 'string' && record.dateLabel.length > 0, `${record.id} has an invalid date label`)
  }

  const dnaValues = Object.values(record.culturalDna)
  assert(dnaValues.every((amount) => typeof amount === 'number' && amount >= 0), `${record.id} has invalid Cultural DNA values`)
  const dnaTotal = (dnaValues as number[]).reduce((total, amount) => total + amount, 0)
  assert(dnaTotal >= 99 && dnaTotal <= 100, `${record.id} Cultural DNA does not total 99–100`)

  assert(typeof record.story === 'string' && record.story.trim().length > 0, `${record.id} has no story`)
  assert(Number.isInteger(record.wordCount) && (record.wordCount as number) > 0, `${record.id} has an invalid wordCount`)

  return record as unknown as ReceiptRecord
}

export function parseReceiptArchive(value: unknown): ReceiptArchive {
  assert(isObject(value), 'root is not an object')
  assert(value.project === 'Found in Translation', 'project name does not match')
  assert(Number.isInteger(value.receiptCount), 'receiptCount is not an integer')
  assert(Array.isArray(value.receipts), 'receipts is not an array')

  const receipts = value.receipts.map(parseReceipt)
  assert(receipts.length === value.receiptCount, 'receiptCount does not match the array length')
  assert(new Set(receipts.map((receipt) => receipt.id)).size === receipts.length, 'receipt ids are not unique')
  assert(new Set(receipts.map((receipt) => receipt.sourceFile)).size === receipts.length, 'receipt source files are not unique')

  return {
    project: 'Found in Translation',
    receiptCount: value.receiptCount as number,
    receipts,
  }
}

export async function loadReceiptArchive(signal?: AbortSignal): Promise<ReceiptArchive> {
  const response = await fetch(withBasePath('data/receipts.json'), { signal })
  if (!response.ok) {
    throw new Error(`Receipt archive request failed with ${response.status}`)
  }
  return parseReceiptArchive(await response.json())
}

export function defaultRemixReceipt(archive: ReceiptArchive): ReceiptRecord | undefined {
  return archive.receipts.find((receipt) => receipt.id === '20260610_134437')
}
