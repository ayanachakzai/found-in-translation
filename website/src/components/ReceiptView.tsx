import type { ReceiptRecord } from '../lib/receipts'

interface ReceiptViewProps {
  readonly receipt: ReceiptRecord
  readonly compact?: boolean
}

function displayTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(new Date(timestamp))
}

export function ReceiptView({ receipt, compact = false }: ReceiptViewProps) {
  const idPrefix = compact ? 'archive-receipt' : 'receipt'
  const headingId = `${idPrefix}-${receipt.id}`
  const dnaId = `${idPrefix}-dna-${receipt.id}`
  const storyId = `${idPrefix}-story-${receipt.id}`

  return (
    <article className={compact ? 'receipt receipt--compact' : 'receipt'} aria-labelledby={headingId}>
      <header>
        <p>Found in Translation</p>
        <h3 id={headingId}>{receipt.objectLabel}</h3>
        <dl>
          <div>
            <dt>Theme</dt>
            <dd>{receipt.themeLabel}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{receipt.mode}</dd>
          </div>
          <div>
            <dt>Recorded</dt>
            <dd>{displayTimestamp(receipt.timestamp)}</dd>
          </div>
        </dl>
      </header>
      <section aria-labelledby={dnaId}>
        <h4 id={dnaId}>Cultural DNA</h4>
        <p>
          {Object.entries(receipt.culturalDna)
            .map(([origin, amount]) => `${origin} ${amount}%`)
            .join(' · ')}
        </p>
      </section>
      {compact ? (
        <details>
          <summary>Read recorded story</summary>
          <p className="receipt-story">{receipt.story}</p>
        </details>
      ) : (
        <section aria-labelledby={storyId}>
          <h4 id={storyId}>Recorded story</h4>
          <p className="receipt-story">{receipt.story}</p>
        </section>
      )}
      <footer>
        Archive ID {receipt.id} · {receipt.wordCount} words
      </footer>
    </article>
  )
}
