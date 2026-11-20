import { useState } from 'react'
import { ALL_MOODS, MOOD_GROUPS } from '../lib/moods'
import { savePreferences, usePreferences } from '../lib/prefs'
import type { MoodId } from '../types'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'
import { FullScreenPanel } from './FullScreenPanel'

export function MoodManage({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const prefs = usePreferences()
  const [group, setGroup] = useState(0)
  const activeGroup = MOOD_GROUPS[group]
  const hiddenCount = prefs.hiddenMoods.length
  const visibleCount = ALL_MOODS.length - hiddenCount

  function toggle(mood: MoodId) {
    const isHidden = prefs.hiddenMoods.includes(mood)
    if (!isHidden && visibleCount <= 8) return
    const hiddenMoods = isHidden
      ? prefs.hiddenMoods.filter((id) => id !== mood)
      : [...prefs.hiddenMoods, mood]
    savePreferences({ hiddenMoods })
  }

  return (
    <FullScreenPanel
      open={open}
      onClose={onClose}
      kicker="只影响“更多”表情库"
      title="整理表情仓库"
      className="mood-manage-screen"
      action={
        <button type="button" className="fs-check" onClick={onClose} aria-label="完成">
          <Icon name="check" size={22} strokeWidth={2.4} />
        </button>
      }
    >
      <div className="manage-summary">
        <span>已隐藏 {hiddenCount} 个</span>
        <span>还剩 {visibleCount} 个可用</span>
        {hiddenCount > 0 && (
          <button type="button" className="text-button" onClick={() => savePreferences({ hiddenMoods: [] })}>
            全部恢复
          </button>
        )}
      </div>

      <div className="mood-group-tabs" role="tablist" aria-label="表情仓库分类">
        {MOOD_GROUPS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={group === index ? 'active' : ''}
            onClick={() => setGroup(index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="manage-group-hint">{activeGroup.hint}</p>

      <div className="manage-grid">
        {activeGroup.moods.map((mood) => {
          const hidden = prefs.hiddenMoods.includes(mood.id)
          return (
            <button
              type="button"
              key={`${activeGroup.id}-${mood.id}`}
              className={`manage-item ${hidden ? 'hidden' : ''}`}
              onClick={() => toggle(mood.id)}
              aria-label={hidden ? `恢复${mood.label}` : `隐藏${mood.label}`}
              title={hidden ? '点一下加回来' : '点一下隐藏'}
            >
              <span className="manage-face">
                <MoodFace mood={mood.id} size={56} />
                <span className={`mood-hide-badge ${hidden ? 'plus' : ''}`}>
                  {hidden ? '+' : '−'}
                </span>
              </span>
              <span className="manage-label">{mood.label}</span>
            </button>
          )
        })}
      </div>

      <p className="fs-note">
        隐藏只影响“更多”表情库，已经写下的日记和首页转盘不会被改动；想找回时，再点一下红色“+”就能恢复。至少保留 8 个表情。
      </p>
    </FullScreenPanel>
  )
}
