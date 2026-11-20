import type { Entry } from '../types'
import { dateKey, daysAgoLabel, formatCn, formatDotDate, weekdayCn } from '../lib/dates'
import { formatDuration } from '../lib/audio'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'
import { Highlight } from './Highlight'

export function EntryCard({
  entry,
  onClick,
  terms = [],
  showAll = false,
  compact = false,
  celebrate = false,
}: {
  entry: Entry
  onClick?: () => void
  terms?: string[]
  showAll?: boolean
  compact?: boolean
  celebrate?: boolean
}) {
  return (
    <button
      type="button"
      className={`entry-card ${compact ? 'entry-card-compact' : ''} ${celebrate ? 'just-saved' : ''}`}
      onClick={onClick}
    >
      <div className="entry-top">
        <MoodFace mood={entry.mood} size={compact ? 34 : 42} />
        <div className="entry-heading">
          <div className="entry-date">
            {formatCn(entry.date)} <span>{weekdayCn(entry.date)}</span>
            {entry.date !== dateKey() && <em>{daysAgoLabel(entry.date)}</em>}
          </div>
          <div className="entry-category">
            {entry.category.l1}
            {entry.category.l2 ? ` · ${entry.category.l2}` : ''}
          </div>
        </div>
        <span className="entry-arrow">
          <Icon name="right" size={18} />
        </span>
      </div>

      {entry.text && (
        <p className={`entry-text ${showAll ? '' : 'clamp-3'}`}>
          <Highlight text={entry.text} terms={terms} />
        </p>
      )}

      {entry.progress && (
        <div className="entry-progress">
          <Icon name="progress" size={16} />
          <span className={showAll ? '' : 'clamp-2'}>
            <Highlight text={entry.progress} terms={terms} />
          </span>
        </div>
      )}

      {entry.photos.length > 0 && (
        <div className={`entry-photos ${compact ? 'entry-photos-compact' : ''}`}>
          {entry.photos.slice(0, 3).map((src, index) => (
            <img key={index} src={src} alt="" loading="lazy" />
          ))}
          {entry.photos.length > 3 && <span className="photo-more">+{entry.photos.length - 3}</span>}
        </div>
      )}

      {entry.audio && (
        <div className="entry-audio-chip">
          <Icon name="mic" size={13} />
          语音 {formatDuration(entry.audio.duration)}
        </div>
      )}

      <div className="entry-watermark">
        {entry.place?.label && (
          <span className="entry-watermark-place">
            <Icon name="pin" size={11} />
            {entry.place.label}
          </span>
        )}
        <span>{formatDotDate(entry.date)}</span>
      </div>
    </button>
  )
}
