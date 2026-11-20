import { useState } from 'react'
import type { Plan, PlanFrequency, PlanPreset } from '../types'
import {
  PLAN_COLORS,
  PLAN_WEEKDAYS,
  planComplete,
  planDoneToday,
  planFrequency,
  planPercent,
  planReminderDays,
  planReminderLabel,
  planSubtitle,
  planTargetDate,
  planWeek,
  planWeekCount,
  planWeeklyDone,
} from '../lib/plans'
import { newId } from '../lib/db'
import { dateKey } from '../lib/dates'
import { Modal } from './Modal'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'

const PRESETS: { id: PlanPreset; label: string; minutes: number; tip: string }[] = [
  { id: 'book', label: '看书', minutes: 0, tip: '按页数推进' },
  { id: 'fitness', label: '健身', minutes: 0, tip: '几组 · 每组几个' },
  { id: 'early', label: '早睡早起', minutes: 0, tip: '几点睡 · 几点起' },
  { id: 'diet', label: '控制饮食', minutes: 0, tip: '每天几餐' },
  { id: 'fatloss', label: '减脂', minutes: 30, tip: '每天多少分钟' },
  { id: 'running', label: '跑步', minutes: 20, tip: '每天多少分钟' },
  { id: 'discipline', label: '自律', minutes: 0, tip: '几组动作 · 每组几个' },
  { id: 'other', label: '其他', minutes: 0, tip: '自定义目标' },
]

const PRESET_LABELS: Record<PlanPreset, string> = {
  book: '看书',
  fitness: '健身',
  early: '早睡早起',
  diet: '控制饮食',
  fatloss: '减脂',
  running: '跑步',
  discipline: '自律',
  other: '其他',
}

function freshPlan(today: string): Plan {
  return {
    id: newId(),
    title: '',
    kind: 'habit',
    frequency: 'daily',
    preset: 'other',
    dailyTarget: 1,
    minutes: undefined,
    weeklyTarget: 3,
    intervalDays: 2,
    reminderDays: [1, 3, 5],
    unit: '次',
    reps: undefined,
    sleepTime: '23:00',
    wakeTime: '07:00',
    fullness: '七分饱',
    color: PLAN_COLORS[0],
    reminderEnabled: true,
    reminderTime: '21:00',
    startDate: today,
    logs: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function normalizePlan(plan: Plan): Plan {
  return {
    ...plan,
    logs: { ...plan.logs },
    frequency: planFrequency(plan),
    preset: plan.preset || (plan.kind === 'reading' ? 'book' : 'other'),
    dailyTarget: Math.max(1, Number(plan.dailyTarget) || 1),
    weeklyTarget: plan.weeklyTarget ?? 3,
    intervalDays: plan.intervalDays ?? 2,
    reminderDays: planReminderDays(plan),
    reps: plan.reps ? Math.max(1, Number(plan.reps)) : undefined,
    sleepTime: plan.sleepTime || '23:00',
    wakeTime: plan.wakeTime || '07:00',
    fullness: plan.fullness || '七分饱',
  }
}

export function PlanBoard({
  plans,
  planTags,
  today,
  onSave,
  onDelete,
  onAddTag,
  onCheckIn,
}: {
  plans: Plan[]
  planTags: string[]
  today: string
  onSave: (plan: Plan) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onAddTag: (tag: string) => void | Promise<void>
  onCheckIn: (id: string, value: number) => void | Promise<void>
}) {
  const [editor, setEditor] = useState<Plan | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState('')
  const [checking, setChecking] = useState<Plan | null>(null)
  const [checkValue, setCheckValue] = useState('')
  const [checkOpen, setCheckOpen] = useState(false)

  function resetTagInput() {
    setTagOpen(false)
    setTagDraft('')
    setTagError('')
  }

  function openNew() {
    setEditor(freshPlan(dateKey()))
    setError('')
    setConfirmDelete(false)
    setPresetOpen(false)
    resetTagInput()
    setEditorOpen(true)
  }

  function openEdit(plan: Plan) {
    setEditor(normalizePlan(plan))
    setError('')
    setConfirmDelete(false)
    setPresetOpen(false)
    resetTagInput()
    setEditorOpen(true)
  }

  function patchEditor(patch: Partial<Plan>) {
    setEditor((current) => (current ? { ...current, ...patch } : current))
  }

  function setFrequency(frequency: PlanFrequency) {
    patchEditor({ frequency })
  }

  function applyPreset(preset: PlanPreset) {
    if (!editor) return
    const item = PRESETS.find((entry) => entry.id === preset)
    const currentTitle = editor.title.trim()
    if (preset === 'book') {
      patchEditor({
        preset,
        tag: undefined,
        kind: 'reading',
        frequency: editor.frequency || 'daily',
        total: editor.total || 300,
        dailyTarget: editor.dailyTarget && editor.dailyTarget > 1 ? editor.dailyTarget : 20,
        unit: '页',
        minutes: undefined,
        reps: undefined,
        ...(currentTitle ? {} : { title: '看完一本书' }),
      })
    } else if (preset === 'fitness' || preset === 'discipline') {
      patchEditor({
        preset,
        tag: undefined,
        kind: 'habit',
        total: undefined,
        dailyTarget: 3,
        unit: '组',
        reps: preset === 'fitness' ? 12 : 10,
        minutes: undefined,
        ...(currentTitle ? {} : { title: PRESET_LABELS[preset] }),
      })
    } else if (preset === 'early') {
      patchEditor({
        preset,
        tag: undefined,
        kind: 'habit',
        total: undefined,
        dailyTarget: 1,
        unit: '次',
        minutes: undefined,
        reps: undefined,
        sleepTime: editor.sleepTime || '23:00',
        wakeTime: editor.wakeTime || '07:00',
        ...(currentTitle ? {} : { title: '早睡早起' }),
      })
    } else if (preset === 'diet') {
      patchEditor({
        preset,
        tag: undefined,
        kind: 'habit',
        total: undefined,
        dailyTarget: 3,
        unit: '餐',
        minutes: undefined,
        reps: undefined,
        fullness: editor.fullness || '七分饱',
        ...(currentTitle ? {} : { title: '控制饮食' }),
      })
    } else if (preset === 'running' || preset === 'fatloss') {
      patchEditor({
        preset,
        tag: undefined,
        kind: 'habit',
        total: undefined,
        dailyTarget: item?.minutes || (preset === 'running' ? 20 : 30),
        unit: '分钟',
        minutes: undefined,
        reps: undefined,
        ...(currentTitle ? {} : { title: PRESET_LABELS[preset] }),
      })
    } else {
      patchEditor({
        preset,
        tag: undefined,
        kind: 'habit',
        total: undefined,
        dailyTarget: 1,
        unit: '次',
        minutes: undefined,
        reps: undefined,
        ...(currentTitle ? {} : { title: '其他' }),
      })
    }
    setPresetOpen(false)
    resetTagInput()
  }

  function applyCustomTag(tag: string) {
    if (!editor) return
    const currentTitle = editor.title.trim()
    setEditor({
      ...editor,
      preset: 'other',
      tag,
      kind: 'habit',
      total: undefined,
      dailyTarget: 1,
      unit: '次',
      minutes: undefined,
      reps: undefined,
      ...(currentTitle ? {} : { title: tag }),
    })
    setPresetOpen(false)
    resetTagInput()
  }

  async function createTag() {
    const clean = tagDraft.trim().slice(0, 8)
    if (!clean) {
      setTagError('先写一个标签名。')
      return
    }
    const builtIn = PRESETS.some((preset) => preset.label === clean)
    if (builtIn || planTags.includes(clean)) {
      setTagError('这个标签已经有了，直接选它就好。')
      return
    }
    setTagError('')
    await onAddTag(clean)
    applyCustomTag(clean)
    setPresetOpen(true)
    setTagDraft('')
    setTagOpen(false)
  }

  function toggleReminderDay(day: number) {
    setEditor((current) => {
      if (!current) return current
      const days = planReminderDays(current)
      const next = days.includes(day) ? days.filter((value) => value !== day) : [...days, day].sort((a, b) => a - b)
      return { ...current, reminderDays: next }
    })
  }

  async function saveEditor() {
    if (!editor) return
    const title = editor.title.trim()
    if (!title) {
      setError('先给这个计划起个名字。')
      return
    }
    const frequency = planFrequency(editor)

    if (editor.kind === 'reading') {
      if (!Number(editor.total) || Number(editor.total) < 1) {
        setError('总页数要大于 0。')
        return
      }
      if (!Number(editor.dailyTarget) || Number(editor.dailyTarget) < 1) {
        setError(frequency === 'daily' ? '每天读的页数要大于 0。' : '每次读的页数要大于 0。')
        return
      }
    } else {
      if (!Number(editor.dailyTarget) || Number(editor.dailyTarget) < 1) {
        setError('每天做到的数量要大于 0。')
        return
      }
      if (editor.preset === 'fitness' || editor.preset === 'discipline') {
        if (!Number(editor.reps) || Number(editor.reps) < 1) {
          setError('每组个数要大于 0。')
          return
        }
      }
      if (editor.preset === 'early') {
        if (!editor.sleepTime || !editor.wakeTime) {
          setError('把睡觉和起床时间都填上。')
          return
        }
      }
      if (editor.preset === 'other' && !(editor.unit || '').trim()) {
        setError('给这个计划写一个单位，比如 个、页、组。')
        return
      }
      if (frequency === 'weekly') {
        const target = Number(editor.weeklyTarget)
        if (!target || target < 1 || target > 7) {
          setError('每周做到次数要在 1 到 7 之间。')
          return
        }
        if (editor.reminderEnabled && !(editor.reminderDays || []).length) {
          setError('每周计划至少选一天提醒，或者先关掉提醒。')
          return
        }
      }
      if (frequency === 'custom') {
        const interval = Number(editor.intervalDays)
        if (!interval || interval < 2 || interval > 30) {
          setError('自定义间隔要在 2 到 30 天之间。')
          return
        }
      }
      if (Number(editor.minutes) > 600) {
        setError('一次做到的时间不用超过 600 分钟。')
        return
      }
    }

    const preset = editor.preset || (editor.kind === 'reading' ? 'book' : 'other')
    const target = Math.max(1, Math.round(Number(editor.dailyTarget) || 1))
    const total = Number(editor.total)
    const unit =
      editor.kind === 'reading'
        ? '页'
        : preset === 'fitness' || preset === 'discipline'
          ? '组'
          : preset === 'diet'
            ? '餐'
            : preset === 'running' || preset === 'fatloss'
              ? '分钟'
              : preset === 'early'
                ? '次'
                : (editor.unit || '').trim() || '次'
    const next: Plan = {
      ...editor,
      title,
      frequency,
      preset,
      tag: editor.kind === 'reading' ? undefined : editor.tag?.trim() || undefined,
      total:
        editor.kind === 'reading' || (Number.isFinite(total) && total > 0)
          ? Math.max(1, Math.round(total))
          : undefined,
      dailyTarget: target,
      minutes:
        editor.kind === 'reading'
          ? undefined
          : Math.max(0, Math.round(Number(editor.minutes) || 0)) || undefined,
      reps:
        preset === 'fitness' || preset === 'discipline'
          ? Math.max(1, Math.round(Number(editor.reps) || 1))
          : undefined,
      sleepTime: preset === 'early' ? editor.sleepTime : undefined,
      wakeTime: preset === 'early' ? editor.wakeTime : undefined,
      fullness: preset === 'diet' ? editor.fullness || '七分饱' : undefined,
      weeklyTarget:
        editor.kind !== 'reading' && frequency === 'weekly'
          ? Math.max(1, Math.min(7, Math.round(Number(editor.weeklyTarget) || 3)))
          : undefined,
      intervalDays:
        editor.kind !== 'reading' && frequency === 'custom'
          ? Math.max(2, Math.min(30, Math.round(Number(editor.intervalDays) || 2)))
          : undefined,
      reminderDays: frequency === 'weekly' ? planReminderDays(editor) : undefined,
      unit,
      updatedAt: Date.now(),
    }
    await onSave(next)
    setEditorOpen(false)
  }

  function openCheck(plan: Plan) {
    setChecking(plan)
    setError('')
    setCheckValue(String(Number(plan.logs[today] || 0) || plan.dailyTarget))
    setCheckOpen(true)
  }

  async function saveCheck() {
    if (!checking) return
    const value = Math.max(0, Math.round(Number(checkValue) || 0))
    const unit = checking.kind === 'reading' ? '页' : checking.unit || '次'
    if (value === 0) {
      setError(`至少记 1 ${unit}；想清空今天，可以先留着。`)
      return
    }
    await onCheckIn(checking.id, value)
    setCheckOpen(false)
    setChecking(null)
  }

  async function toggleHabit(plan: Plan) {
    const done = planDoneToday(plan, today)
    await onCheckIn(plan.id, done ? 0 : 1)
  }

  const todayDone = plans.filter((plan) => planDoneToday(plan, today)).length
  const totalPages = Math.max(0, Number(editor?.total) || 0)
  const dailyPages = Math.max(1, Number(editor?.dailyTarget) || 1)
  const expectedDays = totalPages > 0 ? Math.max(1, Math.ceil(totalPages / dailyPages)) : 0
  const editorFrequency = editor ? planFrequency(editor) : 'daily'
  const editorPreset = editor?.preset || (editor?.kind === 'reading' ? 'book' : 'other')

  return (
    <section className="section plan-section">
      <div className="section-head plan-head">
        <div>
          <h2>计划</h2>
          <p className="plan-kicker">不是逼自己，是给想做的事留个位置</p>
        </div>
        <button type="button" className="plan-add" onClick={openNew} aria-label="新建计划">
          <Icon name="plus" size={14} />
          新建
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="plan-empty">
          <div className="plan-empty-faces">
            <MoodFace mood="happy" size={46} />
            <MoodFace mood="calm" size={40} />
            <MoodFace mood="excited" size={36} />
          </div>
          <div>
            <h3>把想坚持的事放进来</h3>
            <p>看书、健身、控制饮食，或者任何想慢慢做到的事。</p>
          </div>
          <button type="button" className="btn-ghost plan-empty-btn" onClick={openNew}>
            加一个计划
          </button>
        </div>
      ) : (
        <>
          <div className="plan-summary">
            <span>
              今天 <b>{todayDone}</b> / {plans.length} 个计划有进展
            </span>
            <span className="plan-summary-mark">近 7 天</span>
          </div>
          <div className="plan-list">
            {plans.map((plan) => {
              const frequency = planFrequency(plan)
              const complete = planComplete(plan)
              const weeklyDone = planWeeklyDone(plan, today)
              const done = planDoneToday(plan, today)
              const percent = planPercent(plan, today)
              const week = planWeek(plan, today)
              const weekCount = planWeekCount(plan, today)
              const cardComplete = complete || weeklyDone
              const isReading = plan.kind === 'reading'
              const hasTarget = Number(plan.dailyTarget) > 1
              const numericCheck = isReading || hasTarget
              const unit = plan.unit || '次'
              return (
                <article
                  key={plan.id}
                  className={`plan-card ${cardComplete ? 'complete' : ''}`}
                  style={{ borderLeftColor: plan.color }}
                >
                  <div className="plan-card-top">
                    <span className="plan-color-dot" style={{ background: plan.color }} />
                    <div className="plan-title-wrap">
                      <h3>{plan.title}</h3>
                      <p>{planSubtitle(plan)}</p>
                    </div>
                    <button
                      type="button"
                      className="plan-edit"
                      onClick={() => openEdit(plan)}
                      aria-label={`编辑${plan.title}`}
                    >
                      <Icon name="edit" size={16} />
                    </button>
                  </div>

                  {isReading || frequency === 'weekly' || Boolean(plan.total) ? (
                    <div className="plan-progress-row">
                      <div className="plan-bar">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                      <span className="plan-percent">
                        {plan.total ? `${percent}%` : `${weekCount}/${plan.weeklyTarget || 3} 次`}
                      </span>
                    </div>
                  ) : (
                    <div className="plan-habit-line">
                      <span>已坚持 {Object.values(plan.logs).filter((v) => Number(v) > 0).length} 天</span>
                      <span>{frequency === 'custom' ? `每 ${plan.intervalDays || 2} 天一次` : '长期'}</span>
                    </div>
                  )}

                  <div className="plan-week" aria-label="近七天完成情况">
                    {week.map((day) => (
                      <span
                        key={day.key}
                        className={`plan-week-day ${day.done ? 'done' : ''} ${day.key === today ? 'today' : ''}`}
                        style={day.done ? { background: plan.color } : undefined}
                        title={`${day.key}${day.done ? ' 已完成' : ' 未完成'}`}
                      >
                        {day.label}
                      </span>
                    ))}
                  </div>

                  <div className="plan-card-foot">
                    <div className="plan-meta">
                      <span>
                        {complete
                          ? isReading
                            ? '这本读完了'
                            : '这个目标完成了'
                          : frequency === 'weekly'
                            ? weeklyDone
                              ? '本周已完成'
                              : `本周 ${weekCount} / ${plan.weeklyTarget || 3} 次`
                            : numericCheck
                              ? `今天 ${Number(plan.logs[today] || 0)} / ${plan.dailyTarget} ${unit}`
                              : done
                                ? '今天做到了'
                                : '今天还没打卡'}
                      </span>
                      <span className="plan-reminder-label">
                        <Icon name="bell" size={12} />
                        {planReminderLabel(plan)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`plan-check ${done ? 'done' : ''} ${cardComplete ? 'complete' : ''}`}
                      onClick={() => {
                        if (cardComplete) return
                        if (numericCheck) openCheck(plan)
                        else void toggleHabit(plan)
                      }}
                      disabled={cardComplete}
                      title={done && !numericCheck ? '再点一次撤销今天的打卡' : undefined}
                    >
                      {cardComplete
                        ? isReading
                          ? '已完成'
                          : '目标完成'
                        : done
                          ? numericCheck
                            ? '改数量'
                            : '已完成'
                          : numericCheck
                            ? '记数量'
                            : '打卡'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} wide>
        {editor && (
          <div className="plan-form">
            <div className="plan-form-head">
              <div>
                <p className="sheet-eyebrow">Metano · 计划</p>
                <h2>{plans.some((p) => p.id === editor.id) ? '修改计划' : '新建计划'}</h2>
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

            <label className="plan-field">
              <span>计划名字</span>
              <input
                className="plan-input"
                value={editor.title}
                onChange={(e) => patchEditor({ title: e.target.value })}
                placeholder="比如：晚饭后走一走"
                maxLength={32}
              />
            </label>

            <div className="plan-frequency-block">
              <span className="plan-field-label">怎么坚持</span>
              <div className="plan-kind-switch plan-frequency-switch">
                <button
                  type="button"
                  className={editorFrequency === 'daily' ? 'on' : ''}
                  onClick={() => setFrequency('daily')}
                >
                  每天做到
                </button>
                <button
                  type="button"
                  className={editorFrequency === 'weekly' ? 'on' : ''}
                  onClick={() => setFrequency('weekly')}
                >
                  每周做到
                </button>
                <button
                  type="button"
                  className={editorFrequency === 'custom' ? 'on' : ''}
                  onClick={() => setFrequency('custom')}
                >
                  自定义时间
                </button>
              </div>
            </div>

            {editorFrequency === 'weekly' && (
              <label className="plan-field">
                <span>每周做到几次</span>
                <input
                  className="plan-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={7}
                  value={editor.weeklyTarget ?? 3}
                  onChange={(e) => patchEditor({ weeklyTarget: Number(e.target.value) })}
                />
              </label>
            )}

            {editorFrequency === 'custom' && (
              <label className="plan-field">
                <span>每隔几天做到一次</span>
                <input
                  className="plan-input"
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={30}
                  value={editor.intervalDays ?? 2}
                  onChange={(e) => patchEditor({ intervalDays: Number(e.target.value) })}
                />
              </label>
            )}

            {editor.kind === 'reading' ? (
              <>
                <div className="plan-field-row">
                  <label className="plan-field">
                    <span>这本书总页数</span>
                    <input
                      className="plan-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={editor.total ?? ''}
                      onChange={(e) => patchEditor({ total: Number(e.target.value) })}
                    />
                  </label>
                  <label className="plan-field">
                    <span>{editorFrequency === 'daily' ? '每天读多少页' : '每次读多少页'}</span>
                    <input
                      className="plan-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={editor.dailyTarget}
                      onChange={(e) => patchEditor({ dailyTarget: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <p className="plan-form-hint">
                  {editorFrequency === 'daily'
                    ? `按每天 ${dailyPages} 页，大概 ${expectedDays} 天读完${
                        expectedDays > 0
                          ? `，预计 ${planTargetDate({ ...editor, total: totalPages, dailyTarget: dailyPages })}`
                          : ''
                      }`
                    : `按每次 ${dailyPages} 页，大概 ${expectedDays} 次读完`}
                </p>
              </>
            ) : editorPreset === 'early' ? (
              <>
                <div className="plan-field-row">
                  <label className="plan-field">
                    <span>几点前睡</span>
                    <input
                      className="plan-input"
                      type="time"
                      value={editor.sleepTime || '23:00'}
                      onChange={(e) => patchEditor({ sleepTime: e.target.value })}
                    />
                  </label>
                  <label className="plan-field">
                    <span>几点起</span>
                    <input
                      className="plan-input"
                      type="time"
                      value={editor.wakeTime || '07:00'}
                      onChange={(e) => patchEditor({ wakeTime: e.target.value })}
                    />
                  </label>
                </div>
                <p className="plan-form-hint">
                  到点只提醒一次，做到了就打卡。比起“必须睡着”，先把灯关掉也算开始。
                </p>
              </>
            ) : editorPreset === 'fitness' || editorPreset === 'discipline' ? (
              <>
                <div className="plan-field-row">
                  <label className="plan-field">
                    <span>{editorFrequency === 'daily' ? '每天做几组' : '每次做几组'}</span>
                    <input
                      className="plan-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={99}
                      value={editor.dailyTarget}
                      onChange={(e) => patchEditor({ dailyTarget: Number(e.target.value) })}
                    />
                  </label>
                  <label className="plan-field">
                    <span>每组几个</span>
                    <input
                      className="plan-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={999}
                      value={editor.reps ?? ''}
                      placeholder="比如 12"
                      onChange={(e) => patchEditor({ reps: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <p className="plan-form-hint">
                  打卡时记录完成的组数，每组 {editor.reps || 0} 个只是给自己的目标，不用一次硬撑。
                </p>
              </>
            ) : editorPreset === 'diet' ? (
              <>
                <div className="plan-field-row">
                  <label className="plan-field">
                    <span>{editorFrequency === 'daily' ? '每天吃几餐' : '每次吃几餐'}</span>
                    <input
                      className="plan-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10}
                      value={editor.dailyTarget}
                      onChange={(e) => patchEditor({ dailyTarget: Number(e.target.value) })}
                    />
                  </label>
                  <label className="plan-field">
                    <span>每餐几分饱</span>
                    <select
                      className="plan-input"
                      value={editor.fullness || '七分饱'}
                      onChange={(e) => patchEditor({ fullness: e.target.value })}
                    >
                      <option>六分饱</option>
                      <option>七分饱</option>
                      <option>八分饱</option>
                      <option>不设目标</option>
                    </select>
                  </label>
                </div>
                <p className="plan-form-hint">
                  按餐记录，不用精确算热量；先做到“停下来时不撑”。
                </p>
              </>
            ) : editorPreset === 'running' || editorPreset === 'fatloss' ? (
              <>
                <label className="plan-field">
                  <span>{editorFrequency === 'daily' ? '每天多少分钟' : '每次多少分钟'}</span>
                  <input
                    className="plan-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={600}
                    value={editor.dailyTarget}
                    placeholder="比如 20"
                    onChange={(e) => patchEditor({ dailyTarget: Number(e.target.value) })}
                  />
                </label>
                <p className="plan-form-hint">
                  {editorPreset === 'running'
                    ? '跑步按分钟记，不用纠结配速；换鞋出门就算开始。'
                    : '减脂按运动分钟记，先稳定，再慢慢加量。'}
                </p>
              </>
            ) : (
              <>
                <div className="plan-field-row">
                  <label className="plan-field">
                    <span>{editorFrequency === 'daily' ? '每天做到多少' : '每次做到多少'}</span>
                    <input
                      className="plan-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={editor.dailyTarget}
                      onChange={(e) => patchEditor({ dailyTarget: Number(e.target.value) })}
                    />
                  </label>
                  <label className="plan-field">
                    <span>单位</span>
                    <input
                      className="plan-input"
                      value={editor.unit || ''}
                      placeholder="个 / 页 / 组"
                      maxLength={4}
                      onChange={(e) => patchEditor({ unit: e.target.value })}
                    />
                  </label>
                </div>
                <label className="plan-field">
                  <span>总共目标（可不填）</span>
                  <input
                    className="plan-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={editor.total ?? ''}
                    placeholder="比如 300，填了会显示总进度"
                    onChange={(e) => patchEditor({ total: Number(e.target.value) })}
                  />
                </label>
                <p className="plan-form-hint">
                  自定义标签也一样：自己设单位、每次做到多少；填了总目标，就会像看书一样显示百分比。
                </p>
              </>
            )}


            <div className="plan-more-block">
              <button
                type="button"
                className={`plan-more ${presetOpen ? 'open' : ''}`}
                onClick={() => {
                  setPresetOpen((value) => !value)
                  if (presetOpen) resetTagInput()
                }}
              >
                <Icon name="plus" size={13} />
                更多
                {(editor.tag || editorPreset !== 'other') && (
                  <span>· {editor.tag || PRESET_LABELS[editorPreset]}</span>
                )}
              </button>
              {presetOpen && (
                <>
                  <div className="plan-preset-grid">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`plan-preset ${!editor.tag && editorPreset === preset.id ? 'on' : ''}`}
                        onClick={() => applyPreset(preset.id)}
                      >
                        <b>{preset.label}</b>
                        <span>{preset.tip}</span>
                      </button>
                    ))}
                    {planTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`plan-preset plan-preset-custom ${editor.tag === tag ? 'on' : ''}`}
                        onClick={() => applyCustomTag(tag)}
                      >
                        <b>{tag}</b>
                        <span>自定义标签</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`plan-preset plan-preset-add ${tagOpen ? 'on' : ''}`}
                      onClick={() => {
                        setTagOpen((value) => !value)
                        setTagError('')
                      }}
                    >
                      <b>＋ 自定义</b>
                      <span>加一个自己的标签</span>
                    </button>
                  </div>
                  {tagOpen && (
                    <div className="plan-tag-form">
                      <input
                        className="plan-input plan-tag-input"
                        value={tagDraft}
                        onChange={(event) => setTagDraft(event.target.value.slice(0, 8))}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void createTag()
                          }
                        }}
                        placeholder="比如：练吉他、背单词"
                        maxLength={8}
                        autoFocus
                      />
                      <button type="button" className="plan-tag-save" onClick={() => void createTag()}>
                        添加
                      </button>
                    </div>
                  )}
                  {tagError && <p className="plan-tag-error">{tagError}</p>}
                </>
              )}
            </div>

            <div className="plan-reminder-row">
              <div>
                <span className="plan-field-label">提醒我</span>
                <p>到点发一条本地通知，只在没完成时提醒。</p>
              </div>
              <button
                type="button"
                className={`plan-toggle ${editor.reminderEnabled ? 'on' : ''}`}
                onClick={() => patchEditor({ reminderEnabled: !editor.reminderEnabled })}
                aria-label="切换计划提醒"
              >
                <span />
              </button>
            </div>
            {editor.reminderEnabled &&
              (editorFrequency === 'daily' ? (
                <label className="plan-time-row">
                  <span>每天</span>
                  <input
                    type="time"
                    className="plan-time"
                    value={editor.reminderTime}
                    onChange={(e) => patchEditor({ reminderTime: e.target.value })}
                  />
                  <span>提醒</span>
                </label>
              ) : editorFrequency === 'weekly' ? (
                <>
                  <div className="plan-weekday-picker">
                    <span>每周哪几天提醒</span>
                    <div className="plan-reminder-days">
                      {PLAN_WEEKDAYS.map((label, day) => {
                        const on = planReminderDays(editor).includes(day)
                        return (
                          <button
                            key={label}
                            type="button"
                            className={`plan-reminder-day ${on ? 'on' : ''}`}
                            onClick={() => toggleReminderDay(day)}
                            aria-label={`每周${label}提醒`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <label className="plan-time-row">
                    <span>提醒时间</span>
                    <input
                      type="time"
                      className="plan-time"
                      value={editor.reminderTime}
                      onChange={(e) => patchEditor({ reminderTime: e.target.value })}
                    />
                    <span>提醒</span>
                  </label>
                </>
              ) : (
                <label className="plan-time-row">
                  <span>每 {editor.intervalDays ?? 2} 天</span>
                  <input
                    type="time"
                    className="plan-time"
                    value={editor.reminderTime}
                    onChange={(e) => patchEditor({ reminderTime: e.target.value })}
                  />
                  <span>提醒</span>
                </label>
              ))}
            <p className="plan-native-note">
              网页版不能后台推送；装成 App 后，会按这个时间发系统通知。
            </p>

            <div className="plan-color-row">
              <span>给它一个颜色</span>
              <div className="plan-color-list">
                {PLAN_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`plan-color ${editor.color === color ? 'on' : ''}`}
                    style={{ background: color }}
                    onClick={() => patchEditor({ color })}
                    aria-label={`颜色${color}`}
                  />
                ))}
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="button" className="btn-primary plan-save" onClick={() => void saveEditor()}>
              保存计划
            </button>

            {plans.some((p) => p.id === editor.id) && (
              <div className="plan-delete-wrap">
                {!confirmDelete ? (
                  <button type="button" className="plan-delete" onClick={() => setConfirmDelete(true)}>
                    删除这个计划
                  </button>
                ) : (
                  <div className="plan-delete-confirm">
                    <span>删除后记录也会一起消失，确定吗？</span>
                    <button
                      type="button"
                      className="plan-delete"
                      onClick={() => {
                        void onDelete(editor.id)
                        setEditorOpen(false)
                      }}
                    >
                      确定删除
                    </button>
                    <button type="button" className="plan-cancel-delete" onClick={() => setConfirmDelete(false)}>
                      再想想
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={checkOpen} onClose={() => setCheckOpen(false)}>
        {checking && (
          <div className="plan-check-form">
            <p className="sheet-eyebrow">Metano · 计划</p>
            <h2>{checking.title}</h2>
            <p className="plan-check-sub">
              {checking.kind === 'reading'
                ? '今天读到第几页？记下页数，进度会自己更新。'
                : `今天完成了多少${checking.unit || '次'}？记下数量，进度会自己更新。`}
            </p>
            <label className="plan-field">
              <span>今天完成了多少{checking.kind === 'reading' ? '页' : checking.unit || '次'}</span>
              <input
                className="plan-input"
                type="number"
                inputMode="numeric"
                min={1}
                value={checkValue}
                onChange={(e) => setCheckValue(e.target.value)}
                autoFocus
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="button" className="btn-primary plan-save" onClick={() => void saveCheck()}>
              {checking.kind === 'reading' ? '记下今天的页数' : '记下今天的数量'}
            </button>
          </div>
        )}
      </Modal>
    </section>
  )
}
