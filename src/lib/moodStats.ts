import type { Entry, MoodId } from '../types'
import { ALL_MOODS, moodById } from './moods'
import { dateKey, parseKey } from './dates'

export type MoodTone = 'positive' | 'neutral' | 'negative'
export type MoodRange = 'month' | 'quarter' | 'year' | 'all'

const POSITIVE = new Set<MoodId>([
  'happy',
  'excited',
  'great',
  'good',
  'flutter',
  'loved',
  'laugh',
  'wink',
  'shy',
  'joy',
  'joyful',
  'delight',
  'expect',
  'peace',
  'blush',
  'hehe',
  'chuckle',
  'kiss',
  'wow',
  'hyper',
  'daze',
])

const NEGATIVE = new Set<MoodId>([
  'sad',
  'anxious',
  'angry',
  'tired',
  'worry',
  'blue',
  'hmph',
  'sleepy',
  'furious',
  'decayed',
  'madcute',
  'startled',
  'almostcry',
  'speechless',
  'sulk',
  'gloom',
  'sideeye',
  'aggrieved',
  'shock',
  'awkward',
  'horror',
])

export function moodTone(id: MoodId): MoodTone {
  if (POSITIVE.has(id)) return 'positive'
  if (NEGATIVE.has(id)) return 'negative'
  return 'neutral'
}

export function toneLabel(tone: MoodTone): string {
  if (tone === 'positive') return '明亮'
  if (tone === 'negative') return '低落'
  return '平稳'
}

export interface MoodCount {
  id: MoodId
  label: string
  color: string
  count: number
  percent: number
}

export interface MoodStatsResult {
  total: number
  days: number
  positive: number
  neutral: number
  negative: number
  positivePercent: number
  neutralPercent: number
  negativePercent: number
  score: number
  top: MoodCount[]
  allCounts: MoodCount[]
  dominant?: MoodCount
  positiveShare: number
}

function rangeStart(range: MoodRange, today: string): string | null {
  if (range === 'all') return null
  const days = range === 'month' ? 30 : range === 'quarter' ? 90 : 365
  const d = parseKey(today)
  d.setDate(d.getDate() - (days - 1))
  return dateKey(d)
}

export function computeMoodStats(
  entries: Entry[],
  range: MoodRange = 'all',
  today: string = dateKey(),
): MoodStatsResult {
  const start = rangeStart(range, today)
  const scoped = start ? entries.filter((entry) => entry.date >= start && entry.date <= today) : entries
  const total = scoped.length

  let positive = 0
  let neutral = 0
  let negative = 0
  const counts: Record<string, number> = {}

  for (const entry of scoped) {
    const tone = moodTone(entry.mood)
    if (tone === 'positive') positive += 1
    else if (tone === 'negative') negative += 1
    else neutral += 1
    counts[entry.mood] = (counts[entry.mood] || 0) + 1
  }

  const allCounts: MoodCount[] = ALL_MOODS.map((mood) => {
    const count = counts[mood.id] || 0
    return {
      id: mood.id,
      label: mood.label,
      color: mood.color,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    }
  })

  const top = allCounts
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'))
    .slice(0, 10)

  const score = total ? Math.round(((positive * 2 + neutral * 1) / (total * 2)) * 1000) : 0
  const first = entries
    .map((entry) => entry.date)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))[0]
  const days = first
    ? Math.max(1, Math.floor((parseKey(today).getTime() - parseKey(first).getTime()) / 86400000) + 1)
    : 0

  return {
    total,
    days,
    positive,
    neutral,
    negative,
    positivePercent: total ? Math.round((positive / total) * 100) : 0,
    neutralPercent: total ? Math.round((neutral / total) * 100) : 0,
    negativePercent: total ? Math.round((negative / total) * 100) : 0,
    score,
    top,
    allCounts,
    dominant: top[0],
    positiveShare: total ? positive / total : 0,
  }
}

export function moodIndexCopy(stats: MoodStatsResult): string {
  if (stats.total === 0) return '还没有日记，写下第一篇就能看见心情的样子。'
  if (stats.positiveShare >= 0.6) return '最近心情不错，要继续保持哦！'
  if (stats.positiveShare >= 0.4) return '整体还算平稳，偶尔也有发光的时候。'
  if (stats.negative > stats.positive) return '最近有点辛苦，先照顾好自己，再慢慢来。'
  return '情绪来来回回，能记下来就已经很好了。'
}

export function topMoodOf(entries: Entry[]): MoodCount | undefined {
  const stats = computeMoodStats(entries, 'all')
  return stats.top[0]
}

export function moodLabel(id: MoodId): string {
  return moodById(id).label
}
