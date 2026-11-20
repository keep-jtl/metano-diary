import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MOOD_GROUPS } from '../lib/moods'
import { usePreferences } from '../lib/prefs'
import type { MoodId } from '../types'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'

export function MoodLibrary({
  open,
  onClose,
  onPick,
  current,
  replaceNote,
  footNote,
}: {
  open: boolean
  onClose: () => void
  onPick: (mood: MoodId) => void
  current?: MoodId | null
  replaceNote?: string
  footNote?: string
}) {
  const [tab, setTab] = useState(0)
  const prefs = usePreferences()

  useEffect(() => {
    if (open) setTab(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const group = MOOD_GROUPS[tab]
  const groupMoods = group.moods.filter((mood) => !prefs.hiddenMoods.includes(mood.id))

  return createPortal(
    <div className="mood-library" role="dialog" aria-modal="true" aria-label="更多表情">
      <header className="mood-library-head">
        <button type="button" className="mood-library-close" onClick={onClose} aria-label="关闭表情仓库">
          <Icon name="close" size={24} strokeWidth={2.2} />
        </button>
        <div>
          <p className="mood-library-kicker">Metano 表情仓库</p>
          <h2>今天是什么心情？</h2>
        </div>
      </header>

      {replaceNote && <p className="mood-library-replace">{replaceNote}</p>}

      <div className="mood-library-tabs" role="tablist" aria-label="表情分类">
        {MOOD_GROUPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === index}
            className={`mood-library-tab ${tab === index ? 'active' : ''}`}
            onClick={() => setTab(index)}
          >
            <MoodFace mood={item.moods[index === 3 ? 7 : index === 2 ? 4 : index === 1 ? 2 : 3].id} size={28} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <p className="mood-library-hint">{group.hint}</p>

      <div className="mood-library-grid">
        {groupMoods.map((mood) => (
          <button
            key={`${group.id}-${mood.id}`}
            type="button"
            className={`mood-library-item ${current === mood.id ? 'selected' : ''}`}
            onClick={() => onPick(mood.id)}
            title={mood.tip}
          >
            <MoodFace mood={mood.id} size={54} />
            <span>{mood.label}</span>
          </button>
        ))}
        {groupMoods.length === 0 && (
          <div className="mood-library-empty">
            <MoodFace mood="neutral" size={54} />
            <p>这一组都被你收进仓库深处了，去「我的 · 偏好设置 · 整理表情仓库」可以找回来。</p>
          </div>
        )}
      </div>

      <p className="mood-library-foot">
        {footNote || '选一个表情，就会带着它去写今天的日记。'}
      </p>
    </div>,
    document.body,
  )
}
