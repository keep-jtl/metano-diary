export const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function formatCn(key: string): string {
  const d = parseKey(key)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function weekdayCn(key: string): string {
  return `周${WEEK_CN[parseKey(key).getDay()]}`
}

export function fullCn(key: string): string {
  const d = parseKey(key)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatDotDate(key: string): string {
  const d = parseKey(key)
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  if (h < 23) return '晚上好'
  return '夜深了'
}

export interface DayCell {
  key: string | null
  day: number | null
}

export function monthGrid(year: number, monthIndex: number): DayCell[] {
  const first = new Date(year, monthIndex, 1)
  const offset = first.getDay()
  const total = new Date(year, monthIndex + 1, 0).getDate()
  const cells: DayCell[] = []
  for (let i = 0; i < offset; i++) cells.push({ key: null, day: null })
  for (let d = 1; d <= total; d++) {
    cells.push({ key: `${year}-${pad2(monthIndex + 1)}-${pad2(d)}`, day: d })
  }
  while (cells.length % 7 !== 0) cells.push({ key: null, day: null })
  return cells
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const d = new Date(year, monthIndex + delta, 1)
  return { year: d.getFullYear(), monthIndex: d.getMonth() }
}

export function isFuture(key: string): boolean {
  return key > dateKey()
}

export function daysAgoLabel(key: string): string {
  const diff = Math.floor(
    (parseKey(dateKey()).getTime() - parseKey(key).getTime()) / 86400000,
  )
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff === 2) return '前天'
  if (diff < 7) return `${diff} 天前`
  return formatCn(key)
}
