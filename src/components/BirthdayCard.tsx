import { useEffect, useState } from 'react'
import type { BirthdaySetting } from '../types'
import {
  birthdayCountdown,
  birthdayLabel,
  birthdaySubLabel,
  daysBetween,
  lunarDayName,
  lunarMonthName,
  LUNAR_MONTH_OPTIONS,
  nextBirthday,
} from '../lib/birthday'
import { fullCn } from '../lib/dates'
import { Icon } from './Icon'
import { Modal } from './Modal'

const DEFAULT_TIME = '09:00'

function defaultBirthday(today: string): BirthdaySetting {
  const [, month, day] = today.split('-').map(Number)
  return { calendar: 'solar', month, day, time: DEFAULT_TIME }
}

function daysInSolarMonth(month: number): number {
  return new Date(2024, month, 0).getDate()
}

export function BirthdayCard({
  birthday,
  today,
  onSave,
  onDelete,
}: {
  birthday?: BirthdaySetting
  today: string
  onSave: (birthday: BirthdaySetting) => void | Promise<void>
  onDelete: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<BirthdaySetting>(() => defaultBirthday(today))
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraft(birthday ? { ...birthday } : defaultBirthday(today))
    setError('')
    setConfirmDelete(false)
  }, [open, birthday, today])

  function patch(patchValue: Partial<BirthdaySetting>) {
    setDraft((current) => ({ ...current, ...patchValue }))
    setError('')
    setConfirmDelete(false)
  }

  function setCalendar(calendar: BirthdaySetting['calendar']) {
    if (calendar === 'lunar' && draft.day > 30) {
      patch({ calendar, day: 30 })
      return
    }
    patch({ calendar })
  }

  async function save() {
    const month = Math.round(Number(draft.month))
    const day = Math.round(Number(draft.day))
    if (month < 1 || month > 12) {
      setError('月份要在 1 到 12 之间。')
      return
    }
    if (draft.calendar === 'solar') {
      if (day < 1 || day > daysInSolarMonth(month)) {
        setError('这个月没有这一天，再检查一下。')
        return
      }
    } else if (day < 1 || day > 30) {
      setError('农历日期要在初一到处三十之间。')
      return
    }
    if (!/^\d{2}:\d{2}$/.test(draft.time)) {
      setError('祝福时间格式不对。')
      return
    }
    await onSave({ ...draft, month, day })
    setOpen(false)
  }

  async function remove() {
    await onDelete()
    setOpen(false)
  }

  const next = birthday ? nextBirthday(birthday, today) : null
  const nextDays = next ? daysBetween(today, next) : 0

  return (
    <>
      <section className="birthday-card">
        <div className="birthday-glow" aria-hidden="true" />
        <div className="birthday-main">
          <div className="birthday-icon">
            <Icon name="heart" size={20} />
          </div>
          <div className="birthday-copy">
            <p className="birthday-eyebrow">
              生日 <span>{birthday ? birthdaySubLabel(birthday) : '提前一天 · 当天'}</span>
            </p>
            <h3>{birthday ? birthdayLabel(birthday) : '把生日记在这里'}</h3>
            <p>
              {birthday
                ? birthdayCountdown(birthday, today)
                : '提前一天和生日当天，各收到一句本地祝福。'}
            </p>
          </div>
          <button type="button" className="birthday-edit" onClick={() => setOpen(true)}>
            {birthday ? '修改' : '设置'}
          </button>
        </div>
        {birthday && next && nextDays > 0 && (
          <p className="birthday-next">
            下一次：{fullCn(next)} · 还剩 {nextDays} 天
          </p>
        )}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} wide>
        <div className="plan-form birthday-form">
          <div className="plan-form-head">
            <div>
              <p className="sheet-eyebrow">Metano · 生日</p>
              <h2>{birthday ? '修改生日' : '设置生日'}</h2>
            </div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="关闭">
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className="plan-frequency-block">
            <span className="plan-field-label">按哪种历法过生日</span>
            <div className="plan-kind-switch birthday-switch">
              <button type="button" className={draft.calendar === 'solar' ? 'on' : ''} onClick={() => setCalendar('solar')}>
                新历（公历）
              </button>
              <button type="button" className={draft.calendar === 'lunar' ? 'on' : ''} onClick={() => setCalendar('lunar')}>
                农历
              </button>
            </div>
          </div>

          {draft.calendar === 'solar' ? (
            <div className="plan-field-row">
              <label className="plan-field">
                <span>月份</span>
                <input
                  className="plan-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  value={draft.month}
                  onChange={(e) => patch({ month: Number(e.target.value) })}
                />
              </label>
              <label className="plan-field">
                <span>日期</span>
                <input
                  className="plan-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={draft.day}
                  onChange={(e) => patch({ day: Number(e.target.value) })}
                />
              </label>
            </div>
          ) : (
            <div className="plan-field-row">
              <label className="plan-field">
                <span>农历月份</span>
                <select
                  className="plan-input"
                  value={draft.month}
                  onChange={(e) => patch({ month: Number(e.target.value) })}
                >
                  {LUNAR_MONTH_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="plan-field">
                <span>农历日期</span>
                <select
                  className="plan-input"
                  value={draft.day}
                  onChange={(e) => patch({ day: Number(e.target.value) })}
                >
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {lunarDayName(day)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <label className="plan-field">
            <span>祝福时间</span>
            <input
              className="plan-input"
              type="time"
              value={draft.time}
              onChange={(e) => patch({ time: e.target.value })}
            />
          </label>

          <p className="plan-form-hint">
            生日前一天和生日当天各发一条本地通知。农历生日会自动换算成当年的公历日期；农历三十遇到小月时按当月最后一天过。
          </p>

          {error && <p className="form-error">{error}</p>}

          <button type="button" className="btn-primary plan-save" onClick={() => void save()}>
            保存生日
          </button>

          {birthday && (
            <div className="birthday-delete">
              {confirmDelete ? (
                <>
                  <p>确定要关掉生日提醒吗？</p>
                  <div>
                    <button type="button" className="plan-delete" onClick={() => void remove()}>
                      确定清除
                    </button>
                    <button type="button" className="plan-cancel-delete" onClick={() => setConfirmDelete(false)}>
                      再想想
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="birthday-delete-link" onClick={() => setConfirmDelete(true)}>
                  清除生日和提醒
                </button>
              )}
            </div>
          )}

          {draft.calendar === 'lunar' && (
            <p className="birthday-lunar-note">
              当前选择：农历{lunarMonthName(draft.month)}
              {lunarDayName(draft.day)} · 每年对应一个新历日期
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
