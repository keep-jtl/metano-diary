import type { Entry, MoodId } from '../types'
import { MOOD_BY_ID } from './moods'

const SYNONYMS: Record<string, string[]> = {
  难过: ['伤心', '低落', 'emo', '委屈', '不高兴', '郁闷'],
  开心: ['高兴', '快乐', '愉快', '幸福', '爽'],
  焦虑: ['紧张', '压力', '担心', '慌', '内耗'],
  累: ['疲惫', '疲劳', '困', '没力气'],
  生气: ['愤怒', '火大', '烦', '气死'],
  朋友: ['同学', '室友', '伙伴'],
  吃饭: ['午饭', '晚饭', '早饭', '食堂', '外卖'],
  学习: ['上课', '复习', '作业', '考试'],
  工作: ['项目', '任务', '加班', '实习'],
  睡觉: ['睡眠', '失眠', '熬夜', '困'],
}

export function expandTerms(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = new Set<string>([q])
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (q.includes(key)) {
      terms.add(key)
      values.forEach((v) => terms.add(v))
    }
  }
  return [...terms].sort((a, b) => b.length - a.length)
}

export interface SearchFilters {
  mood?: MoodId | 'all'
  l1?: string | 'all'
  dateFrom?: string
  dateTo?: string
}

export function searchEntries(
  entries: Entry[],
  query: string,
  filters: SearchFilters = {},
): Entry[] {
  const terms = expandTerms(query)
  const moodFilter = filters.mood || 'all'
  const l1Filter = filters.l1 || 'all'
  const dateFrom = filters.dateFrom || ''
  const dateTo = filters.dateTo || ''

  const scored: { entry: Entry; score: number }[] = []

  for (const entry of entries) {
    if (moodFilter !== 'all' && entry.mood !== moodFilter) continue
    if (l1Filter !== 'all' && entry.category.l1 !== l1Filter) continue
    if (dateFrom && entry.date < dateFrom) continue
    if (dateTo && entry.date > dateTo) continue

    if (terms.length === 0) {
      scored.push({ entry, score: 0 })
      continue
    }

    const hay = [
      entry.text,
      entry.category.l1,
      entry.category.l2 || '',
      MOOD_BY_ID[entry.mood]?.label || '',
    ]
      .join(' ')
      .toLowerCase()

    let score = 0
    for (const term of terms) {
      if (hay.includes(term)) score += term.length
    }
    if (score > 0) scored.push({ entry, score })
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.entry.date.localeCompare(a.entry.date)
  })

  return scored.map((s) => s.entry)
}

export function snippet(text: string, terms: string[], around = 34): string {
  if (!text) return ''
  if (terms.length === 0) {
    return text.length > around * 2 ? text.slice(0, around * 2) + '…' : text
  }
  const lower = text.toLowerCase()
  let pos = -1
  for (const term of terms) {
    const idx = lower.indexOf(term)
    if (idx !== -1 && (pos === -1 || idx < pos)) pos = idx
  }
  if (pos === -1) {
    return text.length > around * 2 ? text.slice(0, around * 2) + '…' : text
  }
  const start = Math.max(0, pos - around)
  const end = Math.min(text.length, pos + around)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}
