import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { DailyQuote as DailyQuoteData } from '../lib/dailyQuotes'
import { formatCn, weekdayCn } from '../lib/dates'
import { Icon } from './Icon'

export function DailyQuoteCard({
  quote,
  date,
  onClose,
}: {
  quote: DailyQuoteData
  date: string
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="daily-quote-layer" role="dialog" aria-modal="true" aria-label="今天的第一句话">
      <article className="daily-quote-card">
        <button type="button" className="daily-quote-close" onClick={onClose} aria-label="收起今天的话">
          <Icon name="close" size={18} strokeWidth={2.2} />
        </button>
        <div className="daily-quote-art">
          <img src={`/daily/${quote.file}`} alt="今天的鼓励插画" />
        </div>
        <div className="daily-quote-copy">
          <div className="daily-quote-meta">
            <span className="daily-quote-kicker">今天的第一句话</span>
            <span className="daily-quote-date">
              {formatCn(date)} {weekdayCn(date)}
            </span>
          </div>
          <p>{quote.text}</p>
          <button type="button" className="daily-quote-action" onClick={onClose}>
            收下这句话
            <Icon name="check" size={16} strokeWidth={2.4} />
          </button>
        </div>
      </article>
    </div>,
    document.body,
  )
}
