import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useMemo, useState, type RefObject } from 'react'
import {
  GENERATED_RECEIPT_IDS,
  loadReceiptArchive,
  type ReceiptArchive,
  type ReceiptRecord,
} from '../lib/receipts'

interface GeneratedReceiptsProps {
  readonly sectionRef: RefObject<HTMLElement | null>
}

function exactCulturalDna(receipt: ReceiptRecord) {
  return receipt.culturalDnaLabel ?? Object.entries(receipt.culturalDna)
    .map(([origin, amount]) => `${origin} ${amount}%`)
    .join(' - ')
}

function exactDate(receipt: ReceiptRecord) {
  return receipt.dateLabel ?? receipt.timestamp.replace('T', ' ').slice(0, 16)
}

function ReceiptExample({ receipt, featured }: { readonly receipt: ReceiptRecord; readonly featured: boolean }) {
  const headingId = `generated-receipt-${receipt.id}`
  const storyId = `generated-receipt-story-${receipt.id}`

  return (
    <article
      className={`generated-receipt${featured ? ' generated-receipt--featured' : ''}`}
      data-receipt-id={receipt.id}
      aria-labelledby={headingId}
    >
      <header className="generated-receipt__header">
        {featured && <p className="generated-receipt__feature-label">Featured remix</p>}
        <p className="generated-receipt__machine">FOUND IN TRANSLATION</p>
        <h3 id={headingId}>{receipt.objectLabel}</h3>
      </header>

      <dl className="generated-receipt__metadata">
        <div><dt>theme</dt><dd>{receipt.themeLabel}</dd></div>
        <div><dt>date</dt><dd>{exactDate(receipt)}</dd></div>
        <div><dt>Cultural DNA</dt><dd>{exactCulturalDna(receipt)}</dd></div>
        <div><dt>length</dt><dd>{receipt.wordCount} words</dd></div>
      </dl>

      <p className="generated-receipt__preview" aria-label="Story preview">{receipt.story}</p>

      <details className="generated-receipt__details" onToggle={() => requestAnimationFrame(() => ScrollTrigger.refresh())}>
        <summary>
          <span className="generated-receipt__read">Read full story</span>
          <span className="generated-receipt__close">Close full story</span>
        </summary>
        <div id={storyId} className="generated-receipt__story">{receipt.story}</div>
      </details>

      <footer>ARCHIVE ID {receipt.id}</footer>
    </article>
  )
}

export function GeneratedReceipts({ sectionRef }: GeneratedReceiptsProps) {
  const [archive, setArchive] = useState<ReceiptArchive | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    loadReceiptArchive(controller.signal)
      .then(setArchive)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(true)
      })
    return () => controller.abort()
  }, [])

  const receipts = useMemo(() => {
    if (!archive) return []
    const byId = new Map(archive.receipts.map((receipt) => [receipt.id, receipt]))
    return GENERATED_RECEIPT_IDS.map((id) => byId.get(id)).filter((receipt): receipt is ReceiptRecord => Boolean(receipt))
  }, [archive])

  useEffect(() => {
    if (receipts.length === GENERATED_RECEIPT_IDS.length) requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [receipts.length])

  return (
    <section ref={sectionRef} className="generated-receipts" aria-labelledby="generated-receipts-title">
      <div className="generated-receipts__inner">
        <header className="generated-receipts__intro">
          <p>Physical outputs / 30 July 2026</p>
          <h2 id="generated-receipts-title">GENERATED RECEIPTS</h2>
          <p className="generated-receipts__note">Cultural DNA records the origins of the retrieved source stories. It describes provenance of inspiration, not an analysis of the generated text.</p>
        </header>

        {error && <p className="generated-receipts__status" role="status">The authentic receipt records could not be loaded.</p>}
        {!error && receipts.length < GENERATED_RECEIPT_IDS.length && <p className="generated-receipts__status" role="status">Loading five recorded stories…</p>}

        {receipts.length === GENERATED_RECEIPT_IDS.length && (
          <div className="generated-receipts__wall">
            {receipts.map((receipt, index) => <ReceiptExample key={receipt.id} receipt={receipt} featured={index === 0} />)}
          </div>
        )}
      </div>
    </section>
  )
}
