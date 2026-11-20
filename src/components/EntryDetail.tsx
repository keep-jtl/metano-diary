import { useMemo, useRef, useState, type TouchEvent } from 'react'
import type { Entry } from '../types'
import { formatDotDate, fullCn, weekdayCn } from '../lib/dates'
import { formatDuration } from '../lib/audio'
import { MOOD_BY_ID } from '../lib/moods'
import { L1_NAMES, subNames } from '../lib/classify'
import { MoodFace } from '../components/MoodFace'
import { Icon } from '../components/Icon'

export function EntryDetail({
  entry,
  onClose,
  onEdit,
  onDelete,
  onCategoryChange,
  motion = 'none',
  pageIndex = 1,
  pageTotal = 1,
  hasPrev = false,
  hasNext = false,
  onFlip,
}: {
  entry: Entry
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onCategoryChange: (l1: string, l2?: string) => void
  motion?: 'prev' | 'next' | 'none'
  pageIndex?: number
  pageTotal?: number
  hasPrev?: boolean
  hasNext?: boolean
  onFlip?: (direction: 'prev' | 'next') => void
}) {
  const [editCategory, setEditCategory] = useState(false)
  const [l1, setL1] = useState(entry.category.l1)
  const [l2, setL2] = useState(entry.category.l2 || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const subOptions = useMemo(() => subNames(l1), [l1])
  const mood = MOOD_BY_ID[entry.mood]

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    if (!touch) return
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current
    touchStart.current = null
    if (!start || !onFlip) return
    const touch = event.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    if (dx < 0 && hasNext) onFlip('next')
    if (dx > 0 && hasPrev) onFlip('prev')
  }

  return (
    <div className="detail" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={`detail-body turn-${motion}`}>
        <div className="detail-head">
          <MoodFace mood={entry.mood} size={58} />
          <div className="detail-head-text">
            <div className="detail-date">
              {fullCn(entry.date)} <span>{weekdayCn(entry.date)}</span>
            </div>
            <div className="detail-mood">
              {mood.label} · {mood.tip}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={22} />
          </button>
        </div>

        {entry.text && <p className="detail-text">{entry.text}</p>}

        {entry.progress && (
          <div className="detail-progress">
            <div className="detail-progress-icon">
              <Icon name="progress" size={18} />
            </div>
            <div>
              <span>和昨天比，这一点进步了</span>
              <p>{entry.progress}</p>
            </div>
          </div>
        )}

        {entry.photos.length > 0 && (
          <div className="detail-photos">
            {entry.photos.map((src, index) => (
              <button
                type="button"
                key={index}
                className="detail-photo"
                onClick={() => setPhoto(src)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}

        {entry.audio && (
          <div className="detail-audio">
            <div className="detail-audio-head">
              <span>
                <Icon name="mic" size={16} /> 这一天的声音
              </span>
              <span>{formatDuration(entry.audio.duration)}</span>
            </div>
            <audio controls src={entry.audio.dataUrl} preload="metadata" />
          </div>
        )}

        <div className="detail-cat-row">
          <span className="category-pill">
            {entry.category.l1}
            {entry.category.l2 ? ` · ${entry.category.l2}` : ''}
            <em>{entry.category.auto ? '自动' : '手动'}</em>
          </span>
          <button type="button" className="text-btn" onClick={() => setEditCategory((v) => !v)}>
            {editCategory ? '收起' : '改分类'}
          </button>
        </div>

        {editCategory && (
          <div className="cat-editor">
            <div className="cat-selects">
              <select
                value={l1}
                onChange={(e) => {
                  setL1(e.target.value)
                  setL2('')
                }}
              >
                {L1_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select value={l2} onChange={(e) => setL2(e.target.value)} disabled={subOptions.length === 0}>
                <option value="">不细分</option>
                {subOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => {
                onCategoryChange(l1, l2 || undefined)
                setEditCategory(false)
              }}
            >
              保存分类
            </button>
          </div>
        )}

        {pageTotal > 1 && onFlip && (
          <div className="detail-pager">
            <button
              type="button"
              className="pager-btn"
              onClick={() => onFlip('prev')}
              disabled={!hasPrev}
              aria-label="上一篇"
            >
              <Icon name="left" size={16} /> 上一篇
            </button>
            <span className="pager-num">
              {pageIndex} / {pageTotal}
            </span>
            <button
              type="button"
              className="pager-btn"
              onClick={() => onFlip('next')}
              disabled={!hasNext}
              aria-label="下一篇"
            >
              下一篇 <Icon name="right" size={16} />
            </button>
          </div>
        )}

        <div className="detail-actions">
          <button type="button" className="btn-secondary" onClick={onEdit}>
            <Icon name="edit" size={18} /> 编辑
          </button>
          <button type="button" className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={18} /> 删除
          </button>
        </div>

        <div className="detail-watermark">
          {entry.place?.label && (
            <span>
              <Icon name="pin" size={12} />
              {entry.place.label}
            </span>
          )}
          <span>{formatDotDate(entry.date)}</span>
        </div>

        {confirmDelete && (
          <div className="confirm-box">
            <p>确定删掉这一天吗？删了就找不回来了。</p>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary small" onClick={() => setConfirmDelete(false)}>
                先留着
              </button>
              <button type="button" className="btn-danger small" onClick={onDelete}>
                确定删除
              </button>
            </div>
          </div>
        )}
      </div>

      {photo && (
        <div className="photo-viewer" onClick={() => setPhoto(null)}>
          <img src={photo} alt="" />
          <button type="button" className="icon-btn" aria-label="关闭">
            <Icon name="close" size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
