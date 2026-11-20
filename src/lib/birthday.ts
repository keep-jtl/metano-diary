import { Lunar, LunarYear } from 'lunar-javascript'
import type { BirthdaySetting } from '../types'
import { dateKey, formatDotDate, fullCn, pad2, parseKey } from './dates'
import { lunarInfo } from './lunar'

export const LUNAR_MONTH_OPTIONS = [
  { value: 1, label: '正月' },
  { value: 2, label: '二月' },
  { value: 3, label: '三月' },
  { value: 4, label: '四月' },
  { value: 5, label: '五月' },
  { value: 6, label: '六月' },
  { value: 7, label: '七月' },
  { value: 8, label: '八月' },
  { value: 9, label: '九月' },
  { value: 10, label: '十月' },
  { value: 11, label: '冬月' },
  { value: 12, label: '腊月' },
]

const LUNAR_DAY_NAMES = [
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十',
]

export function lunarDayName(day: number): string {
  return LUNAR_DAY_NAMES[Math.max(1, Math.min(30, day)) - 1]
}

export function lunarMonthName(month: number): string {
  return LUNAR_MONTH_OPTIONS.find((item) => item.value === month)?.label || `${month}月`
}

export function addDays(key: string, delta: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + delta)
  return dateKey(d)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86400000)
}

export function birthdayLabel(birthday: BirthdaySetting): string {
  if (birthday.calendar === 'lunar') {
    return `农历 ${lunarMonthName(birthday.month)}${lunarDayName(birthday.day)}`
  }
  return `新历 ${birthday.month}月${birthday.day}日`
}

export function birthdaySubLabel(birthday: BirthdaySetting): string {
  return birthday.calendar === 'lunar' ? '每年按农历过' : '每年按新历过'
}

function solarBirthdayInYear(birthday: BirthdaySetting, year: number): string | null {
  const daysInMonth = new Date(year, birthday.month, 0).getDate()
  if (birthday.day > daysInMonth) return null
  return `${year}-${pad2(birthday.month)}-${pad2(birthday.day)}`
}

function lunarBirthdayInYear(birthday: BirthdaySetting, lunarYear: number): string | null {
  const yearObject = LunarYear.fromYear(lunarYear)
  const monthObject = yearObject.getMonth(birthday.month)
  if (!monthObject) return null
  const day = Math.min(birthday.day, monthObject.getDayCount())
  const lunar = Lunar.fromYmd(lunarYear, birthday.month, day)
  const solar = lunar.getSolar()
  return `${solar.getYear()}-${pad2(solar.getMonth())}-${pad2(solar.getDay())}`
}

/**
 * 返回从 from 开始的下一个/下两个生日（按公历日期字符串）。
 * 农历生日会换算成当年对应的公历日期；农历三十遇到小月时按当月最后一天过。
 */
export function upcomingBirthdays(
  birthday: BirthdaySetting,
  count = 2,
  from = dateKey(),
): string[] {
  const year = parseKey(from).getFullYear()
  const candidates: string[] = []
  if (birthday.calendar === 'lunar') {
    for (let lunarYear = year - 1; lunarYear <= year + 3; lunarYear++) {
      const key = lunarBirthdayInYear(birthday, lunarYear)
      if (key) candidates.push(key)
    }
  } else {
    for (let candidateYear = year; candidateYear <= year + 3; candidateYear++) {
      const key = solarBirthdayInYear(birthday, candidateYear)
      if (key) candidates.push(key)
    }
  }
  return [...new Set(candidates)]
    .filter((key) => key >= from)
    .sort()
    .slice(0, count)
}

export function nextBirthday(birthday: BirthdaySetting, from = dateKey()): string | null {
  return upcomingBirthdays(birthday, 1, from)[0] || null
}

export function birthdayCountdown(birthday: BirthdaySetting, today = dateKey()): string {
  const next = nextBirthday(birthday, today)
  if (!next) return ''
  const days = daysBetween(today, next)
  if (days === 0) return '今天就是你的生日'
  if (days === 1) return '明天就是你的生日'
  return `下次 ${formatDotDate(next)} · 还有 ${days} 天`
}

export function isBirthdayOn(key: string, birthday?: BirthdaySetting): boolean {
  if (!birthday) return false
  if (birthday.calendar === 'solar') {
    const date = parseKey(key)
    return date.getMonth() + 1 === birthday.month && date.getDate() === birthday.day
  }
  const info = lunarInfo(key)
  const monthMatch = Math.abs(info.month) === birthday.month
  if (!monthMatch) return false
  if (info.day === birthday.day) return true
  if (birthday.day === 30 && info.day < 30) {
    const yearObject = LunarYear.fromYear(info.year)
    const monthObject = yearObject.getMonth(birthday.month)
    return Boolean(monthObject && monthObject.getDayCount() === info.day)
  }
  return false
}

export function birthdayGreeting(birthday?: BirthdaySetting, today = dateKey()): string {
  if (!birthday) return ''
  if (isBirthdayOn(today, birthday)) return '今天是你的生日，生日快乐。'
  if (isBirthdayOn(addDays(today, 1), birthday)) return '明天是你的生日，提前一天祝你生日快乐。'
  return ''
}

export function birthdayNextLabel(birthday: BirthdaySetting, today = dateKey()): string {
  const next = nextBirthday(birthday, today)
  return next ? fullCn(next) : ''
}
