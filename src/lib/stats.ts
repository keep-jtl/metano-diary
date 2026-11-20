import type { Entry, MoodId } from '../types'
import { MOODS } from './moods'
import { isNoiseWord, segmentWords } from './classify'
import { dateKey, parseKey } from './dates'

export function calcStreak(entries: Entry[]): number {
  const dates = new Set(entries.map((e) => e.date))
  let cursor = parseKey(dateKey())
  if (!dates.has(dateKey(cursor))) {
    cursor = new Date(cursor.getTime() - 86400000)
  }
  let streak = 0
  while (dates.has(dateKey(cursor)) && streak < 4000) {
    streak += 1
    cursor = new Date(cursor.getTime() - 86400000)
  }
  return streak
}

export function countByMood(entries: Entry[]): Record<MoodId, number> {
  const result = {} as Record<MoodId, number>
  for (const m of MOODS) result[m.id] = 0
  for (const e of entries) result[e.mood] = (result[e.mood] || 0) + 1
  return result
}

export function countByCategory(entries: Entry[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const e of entries) {
    result[e.category.l1] = (result[e.category.l1] || 0) + 1
  }
  return result
}

export interface CloudWord {
  word: string
  count: number
}

export interface CategoryBucket {
  name: string
  count: number
  percent: number
  subs: { name: string; count: number }[]
  keywords: CloudWord[]
}

export interface MacroBucket {
  name: string
  count: number
  percent: number
  subs: { name: string; count: number }[]
  keywords: CloudWord[]
}

const MACRO_MAP: Record<string, string> = {
  学习成长: '学习',
  工作项目: '工作/事业',
  计划目标: '工作/事业',
  生活日常: '生活',
  身体健康: '生活',
  兴趣娱乐: '生活',
  情绪心情: '生活',
  人际社交: '人际',
  其他: '其他',
}

const MACRO_ORDER = ['生活', '学习', '工作/事业', '人际', '其他']

export function keywordCloud(entries: Entry[], limit = 28): CloudWord[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const content = [entry.text, entry.progress].filter(Boolean).join(' ')
    for (const raw of segmentWords(content)) {
      const word = raw.trim()
      if (word.length < 2 || word.length > 8) continue
      if (isNoiseWord(word)) continue
      if (/^\d+$/.test(word)) continue
      if (!/[\u4e00-\u9fa5a-zA-Z]/.test(word)) continue
      counts.set(word, (counts.get(word) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}

/** 回顾页：先按一级大类聚合，再带上二级细分和该类自己的关键词 */
export function categoryBreakdown(entries: Entry[], keywordLimit = 6): CategoryBucket[] {
  const groups = new Map<
    string,
    { count: number; subs: Map<string, number>; entries: Entry[] }
  >()

  for (const entry of entries) {
    const name = entry.category.l1 || '其他'
    let group = groups.get(name)
    if (!group) {
      group = { count: 0, subs: new Map(), entries: [] }
      groups.set(name, group)
    }
    group.count += 1
    group.entries.push(entry)
    const sub = (entry.category.l2 || '').trim() || '未细分'
    group.subs.set(sub, (group.subs.get(sub) || 0) + 1)
  }

  const total = entries.length
  return [...groups.entries()]
    .map(([name, group]) => ({
      name,
      count: group.count,
      percent: total > 0 ? Math.round((group.count / total) * 100) : 0,
      subs: [...group.subs.entries()]
        .map(([subName, count]) => ({ name: subName, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      keywords: keywordCloud(group.entries, keywordLimit),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** 把 8 个一级类再收成回顾页用的 5 个大类 */
export function macroBreakdown(buckets: CategoryBucket[]): MacroBucket[] {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const groups = new Map<
    string,
    { count: number; subs: Map<string, number>; words: Map<string, number> }
  >()

  for (const bucket of buckets) {
    const name = MACRO_MAP[bucket.name] || '其他'
    let group = groups.get(name)
    if (!group) {
      group = { count: 0, subs: new Map(), words: new Map() }
      groups.set(name, group)
    }
    group.count += bucket.count
    for (const sub of bucket.subs) {
      group.subs.set(sub.name, (group.subs.get(sub.name) || 0) + sub.count)
    }
    for (const word of bucket.keywords) {
      group.words.set(word.word, (group.words.get(word.word) || 0) + word.count)
    }
  }

  return MACRO_ORDER.filter((name) => groups.has(name)).map((name) => {
    const group = groups.get(name)!
    return {
      name,
      count: group.count,
      percent: total > 0 ? Math.round((group.count / total) * 100) : 0,
      subs: [...group.subs.entries()]
        .map(([subName, count]) => ({ name: subName, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      keywords: [...group.words.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word, count]) => ({ word, count })),
    }
  })
}

export function onThisDay(entries: Entry[], today: string): Entry[] {
  const suffix = today.slice(5)
  const currentYear = today.slice(0, 4)
  return entries
    .filter((e) => e.date.slice(5) === suffix && e.date.slice(0, 4) !== currentYear)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function randomEntry(entries: Entry[], excludeDate?: string): Entry | null {
  const pool = entries.filter((e) => e.date !== excludeDate)
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export interface WeeklyReviewData {
  entries: Entry[]
  count: number
  startKey: string
  moodCounts: Record<MoodId, number>
  topMood: MoodId | null
  categories: { name: string; count: number }[]
  progressEntries: Entry[]
  keywords: CloudWord[]
}

export function weeklyReview(entries: Entry[], today: string): WeeklyReviewData {
  const date = parseKey(today)
  const offset = (date.getDay() + 6) % 7
  const start = new Date(date.getTime() - offset * 86400000)
  const startKey = dateKey(start)

  const weekEntries = entries
    .filter((e) => e.date >= startKey && e.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))

  const moodCounts = countByMood(weekEntries)
  let topMood: MoodId | null = null
  let topCount = 0
  for (const m of MOODS) {
    if (moodCounts[m.id] > topCount) {
      topCount = moodCounts[m.id]
      topMood = m.id
    }
  }

  const catCounts = countByCategory(weekEntries)
  const categories = Object.entries(catCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return {
    entries: weekEntries,
    count: weekEntries.length,
    startKey,
    moodCounts,
    topMood,
    categories,
    progressEntries: weekEntries.filter((e) => (e.progress || '').trim()),
    keywords: keywordCloud(weekEntries, 10),
  }
}
