import { Solar } from 'lunar-javascript'
import { dateKey, pad2 } from './dates'

export interface LunarDayInfo {
  year: number
  /** 闰月为负数，例如闰六月为 -6 */
  month: number
  day: number
  monthLabel: string
  dayLabel: string
  festival?: string
  display: string
  isMonthStart: boolean
}

const cache = new Map<string, LunarDayInfo>()

export function lunarInfo(key: string): LunarDayInfo {
  const hit = cache.get(key)
  if (hit) return hit
  const [year, month, day] = key.split('-').map(Number)
  const lunar = Solar.fromYmd(year, month, day).getLunar()
  const monthText = `${lunar.getMonthInChinese()}月`
  const dayText = lunar.getDayInChinese()
  const festivals = lunar.getFestivals()
  const festival = festivals[0]
  const isMonthStart = lunar.getDay() === 1
  const info: LunarDayInfo = {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    monthLabel: monthText,
    dayLabel: dayText,
    festival,
    display: festival || (isMonthStart ? monthText : dayText),
    isMonthStart,
  }
  cache.set(key, info)
  return info
}

export function lunarMonthRange(year: number, monthIndex: number): string {
  const first = `${year}-${pad2(monthIndex + 1)}-01`
  const lastDate = new Date(year, monthIndex + 1, 0)
  const last = dateKey(lastDate)
  const labels = [lunarInfo(first).monthLabel, lunarInfo(last).monthLabel]
  return [...new Set(labels)].join(' / ')
}
