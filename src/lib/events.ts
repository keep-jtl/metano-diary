import { Lunar, LunarYear } from 'lunar-javascript'
import { dateKey, pad2, parseKey } from './dates'
import { lunarInfo } from './lunar'
import { lunarMonthName } from './birthday'
import type { BirthdaySetting, CalendarEvent, CalendarEventType, EventRepeat } from '../types'

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  birthday: '生日',
  anniversary: '纪念日',
  special: '特别的日子',
}

export const EVENT_TYPE_HINTS: Record<CalendarEventType, string> = {
  birthday: '前一天和当天各收到一句祝福',
  anniversary: '每年这一天，留个提醒',
  special: '只记这一天，也可以每年重复',
}

export function eventId(): string {
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function defaultEventTitle(type: CalendarEventType): string {
  if (type === 'birthday') return '我的生日'
  if (type === 'anniversary') return '我们的纪念日'
  return '一个特别的日子'
}

export function eventRepeatLabel(event: CalendarEvent): string {
  if (event.repeat === 'once') {
    return event.year ? `仅 ${event.year} 年` : '仅此一天'
  }
  return event.calendar === 'lunar' ? '每年按农历' : '每年按新历'
}

export function eventDateLabel(event: CalendarEvent): string {
  if (event.calendar === 'lunar') {
    return `农历 ${lunarMonthName(event.month)}${dayName(event.day)}`
  }
  return `新历 ${event.month}月${event.day}日`
}

function dayName(day: number): string {
  const names = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
  ]
  return names[Math.max(1, Math.min(30, day)) - 1]
}

function solarKey(year: number, month: number, day: number): string | null {
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return null
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function lunarKey(lunarYear: number, month: number, day: number): string | null {
  const yearObject = LunarYear.fromYear(lunarYear)
  const monthObject = yearObject.getMonth(month)
  if (!monthObject) return null
  const safeDay = Math.min(day, monthObject.getDayCount())
  const lunar = Lunar.fromYmd(lunarYear, month, safeDay)
  const solar = lunar.getSolar()
  return `${solar.getYear()}-${pad2(solar.getMonth())}-${pad2(solar.getDay())}`
}

/** 事件从 from 开始的下一个/下几个公历日期。 */
export function eventOccurrences(event: CalendarEvent, from = dateKey(), count = 2): string[] {
  if (event.repeat === 'once') {
    const key = solarKey(event.year || parseKey(from).getFullYear(), event.month, event.day)
    return key && key >= from ? [key] : []
  }

  const year = parseKey(from).getFullYear()
  const candidates: string[] = []
  if (event.calendar === 'lunar') {
    for (let lunarYear = year - 1; lunarYear <= year + 4; lunarYear++) {
      const key = lunarKey(lunarYear, event.month, event.day)
      if (key) candidates.push(key)
    }
  } else {
    for (let candidateYear = year; candidateYear <= year + 4; candidateYear++) {
      const key = solarKey(candidateYear, event.month, event.day)
      if (key) candidates.push(key)
    }
  }
  return [...new Set(candidates)].filter((key) => key >= from).sort().slice(0, count)
}

export function eventMatchesDate(event: CalendarEvent, key: string): boolean {
  if (event.repeat === 'once') {
    const date = parseKey(key)
    return (
      (event.year || date.getFullYear()) === date.getFullYear() &&
      event.month === date.getMonth() + 1 &&
      event.day === date.getDate()
    )
  }
  if (event.calendar === 'solar') {
    const date = parseKey(key)
    return event.month === date.getMonth() + 1 && event.day === date.getDate()
  }
  const info = lunarInfo(key)
  if (Math.abs(info.month) !== event.month) return false
  if (info.day === event.day) return true
  if (event.day === 30 && info.day < 30) {
    const yearObject = LunarYear.fromYear(info.year)
    const monthObject = yearObject.getMonth(event.month)
    return Boolean(monthObject && monthObject.getDayCount() === info.day)
  }
  return false
}

export function eventsOnDate(events: CalendarEvent[], key: string): CalendarEvent[] {
  return events.filter((event) => eventMatchesDate(event, key))
}

export function birthdayToEvent(birthday: BirthdaySetting): CalendarEvent {
  return {
    id: 'legacy-birthday',
    type: 'birthday',
    title: '我的生日',
    calendar: birthday.calendar,
    month: birthday.month,
    day: birthday.day,
    repeat: 'yearly',
    reminder: true,
    reminderTime: birthday.time || '09:00',
    createdAt: Date.now(),
  }
}

export function eventMatchesBirthdayGreeting(event: CalendarEvent, today = dateKey()): boolean {
  return event.type === 'birthday' && eventMatchesDate(event, today)
}

export function eventRepeatOptions(type: CalendarEventType): EventRepeat {
  return type === 'special' ? 'once' : 'yearly'
}
