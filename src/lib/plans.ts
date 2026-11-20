import type { Plan, PlanFrequency } from '../types'
import { dateKey, formatDotDate, pad2, parseKey } from './dates'

export const PLAN_COLORS = [
  '#F2C94C',
  '#F2994A',
  '#56CC9D',
  '#7FB3E8',
  '#B79CE0',
  '#E88A8A',
  '#8FCBB8',
  '#D6C7A8',
]

export const PLAN_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
export const PLAN_DEFAULT_REMINDER_DAYS = [1, 3, 5]

export function addDays(key: string, delta: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86400000)
}

export function planFrequency(plan: Plan): PlanFrequency {
  return plan.frequency === 'weekly' || plan.frequency === 'custom' ? plan.frequency : 'daily'
}

export function planMinutes(plan: Plan): number {
  return Math.max(0, Number(plan.minutes) || 0)
}

export function planWeeklyTarget(plan: Plan): number {
  return Math.min(7, Math.max(1, Number(plan.weeklyTarget) || 3))
}

export function planIntervalDays(plan: Plan): number {
  return Math.min(30, Math.max(2, Number(plan.intervalDays) || 2))
}

export function planReminderDays(plan: Plan): number[] {
  const source = Array.isArray(plan.reminderDays) ? plan.reminderDays : []
  const clean = [...new Set(source)]
    .map((value) => Math.round(Number(value)))
    .filter((value) => value >= 0 && value <= 6)
    .sort((a, b) => a - b)
  return clean.length > 0 ? clean : PLAN_DEFAULT_REMINDER_DAYS
}

export function planPages(plan: Plan): number {
  return Object.values(plan.logs).reduce((sum, value) => sum + (Number(value) || 0), 0)
}

export function planDaysDone(plan: Plan): number {
  return Object.values(plan.logs).filter((value) => Number(value) > 0).length
}

export function planDoneToday(plan: Plan, today = dateKey()): boolean {
  const value = Number(plan.logs[today] || 0)
  return value >= Math.max(1, Number(plan.dailyTarget) || 1)
}

export function planComplete(plan: Plan): boolean {
  if (!plan.total) return false
  return planPages(plan) >= plan.total
}

export function planPercent(plan: Plan, today = dateKey()): number {
  if (plan.total) {
    return Math.max(0, Math.min(100, Math.round((planPages(plan) / plan.total) * 100)))
  }
  if (planFrequency(plan) === 'weekly') {
    return Math.max(
      0,
      Math.min(100, Math.round((planWeekCount(plan, today) / planWeeklyTarget(plan)) * 100)),
    )
  }
  return 0
}

export function planStreak(plan: Plan, today = dateKey()): number {
  let cursor = today
  if (Number(plan.logs[cursor] || 0) <= 0) cursor = addDays(cursor, -1)
  let count = 0
  while (Number(plan.logs[cursor] || 0) > 0) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

export function planWeek(plan: Plan, today = dateKey(), days = 7): { key: string; label: string; done: boolean }[] {
  const result: { key: string; label: string; done: boolean }[] = []
  const start = addDays(today, -(days - 1))
  for (let i = 0; i < days; i++) {
    const key = addDays(start, i)
    const d = parseKey(key)
    result.push({
      key,
      label: PLAN_WEEKDAYS[d.getDay()],
      done: Number(plan.logs[key] || 0) > 0,
    })
  }
  return result
}

export function planWeekCount(plan: Plan, today = dateKey()): number {
  const d = parseKey(today)
  const weekStart = addDays(today, -d.getDay())
  let count = 0
  for (let i = 0; i < 7; i++) {
    if (Number(plan.logs[addDays(weekStart, i)] || 0) > 0) count += 1
  }
  return count
}

export function planWeeklyDoneOn(plan: Plan, key: string): boolean {
  return planFrequency(plan) === 'weekly' && planWeekCount(plan, key) >= planWeeklyTarget(plan)
}

export function planWeeklyDone(plan: Plan, today = dateKey()): boolean {
  return planWeeklyDoneOn(plan, today)
}

export function planExpectedDays(plan: Plan): number {
  if (plan.kind !== 'reading' || !plan.total) return 0
  return Math.max(1, Math.ceil(plan.total / Math.max(1, plan.dailyTarget)))
}

export function planExpectedSessions(plan: Plan): number {
  if (plan.kind !== 'reading' || !plan.total) return 0
  return Math.max(1, Math.ceil(plan.total / Math.max(1, plan.dailyTarget)))
}

export function planTargetDate(plan: Plan): string {
  if (plan.kind !== 'reading') return ''
  return formatDotDate(addDays(plan.startDate, planExpectedDays(plan) - 1))
}

export function planSubtitle(plan: Plan): string {
  if (plan.kind === 'reading') {
    if (planFrequency(plan) === 'daily') {
      return `每天 ${plan.dailyTarget} 页 · 预计 ${planExpectedDays(plan)} 天读完`
    }
    return `每次 ${plan.dailyTarget} 页 · 预计 ${planExpectedSessions(plan)} 次读完`
  }

  const preset = plan.preset || 'other'
  if (preset === 'early') {
    const base = `${plan.sleepTime || '23:00'} 前睡 · ${plan.wakeTime || '07:00'} 前起`
    if (planFrequency(plan) === 'weekly') return `每周 ${planWeeklyTarget(plan)} 次 · ${base}`
    if (planFrequency(plan) === 'custom') return `每 ${planIntervalDays(plan)} 天一次 · ${base}`
    return `每天 ${base}`
  }
  if (preset === 'fitness' || preset === 'discipline') {
    const reps = Math.max(0, Number(plan.reps) || 0)
    if (!reps && plan.unit === '次' && planMinutes(plan) > 0) {
      return `每天做到 ${planMinutes(plan)} 分钟`
    }
    const base = `${plan.dailyTarget} 组${reps > 0 ? ` · 每组 ${reps} 个` : ''}`
    if (planFrequency(plan) === 'weekly') return `每周 ${planWeeklyTarget(plan)} 次 · 每次 ${base}`
    if (planFrequency(plan) === 'custom') return `每 ${planIntervalDays(plan)} 天一次 · 每次 ${base}`
    return `每天 ${base}`
  }
  if (preset === 'diet') {
    const base = `${plan.dailyTarget} 餐${plan.fullness ? ` · 每餐 ${plan.fullness}` : ''}`
    if (planFrequency(plan) === 'weekly') return `每周 ${planWeeklyTarget(plan)} 次 · 每次 ${base}`
    if (planFrequency(plan) === 'custom') return `每 ${planIntervalDays(plan)} 天一次 · 每次 ${base}`
    return `每天 ${base}`
  }

  const unit = plan.unit || '次'
  const target = Math.max(1, Number(plan.dailyTarget) || 1)
  const base = `${target} ${unit}`
  if (planFrequency(plan) === 'weekly') return `每周 ${planWeeklyTarget(plan)} 次 · 每次 ${base}`
  if (planFrequency(plan) === 'custom') return `每 ${planIntervalDays(plan)} 天一次 · 每次 ${base}`
  return `每天 ${base}`
}

export function planReminderDaysLabel(plan: Plan): string {
  return planReminderDays(plan).map((day) => PLAN_WEEKDAYS[day]).join('、')
}

export function planReminderLabel(plan: Plan): string {
  if (!plan.reminderEnabled) return '提醒关着'
  const freq = planFrequency(plan)
  if (freq === 'weekly') return `每周${planReminderDaysLabel(plan)} ${plan.reminderTime}`
  if (freq === 'custom') return `每 ${planIntervalDays(plan)} 天 ${plan.reminderTime}`
  return `每天 ${plan.reminderTime}`
}

export function planDueOnDate(plan: Plan, key: string): boolean {
  const freq = planFrequency(plan)
  if (freq === 'daily') return true
  if (freq === 'weekly') return planReminderDays(plan).includes(parseKey(key).getDay())
  const offset = daysBetween(plan.startDate, key)
  return offset >= 0 && offset % planIntervalDays(plan) === 0
}
