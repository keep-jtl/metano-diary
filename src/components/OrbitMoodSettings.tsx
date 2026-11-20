import { useState } from 'react'
import { ALL_MOODS, MOODS, MOOD_GROUPS, moodById, type MoodGroup } from '../lib/moods'
import { savePreferences, usePreferences } from '../lib/prefs'
import type { MoodId } from '../types'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'
import { FullScreenPanel } from './FullScreenPanel'

const RING_RADIUS = 96

type GroupFilter = 'all' | string

export function OrbitMoodSettings({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const prefs = usePreferences()
  const [slot, setSlot] = useState(0)
  const [group, setGroup] = useState<GroupFilter>('all')

  const current = prefs.orbitMoods[slot]
  const currentMood = moodById(current)
  const visible = ALL_MOODS.filter((mood) => !prefs.hiddenMoods.includes(mood.id))
  const groupMoods: typeof ALL_MOODS | MoodGroup['moods'] =
    group === 'all'
      ? visible
      : (MOOD_GROUPS.find((item) => item.id === group)?.moods || []).filter(
          (mood) => !prefs.hiddenMoods.includes(mood.id),
        )

  function choose(mood: MoodId) {
    const next = [...prefs.orbitMoods]
    const existing = next.indexOf(mood)
    if (existing >= 0 && existing !== slot) {
      next[existing] = next[slot]
    }
    next[slot] = mood
    savePreferences({ orbitMoods: next })
    setSlot((slot + 1) % 8)
  }

  return (
    <FullScreenPanel
      open={open}
      onClose={onClose}
      kicker="首页心情轮盘"
      title="设置转盘表情"
      className="orbit-settings-screen"
      action={
        <button type="button" className="fs-check" onClick={onClose} aria-label="完成">
          <Icon name="check" size={22} strokeWidth={2.4} />
        </button>
      }
    >
      <div className="orbit-preview" aria-label="转盘表情预览">
        {prefs.orbitMoods.map((moodId, index) => {
          const angle = ((index * 45 - 90) * Math.PI) / 180
          const x = Math.round(Math.cos(angle) * RING_RADIUS)
          const y = Math.round(Math.sin(angle) * RING_RADIUS)
          const mood = moodById(moodId)
          return (
            <button
              type="button"
              key={`${moodId}-${index}`}
              className={`orbit-preview-slot ${slot === index ? 'active' : ''}`}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              onClick={() => setSlot(index)}
              aria-label={`第 ${index + 1} 个表情：${mood.label}`}
            >
              <MoodFace mood={moodId} size={48} />
              <span>{mood.label}</span>
            </button>
          )
        })}
        <div className="orbit-preview-center">
          <span>Metano</span>
          <em>心情转盘</em>
        </div>
      </div>

      <div className="orbit-current-line">
        <MoodFace mood={current} size={26} />
        <span>
          正在替换第 {slot + 1} 个位置 · <b>{currentMood.label}</b>
        </span>
        <button type="button" className="text-button" onClick={() => savePreferences({ orbitMoods: MOODS.map((m) => m.id) })}>
          恢复默认
        </button>
      </div>

      <div className="mood-group-tabs" role="tablist" aria-label="表情分类">
        <button
          type="button"
          className={group === 'all' ? 'active' : ''}
          onClick={() => setGroup('all')}
        >
          全部
        </button>
        {MOOD_GROUPS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={group === item.id ? 'active' : ''}
            onClick={() => setGroup(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="orbit-choose-grid">
        {groupMoods.map((mood) => {
          const usedAt = prefs.orbitMoods.indexOf(mood.id)
          return (
            <button
              type="button"
              key={mood.id}
              className={`orbit-choose-item ${usedAt >= 0 ? 'used' : ''} ${
                current === mood.id ? 'current' : ''
              }`}
              onClick={() => choose(mood.id)}
              title={mood.tip}
            >
              <MoodFace mood={mood.id} size={44} />
              <span>{mood.label}</span>
              {usedAt >= 0 && <em>{usedAt + 1}</em>}
            </button>
          )
        })}
      </div>
      <p className="fs-note">
        点一个位置，再从下面挑表情；如果这个表情已经在别的格子里，会自动和当前位置交换。设置会立即生效。
      </p>
    </FullScreenPanel>
  )
}
