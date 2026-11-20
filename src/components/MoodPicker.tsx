import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { MOOD_BY_ID } from '../lib/moods'
import { savePreferences, usePreferences } from '../lib/prefs'
import type { MoodId } from '../types'
import { MoodFace } from './MoodFace'
import { MoodLibrary } from './MoodLibrary'
import { Icon } from './Icon'

const LONG_PRESS_MS = 520

export function MoodPicker({
  value,
  onChange,
  onMore,
  onClear,
  compact = false,
}: {
  value: MoodId | null
  onChange: (mood: MoodId) => void
  onMore?: () => void
  onClear?: () => void
  compact?: boolean
}) {
  const prefs = usePreferences()
  const composerMoods = prefs.composerMoods?.length ? prefs.composerMoods : prefs.orbitMoods
  const extraMood = value && !composerMoods.includes(value) ? MOOD_BY_ID[value] : null
  const [managing, setManaging] = useState<MoodId | null>(null)
  const [choosingSlot, setChoosingSlot] = useState(false)
  const [replacingSlot, setReplacingSlot] = useState<number | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const pressTimerRef = useRef<number | null>(null)
  const pressedRef = useRef<{ mood: MoodId; x: number; y: number } | null>(null)
  const longPressReadyRef = useRef(false)
  const suppressClickRef = useRef(false)
  const suppressResetRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current)
      if (suppressResetRef.current) window.clearTimeout(suppressResetRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!managing && !managerOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setManaging(null)
        setChoosingSlot(false)
        setManagerOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [managing, managerOpen])

  function clearPressTimer() {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  function beginPress(event: ReactPointerEvent<HTMLButtonElement>, mood: MoodId) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    clearPressTimer()
    pressedRef.current = { mood, x: event.clientX, y: event.clientY }
    longPressReadyRef.current = false
    pressTimerRef.current = window.setTimeout(() => {
      longPressReadyRef.current = true
      pressTimerRef.current = null
    }, LONG_PRESS_MS)
  }

  function movePress(event: ReactPointerEvent<HTMLButtonElement>) {
    const pressed = pressedRef.current
    if (!pressed) return
    if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 9) {
      clearPressTimer()
      pressedRef.current = null
      longPressReadyRef.current = false
    }
  }

  function endPress() {
    const pressed = pressedRef.current
    clearPressTimer()
    pressedRef.current = null
    if (longPressReadyRef.current && pressed) {
      longPressReadyRef.current = false
      suppressClickRef.current = true
      if (suppressResetRef.current) window.clearTimeout(suppressResetRef.current)
      suppressResetRef.current = window.setTimeout(() => {
        suppressClickRef.current = false
      }, 400)
      setManaging(pressed.mood)
      setChoosingSlot(false)
    }
    longPressReadyRef.current = false
  }

  function cancelPress() {
    clearPressTimer()
    pressedRef.current = null
    longPressReadyRef.current = false
  }

  function handlePick(mood: MoodId) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onChange(mood)
  }

  function closeManager() {
    setManaging(null)
    setChoosingSlot(false)
  }

  function clearExtra() {
    if (!managing) return
    onClear?.()
    closeManager()
  }

  function addToComposer() {
    if (!managing) return
    const next = composerMoods.includes(managing) ? [...composerMoods] : [...composerMoods, managing]
    savePreferences({ composerMoods: next })
    closeManager()
  }

  function placeMood(targetIndex: number) {
    if (!managing) return
    const sourceIndex = composerMoods.indexOf(managing)
    if (sourceIndex === targetIndex) {
      closeManager()
      return
    }
    const next = [...composerMoods]
    if (sourceIndex >= 0) {
      const displaced = next[targetIndex]
      next[targetIndex] = managing
      next[sourceIndex] = displaced
    } else {
      next[targetIndex] = managing
    }
    savePreferences({ composerMoods: next })
    closeManager()
  }

  function removeComposerExtra() {
    if (!managing) return
    const next = composerMoods.filter((mood) => mood !== managing)
    if (next.length < 8) return
    savePreferences({ composerMoods: next })
    if (value === managing) onClear?.()
    closeManager()
  }

  function openReplacement() {
    if (!managing) return
    const targetIndex = composerMoods.indexOf(managing)
    if (targetIndex < 0) return
    setReplacingSlot(targetIndex)
    setLibraryOpen(true)
    setChoosingSlot(false)
    setManaging(null)
  }

  function closeReplacement() {
    setLibraryOpen(false)
    setReplacingSlot(null)
  }

  function replaceAtSlot(nextMood: MoodId) {
    if (replacingSlot === null) return
    const targetIndex = replacingSlot
    const sourceIndex = composerMoods.indexOf(nextMood)
    if (sourceIndex === targetIndex) {
      closeReplacement()
      return
    }
    const next = [...composerMoods]
    const displaced = next[targetIndex]
    if (sourceIndex >= 0) {
      next[targetIndex] = nextMood
      next[sourceIndex] = displaced
    } else {
      next[targetIndex] = nextMood
    }
    savePreferences({ composerMoods: next })
    if (value === displaced) onChange(nextMood)
    closeReplacement()
  }

  function removeFromManager(moodId: MoodId) {
    const next = composerMoods.filter((mood) => mood !== moodId)
    if (next.length < 8) return
    savePreferences({ composerMoods: next })
    if (value === moodId) onClear?.()
  }

  function replaceFromManager(index: number) {
    setManagerOpen(false)
    setReplacingSlot(index)
    setLibraryOpen(true)
  }

  function resetComposerMoods() {
    savePreferences({ composerMoods: undefined })
    setManagerOpen(false)
  }

  function addFromManager() {
    setManagerOpen(false)
    onMore?.()
  }

  const managingMood = managing ? MOOD_BY_ID[managing] : null
  const managingUsedAt = managing ? composerMoods.indexOf(managing) : -1
  const isUnlisted = Boolean(managing && managingUsedAt < 0)
  const isComposerExtra = managingUsedAt >= 8
  const replacingMood = replacingSlot !== null ? MOOD_BY_ID[composerMoods[replacingSlot]] : null

  return (
    <>
      <div className={`mood-grid ${compact ? 'mood-grid-compact' : ''}`}>
        {composerMoods.map((moodId) => {
          const mood = MOOD_BY_ID[moodId]
          return (
            <button
              type="button"
              key={mood.id}
              className={`mood-item ${value === mood.id ? 'selected' : ''}`}
              onClick={() => handlePick(mood.id)}
              onPointerDown={(event) => beginPress(event, mood.id)}
              onPointerMove={movePress}
              onPointerUp={endPress}
              onPointerCancel={cancelPress}
              onPointerLeave={cancelPress}
              onContextMenu={(event) => event.preventDefault()}
              title={mood.tip}
            >
              <MoodFace mood={mood.id} size={compact ? 36 : 46} />
              <span>{mood.label}</span>
            </button>
          )
        })}
        {extraMood && (
          <button
            type="button"
            className="mood-item selected mood-item-extra"
            onClick={() => handlePick(extraMood.id)}
            onPointerDown={(event) => beginPress(event, extraMood.id)}
            onPointerMove={movePress}
            onPointerUp={endPress}
            onPointerCancel={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={(event) => event.preventDefault()}
            title={extraMood.tip}
          >
            <MoodFace mood={extraMood.id} size={compact ? 36 : 46} />
            <span>{extraMood.label}</span>
          </button>
        )}
        {onMore && !compact && (
          <>
            <button type="button" className="mood-picker-more" onClick={onMore}>
              <MoodFace mood="wink" size={24} />
              <span>更多表情</span>
              <Icon name="right" size={13} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="mood-picker-manage"
              onClick={() => setManagerOpen(true)}
            >
              <Icon name="grid" size={12} strokeWidth={2} />
              <span>管理这两排</span>
            </button>
          </>
        )}
      </div>

      {managingMood &&
        createPortal(
          <div
            className="mood-edit-backdrop"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) closeManager()
            }}
          >
            <div
              className="mood-edit-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={`管理${managingMood.label}`}
            >
              <div className="mood-edit-head">
                <MoodFace mood={managingMood.id} size={46} />
                <div className="mood-edit-copy">
                  <p>{isUnlisted ? '还没放进写日记页' : `写日记页第 ${managingUsedAt + 1} 位`}</p>
                  <h3>{managingMood.label}</h3>
                </div>
                <button type="button" className="mood-edit-close" onClick={closeManager} aria-label="关闭">
                  <Icon name="close" size={20} strokeWidth={2.2} />
                </button>
              </div>

              {!choosingSlot ? (
                <div className="mood-edit-actions">
                  {isUnlisted ? (
                    <button type="button" className="mood-edit-action" onClick={addToComposer}>
                      <span className="mood-edit-action-icon"><Icon name="plus" size={18} /></span>
                      <span>
                        <b>加入写日记页</b>
                        <em>以后打开写日记页，这张脸还在这里；首页转盘不动</em>
                      </span>
                      <Icon name="right" size={15} />
                    </button>
                  ) : (
                    <>
                      <button type="button" className="mood-edit-action" onClick={openReplacement}>
                        <span className="mood-edit-action-icon"><Icon name="shuffle" size={18} /></span>
                        <span>
                          <b>替换这个表情</b>
                          <em>从更多表情里换一个；原来的表情仍留在仓库里</em>
                        </span>
                        <Icon name="right" size={15} />
                      </button>
                      {!isComposerExtra && (
                        <button type="button" className="mood-edit-action" onClick={() => setChoosingSlot(true)}>
                          <span className="mood-edit-action-icon"><Icon name="grid" size={18} /></span>
                          <span>
                            <b>移动写日记页位置</b>
                            <em>和写日记页里的另一个位置互换</em>
                          </span>
                          <Icon name="right" size={15} />
                        </button>
                      )}
                      {isComposerExtra && (
                        <button type="button" className="mood-edit-action danger" onClick={removeComposerExtra}>
                          <span className="mood-edit-action-icon"><Icon name="trash" size={18} /></span>
                          <span>
                            <b>从写日记页移除</b>
                            <em>表情还在仓库里，只是不再出现在这两排</em>
                          </span>
                          <Icon name="right" size={15} />
                        </button>
                      )}
                    </>
                  )}
                  {value === managingMood.id && (
                    <button type="button" className="mood-edit-action" onClick={() => { onClear?.(); closeManager() }}>
                      <span className="mood-edit-action-icon"><Icon name="close" size={18} /></span>
                      <span>
                        <b>取消这个选择</b>
                        <em>今天先不选这个心情，表情仍留在写日记页</em>
                      </span>
                      <Icon name="right" size={15} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="mood-edit-slots-wrap">
                  <p className="mood-edit-note">点另一个位置，两个表情会互换。</p>
                  <div className="mood-edit-slots">
                    {composerMoods.map((moodId, index) => {
                      const mood = MOOD_BY_ID[moodId]
                      const current = index === managingUsedAt
                      return (
                        <button
                          type="button"
                          key={`slot-${moodId}`}
                          className={`mood-edit-slot ${current ? 'current' : ''}`}
                          onClick={() => placeMood(index)}
                          aria-label={`放到第 ${index + 1} 位：${mood.label}`}
                        >
                          <em>{current ? '现在' : index + 1}</em>
                          <MoodFace mood={mood.id} size={36} />
                          <span>{mood.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" className="mood-edit-back" onClick={() => setChoosingSlot(false)}>
                    返回
                  </button>
                </div>
              )}

              <p className="mood-edit-foot">长按心情脸可以管理；这里只改写日记页的表情，不动首页转盘。</p>
            </div>
          </div>,
          document.body,
        )}

      {managerOpen &&
        createPortal(
          <div
            className="mood-edit-backdrop"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setManagerOpen(false)
            }}
          >
            <div
              className="mood-edit-sheet mood-manager-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="管理写日记页表情"
            >
              <div className="mood-edit-head">
                <div className="mood-edit-copy">
                  <p>写日记页</p>
                  <h3>管理这两排</h3>
                </div>
                <button type="button" className="mood-edit-close" onClick={() => setManagerOpen(false)} aria-label="关闭">
                  <Icon name="close" size={20} strokeWidth={2.2} />
                </button>
              </div>

              <p className="mood-manager-note">前 8 位是两排常用；第 9 位起是后面追加的，可以直接移除。</p>

              <div className="mood-manager-list">
                {composerMoods.map((moodId, index) => {
                  const mood = MOOD_BY_ID[moodId]
                  const isExtra = index >= 8
                  return (
                    <div className={`mood-manager-row ${isExtra ? 'extra' : ''}`} key={`manager-${moodId}`}>
                      <MoodFace mood={moodId} size={34} />
                      <div className="mood-manager-copy">
                        <b>{mood.label}</b>
                        <em>第 {index + 1} 位 · {isExtra ? '追加表情' : '两排常用'}</em>
                      </div>
                      <div className="mood-manager-actions">
                        {isExtra && (
                          <button
                            type="button"
                            className="mood-manager-remove"
                            onClick={() => removeFromManager(moodId)}
                          >
                            移除
                          </button>
                        )}
                        <button
                          type="button"
                          className="mood-manager-replace"
                          onClick={() => replaceFromManager(index)}
                        >
                          替换
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mood-manager-foot">
                <button type="button" className="mood-manager-add" onClick={addFromManager}>
                  从更多表情添加
                </button>
                {composerMoods.length > 8 && (
                  <button type="button" className="mood-manager-reset" onClick={resetComposerMoods}>
                    恢复首页那 8 个
                  </button>
                )}
              </div>

              <p className="mood-edit-foot">这里只改写日记页的表情，不动首页转盘。</p>
            </div>
          </div>,
          document.body,
        )}

      <MoodLibrary
        open={libraryOpen && Boolean(replacingMood)}
        onClose={closeReplacement}
        onPick={replaceAtSlot}
        current={replacingMood?.id}
        replaceNote={replacingMood ? `正在替换写日记页第 ${replacingSlot! + 1} 位：${replacingMood.label}` : undefined}
        footNote={
          replacingMood
            ? `选一个表情替换第 ${replacingSlot! + 1} 位；换下来的“${replacingMood.label}”仍留在表情仓库里，首页转盘不动。`
            : undefined
        }
      />
    </>
  )
}
