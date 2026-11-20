import { useState } from 'react'
import type { CalendarEvent, CalendarEventType, Entry } from '../types'
import { dateKey, formatCn, formatDotDate, weekdayCn } from '../lib/dates'
import { lunarInfo } from '../lib/lunar'
import { LUNAR_MONTH_OPTIONS, daysBetween, lunarDayName } from '../lib/birthday'
import {
  EVENT_TYPE_HINTS,
  EVENT_TYPE_LABELS,
  defaultEventTitle,
  eventDateLabel,
  eventId,
  eventRepeatLabel,
  eventsOnDate,
} from '../lib/events'
import { formatDuration } from '../lib/audio'
import { Modal } from './Modal'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'

const EVENT_EMOJI: Record<CalendarEventType, string> = {
  birthday: '♥',
  anniversary: '✿',
  special: '★',
}

function writingLabel(entry: Entry, today: string): string {
  const createdKey = dateKey(new Date(entry.createdAt))
  if (createdKey > entry.date) return `补记于 ${formatDotDate(createdKey)}`
  const days = daysBetween(createdKey, today)
  if (days <= 0) return '今天写的'
  if (days === 1) return '昨天写的'
  return `${days} 天前写的`
}

function defaultDraft(type: CalendarEventType, key: string): CalendarEvent {
  const date = new Date(`${key}T12:00:00`)
  const lunar = lunarInfo(key)
  return {
    id: eventId(),
    type,
    title: defaultEventTitle(type),
    calendar: 'solar',
    month: date.getMonth() + 1,
    day: date.getDate(),
    year: date.getFullYear(),
    repeat: type === 'special' ? 'once' : 'yearly',
    reminder: type === 'birthday',
    reminderTime: '09:00',
    createdAt: Date.now(),
  }
}

export function DayDetailSheet({
  dayKey,
  entry,
  events,
  today,
  onClose,
  onOpenDay,
  onSaveEvent,
  onDeleteEvent,
}: {
  dayKey: string
  entry?: Entry
  events: CalendarEvent[]
  today: string
  onClose: () => void
  onOpenDay: (key: string) => void
  onSaveEvent: (event: CalendarEvent) => void | Promise<void>
  onDeleteEvent: (id: string) => void | Promise<void>
}) {
  const lunar = lunarInfo(dayKey)
  const isFutureDay = dayKey > today
  const dayEvents = eventsOnDate(events, dayKey)
  const [editor, setEditor] = useState<CalendarEvent | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [error, setError] = useState('')

  function startNew(type: CalendarEventType) {
    setEditor(defaultDraft(type, dayKey))
    setError('')
    setEditorOpen(true)
  }

  function startEdit(event: CalendarEvent) {
    setEditor({ ...event })
    setError('')
    setEditorOpen(true)
  }

  function patchEditor(patch: Partial<CalendarEvent>) {
    setEditor((current) => (current ? { ...current, ...patch } : current))
  }

  function setType(type: CalendarEventType) {
    setEditor((current) => {
      if (!current) return current
      const defaultTitle = defaultEventTitle(current.type)
      return {
        ...current,
        type,
        title:
          !current.title || current.title === defaultTitle ? defaultEventTitle(type) : current.title,
        repeat: type === 'special' ? 'once' : 'yearly',
        reminder: type === 'birthday',
      }
    })
  }

  function setCalendar(calendar: 'solar' | 'lunar') {
    const date = new Date(`${dayKey}T12:00:00`)
    if (calendar === 'lunar') {
      patchEditor({
        calendar,
        month: Math.abs(lunar.month),
        day: lunar.day,
        year: date.getFullYear(),
      })
    } else {
      patchEditor({
        calendar,
        month: date.getMonth() + 1,
        day: date.getDate(),
        year: date.getFullYear(),
      })
    }
  }

  async function saveEvent() {
    if (!editor) return
    const title = editor.title.trim()
    if (!title) {
      setError('给它一个名字吧')
      return
    }
    if (editor.month < 1 || editor.month > 12 || editor.day < 1 || editor.day > 31) {
      setError('日期不太对，再检查一下')
      return
    }
    if (editor.repeat === 'once' && (!editor.year || editor.year < 1900 || editor.year > 2200)) {
      setError('年份不太对，再检查一下')
      return
    }
    await onSaveEvent({
      ...editor,
      title,
      month: Number(editor.month),
      day: Number(editor.day),
      year: editor.repeat === 'once' ? Number(editor.year) : undefined,
    })
    setEditorOpen(false)
  }

  async function removeEvent() {
    if (!editor) return
    await onDeleteEvent(editor.id)
    setEditorOpen(false)
    setEditor(null)
  }

  return (
    <>
      <Modal open onClose={onClose} wide>
        <div className="day-detail">
          <div className="day-detail-head">
            <div>
              <p className="sheet-eyebrow">Metano · 这一天</p>
              <h2>
                {formatCn(dayKey)} <span className="day-detail-week">{weekdayCn(dayKey)}</span>
              </h2>
              <p className="day-lunar">
                农历 {lunar.monthLabel}
                {lunar.dayLabel}
                {lunar.festival ? ` · ${lunar.festival}` : ''}
              </p>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
              <Icon name="close" size={18} />
            </button>
          </div>

          {entry ? (
            <button type="button" className="day-diary-preview" onClick={() => onOpenDay(dayKey)}>
              <div className="day-diary-preview-top">
                <MoodFace mood={entry.mood} size={42} />
                <div className="day-diary-preview-copy">
                  <strong>这天写的日记</strong>
                  <span>{writingLabel(entry, today)}</span>
                </div>
                <Icon name="right" size={18} />
              </div>
              <p className="day-diary-text">{entry.text || '这一天只留下了一个心情。'}</p>
              <div className="day-diary-meta">
                {entry.photos.length > 0 && (
                  <span>
                    <Icon name="image" size={12} /> {entry.photos.length} 张照片
                  </span>
                )}
                {entry.audio && (
                  <span>
                    <Icon name="mic" size={12} /> 语音 {formatDuration(entry.audio.duration)}
                  </span>
                )}
                {entry.place?.label && (
                  <span>
                    <Icon name="pin" size={12} /> {entry.place.label}
                  </span>
                )}
                {!entry.photos.length && !entry.audio && !entry.place?.label && (
                  <span>{formatDotDate(entry.date)}</span>
                )}
              </div>
            </button>
          ) : (
            <div className="day-diary-empty">
              <MoodFace mood="neutral" size={42} />
              <div>
                <strong>{isFutureDay ? '这天还没到' : '这天还没有日记'}</strong>
                <p>{isFutureDay ? '先把想记住的日子放进来。' : '什么时候补一笔都不晚。'}</p>
              </div>
              {!isFutureDay && (
                <button type="button" className="btn-ghost day-write-btn" onClick={() => onOpenDay(dayKey)}>
                  补记这一天
                </button>
              )}
            </div>
          )}

          <section className="day-events">
            <div className="section-head">
              <h2>特别的日子</h2>
              <span className="section-hint">{dayEvents.length ? `${dayEvents.length} 个` : '留一个位置'}</span>
            </div>

            {dayEvents.length > 0 ? (
              <div className="day-event-list">
                {dayEvents.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    className={`day-event-item event-${event.type}`}
                    onClick={() => startEdit(event)}
                  >
                    <span className="day-event-mark">{EVENT_EMOJI[event.type]}</span>
                    <span className="day-event-copy">
                      <strong>{event.title}</strong>
                      <span>
                        {EVENT_TYPE_LABELS[event.type]} · {eventDateLabel(event)} · {eventRepeatLabel(event)}
                        {event.reminder ? ` · ${event.reminderTime} 提醒` : ''}
                      </span>
                    </span>
                    <Icon name="edit" size={15} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="day-events-empty">这一天还没有特别的日子，可以把它记成生日、纪念日，或者只属于你的特别的一天。</p>
            )}

            <div className="day-event-actions">
              <button type="button" onClick={() => startNew('birthday')}>
                <span>♥</span> 生日
              </button>
              <button type="button" onClick={() => startNew('anniversary')}>
                <span>✿</span> 纪念日
              </button>
              <button type="button" onClick={() => startNew('special')}>
                <span>★</span> 特别的日子
              </button>
            </div>
          </section>
        </div>
      </Modal>

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)}>
        {editor && (
          <div className="day-event-editor">
            <div className="sheet-head">
              <div>
                <p className="sheet-eyebrow">Metano · 特别的日子</p>
                <h2>{editorOpen && editor.title ? editor.title : '记一个日子'}</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setEditorOpen(false)}
                aria-label="关闭"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="day-event-types">
              {(['birthday', 'anniversary', 'special'] as CalendarEventType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  className={editor.type === type ? 'on' : ''}
                  onClick={() => setType(type)}
                >
                  <b>{EVENT_EMOJI[type]}</b>
                  {EVENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <p className="day-event-hint">{EVENT_TYPE_HINTS[editor.type]}</p>

            <label className="plan-field">
              <span>叫什么</span>
              <input
                className="plan-input"
                value={editor.title}
                onChange={(e) => patchEditor({ title: e.target.value })}
                maxLength={24}
                placeholder="比如：妈妈的生日"
                autoFocus
              />
            </label>

            <div className="plan-field">
              <span className="plan-field-label">按哪个历</span>
              <div className="plan-kind-switch">
                <button
                  type="button"
                  className={editor.calendar === 'solar' ? 'on' : ''}
                  onClick={() => setCalendar('solar')}
                >
                  新历
                </button>
                <button
                  type="button"
                  className={editor.calendar === 'lunar' ? 'on' : ''}
                  onClick={() => setCalendar('lunar')}
                >
                  农历
                </button>
              </div>
            </div>

            <div className="plan-field-row">
              <label className="plan-field">
                <span>{editor.calendar === 'lunar' ? '农历月份' : '月份'}</span>
                <select
                  className="plan-input"
                  value={editor.month}
                  onChange={(e) => patchEditor({ month: Number(e.target.value) })}
                >
                  {(editor.calendar === 'lunar'
                    ? LUNAR_MONTH_OPTIONS
                    : Array.from({ length: 12 }, (_, index) => ({
                        value: index + 1,
                        label: `${index + 1}月`,
                      }))
                  ).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="plan-field">
                <span>{editor.calendar === 'lunar' ? '农历日期' : '日期'}</span>
                <select
                  className="plan-input"
                  value={editor.day}
                  onChange={(e) => patchEditor({ day: Number(e.target.value) })}
                >
                  {Array.from(
                    { length: editor.calendar === 'lunar' ? 30 : 31 },
                    (_, index) => index + 1,
                  ).map((day) => (
                    <option key={day} value={day}>
                      {editor.calendar === 'lunar' ? lunarDayName(day) : `${day}日`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {editor.repeat === 'once' ? (
              <label className="plan-field">
                <span>哪一年</span>
                <input
                  className="plan-input"
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2200}
                  value={editor.year || new Date().getFullYear()}
                  onChange={(e) => patchEditor({ year: Number(e.target.value) })}
                />
              </label>
            ) : null}

            <div className="plan-field">
              <span className="plan-field-label">重复</span>
              <div className="plan-kind-switch">
                <button
                  type="button"
                  className={editor.repeat === 'yearly' ? 'on' : ''}
                  onClick={() => patchEditor({ repeat: 'yearly' })}
                >
                  每年都记
                </button>
                <button
                  type="button"
                  className={editor.repeat === 'once' ? 'on' : ''}
                  onClick={() => patchEditor({ repeat: 'once' })}
                >
                  只有这一次
                </button>
              </div>
            </div>

            <div className="plan-reminder-row day-event-reminder">
              <div>
                <span className="plan-field-label">提醒我</span>
                <p>
                  {editor.type === 'birthday'
                    ? '生日会在前一天和当天各发一条本地祝福。'
                    : '开了提醒，会在当天发一条本地通知。'}
                </p>
              </div>
              <button
                type="button"
                className={`plan-toggle ${editor.reminder ? 'on' : ''}`}
                onClick={() => patchEditor({ reminder: !editor.reminder })}
                aria-label="切换提醒"
              >
                <span />
              </button>
            </div>

            {editor.reminder && (
              <label className="plan-field">
                <span>几点提醒</span>
                <input
                  className="plan-input"
                  type="time"
                  value={editor.reminderTime}
                  onChange={(e) => patchEditor({ reminderTime: e.target.value })}
                />
              </label>
            )}

            {error && <p className="form-error">{error}</p>}

            <div className="day-event-save-row">
              {events.some((event) => event.id === editor.id) && (
                <button type="button" className="plan-delete-link" onClick={() => void removeEvent()}>
                  删掉这个日子
                </button>
              )}
              <button type="button" className="btn-primary plan-save" onClick={() => void saveEvent()}>
                {events.some((event) => event.id === editor.id) ? '保存修改' : '记下这个日子'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
