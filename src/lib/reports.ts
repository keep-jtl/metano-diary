import type {
  CalendarEvent,
  Entry,
  ReportMonthPoint,
  ReportSection,
  ReportSnapshot,
} from '../types'
import { computeMoodStats, moodTone } from './moodStats'
import { dateKey, fullCn, pad2, parseKey } from './dates'
import { eventsOnDate } from './events'

function periodDay(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function monthBounds(monthKey: string): { start: string; end: string; label: string } {
  const [year, month] = monthKey.split('-').map(Number)
  return {
    start: periodDay(year, month, 1),
    end: periodDay(year, month, new Date(year, month, 0).getDate()),
    label: `${year}年${month}月`,
  }
}

function yearBounds(year: number): { start: string; end: string; label: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: `${year}年`,
  }
}

function scopedEntries(entries: Entry[], start: string, end: string): Entry[] {
  return entries.filter((entry) => entry.date >= start && entry.date <= end)
}

function uniqueDays(entries: Entry[]): number {
  return new Set(entries.map((entry) => entry.date)).size
}

function topSentence(top: ReportSnapshot['top']): string {
  if (!top.length) return '这个时期还没有明显的心情形状。'
  if (top.length === 1) return `出现最多的是「${top[0].label}」，${top[0].count} 次。`
  return `出现最多的是「${top[0].label}」（${top[0].count} 次），其次是「${top[1].label}」。`
}

function toneSentence(positivePercent: number, neutralPercent: number, negativePercent: number): string {
  return `明亮 ${positivePercent}% · 平稳 ${neutralPercent}% · 低落 ${negativePercent}%`
}

function pickQuote(entries: Entry[]): string | undefined {
  const candidates = entries.filter((entry) => entry.text.trim().length >= 10 && moodTone(entry.mood) !== 'negative')
  if (!candidates.length) return undefined
  const positive = candidates.filter((entry) => moodTone(entry.mood) === 'positive')
  const pool = positive.length ? positive : candidates
  const chosen = pool.slice().sort((a, b) => b.text.trim().length - a.text.trim().length)[0]
  let text = chosen.text.replace(/\s+/g, ' ').trim()
  if (text.length > 96) text = `${text.slice(0, 96).trimEnd()}…`
  return text
}

function monthlyPoints(entries: Entry[], year: number): ReportMonthPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const start = periodDay(year, month, 1)
    const end = periodDay(year, month, new Date(year, month, 0).getDate())
    const scoped = scopedEntries(entries, start, end)
    const stats = computeMoodStats(scoped, 'all', end)
    return { month, total: stats.total, score: stats.score }
  })
}

function monthlyHeadline(positiveShare: number, negative: number, positive: number, total: number): string {
  if (total === 0) return '这个月，先留一页空白。'
  if (positiveShare >= 0.65) return '这个月，你常常在发光。'
  if (positiveShare >= 0.4) return '这个月，平稳里也有小小的亮。'
  if (negative > positive) return '这个月有点沉，但你还是走过来了。'
  return '这个月，日子有自己的节奏。'
}

function monthlyCare(positiveShare: number, negative: number, positive: number, total: number): string {
  if (total === 0) return '这个月没有留下日记，但日子本身也值得被轻轻翻过。下个月想写的时候，我还在。'
  if (total <= 2) return '这个月你写得不多。留白不是缺席，有些日子只是安静地过去了。'
  if (negative > positive) {
    return '低落出现得比明亮多。别急着把自己拉起来，先允许自己慢一点。你已经在记录了，这就是一种照顾。'
  }
  if (positiveShare >= 0.6) {
    return '你把这个月的明亮留了下来。下个月不一定要更好，能继续看见自己就很好。'
  }
  return '日子大多是平稳的，偶尔有一点起伏。你没有把情绪丢在一边，而是把它们收进了这里。'
}

function monthlyInvitation(topMood?: string): string {
  if (topMood === 'happy' || topMood === 'excited' || topMood === 'calm') {
    return '在心情亮起来的那天，多写一句“为什么”'
  }
  if (topMood === 'sad' || topMood === 'anxious' || topMood === 'tired' || topMood === 'angry') {
    return '在低落的那天，先喝一杯水，再写一句话'
  }
  return '挑一个普通的日子，记下一件值得记住的小事'
}

function buildMonthReport(entries: Entry[], monthKey: string): ReportSnapshot {
  const bounds = monthBounds(monthKey)
  const scoped = scopedEntries(entries, bounds.start, bounds.end)
  const stats = computeMoodStats(scoped, 'all', bounds.end)
  const total = stats.total
  const days = uniqueDays(scoped)
  const top = stats.top.slice(0, 3)
  const quote = pickQuote(scoped)
  const headline = monthlyHeadline(stats.positiveShare, stats.negative, stats.positive, total)
  const sections: ReportSection[] = [
    {
      title: '这个月的底色',
      body: total
        ? `${toneSentence(stats.positivePercent, stats.neutralPercent, stats.negativePercent)}。${topSentence(top)}`
        : '这个月没有留下日记，所以没有心情比例。空白也算一种记录。',
    },
    {
      title: '写下来的痕迹',
      body: total
        ? `你在 ${days} 天里写下了 ${total} 篇。${
            quote ? '有一句话，我替你留在了下面。' : '有些日子不需要被解释，写下来就已经很好。'
          }`
        : '这个月这里很安静。下一次想写的时候，不用准备什么，打开就好。',
    },
    {
      title: '想对你说',
      body: monthlyCare(stats.positiveShare, stats.negative, stats.positive, total),
    },
    {
      title: '下个月，一件小事',
      body: `如果愿意，下个月给自己留一个很小的约定：${monthlyInvitation(top[0]?.id)}。不用做到，想起来就好。`,
    },
  ]

  return {
    id: `month:${monthKey}`,
    kind: 'month',
    kicker: 'Metano · 月报',
    title: `${bounds.label} · 月报`,
    headline,
    intro: total
      ? `${bounds.label}过去了。你留下了 ${total} 篇日记，分布在 ${days} 天里。`
      : `${bounds.label}过去了。这个月没有留下日记，但日子本身也值得被轻轻翻过。`,
    periodStart: bounds.start,
    periodEnd: bounds.end,
    periodLabel: bounds.label,
    generatedAt: Date.now(),
    total,
    days,
    score: stats.score,
    positivePercent: stats.positivePercent,
    neutralPercent: stats.neutralPercent,
    negativePercent: stats.negativePercent,
    top,
    quote,
    sections,
  }
}

function yearlyHeadline(positiveShare: number, negative: number, positive: number, total: number): string {
  if (total === 0) return '这一年，先留一页空白。'
  if (positiveShare >= 0.6) return '这一年，你把很多明亮收进了口袋。'
  if (negative > positive) return '这一年不总是轻松，但你没有丢下自己。'
  return '这一年，你在一页一页地认识自己。'
}

function buildYearReport(entries: Entry[], year: number): ReportSnapshot {
  const bounds = yearBounds(year)
  const scoped = scopedEntries(entries, bounds.start, bounds.end)
  const stats = computeMoodStats(scoped, 'all', bounds.end)
  const total = stats.total
  const days = uniqueDays(scoped)
  const top = stats.top.slice(0, 3)
  const quote = pickQuote(scoped)
  const months = monthlyPoints(entries, year)
  const activeMonths = months.filter((point) => point.total > 0)
  const bestMonth = activeMonths.length
    ? activeMonths.slice().sort((a, b) => b.total - a.total || a.month - b.month)[0]
    : undefined
  const quietMonth = activeMonths.length > 1
    ? activeMonths.slice().sort((a, b) => a.total - b.total || a.month - b.month)[0]
    : undefined
  const first = scoped.map((entry) => entry.date).sort()[0]
  const last = scoped.map((entry) => entry.date).sort().slice(-1)[0]
  const sections: ReportSection[] = [
    {
      title: '这一年的心情地图',
      body: total
        ? `${toneSentence(stats.positivePercent, stats.neutralPercent, stats.negativePercent)}。${topSentence(top)}`
        : '这一年没有留下日记，所以没有心情比例。空白也是这一年的一部分。',
    },
    {
      title: bestMonth && quietMonth && bestMonth.month !== quietMonth.month ? '写得最多，也最安静' : '写下来的痕迹',
      body:
        bestMonth && quietMonth && bestMonth.month !== quietMonth.month
          ? `写得最多的是 ${bestMonth.month} 月，${bestMonth.total} 篇；${quietMonth.month} 月最安静，${quietMonth.total} 篇。日子有自己的潮汐，不用每个月都一样。`
          : total
            ? `你在 ${days} 天里写下了 ${total} 篇。能一直回来，本身就很不容易。`
            : '这一年这里很安静。下一次想写的时候，不用准备什么，打开就好。',
    },
    {
      title: '写给你',
      body: total
        ? '这一年不一定事事顺利。有些时候你写得很亮，有些时候只是勉强留下几句。但每一篇都证明：你愿意和自己保持联系。'
        : '这一年你没有写太多。没关系，生活不是每一天都要被记录。你还在，这就很重要。',
    },
    {
      title: '明年',
      body: '新的一年，不用重新做人。带着这一年的你，继续走就好。想写的时候写一句，不想写的时候，我也会在这里。',
    },
  ]

  return {
    id: `year:${year}`,
    kind: 'year',
    kicker: 'Metano · 年报',
    title: `${year}年 · 年报`,
    headline: yearlyHeadline(stats.positiveShare, stats.negative, stats.positive, total),
    intro: total
      ? `从 ${fullCn(first)} 到 ${fullCn(last)}，你留下了 ${total} 篇日记，分布在 ${days} 天里。`
      : `${year}年过去了。这一年没有留下日记，但空白也是这一年的一部分。`,
    periodStart: bounds.start,
    periodEnd: bounds.end,
    periodLabel: bounds.label,
    generatedAt: Date.now(),
    total,
    days,
    score: stats.score,
    positivePercent: stats.positivePercent,
    neutralPercent: stats.neutralPercent,
    negativePercent: stats.negativePercent,
    top,
    months,
    quote,
    sections,
  }
}

function eventPeriodStart(today: string): string {
  const d = parseKey(today)
  d.setDate(d.getDate() - 364)
  return dateKey(d)
}

function eventHeadline(event: CalendarEvent): string {
  if (event.type === 'birthday') return '今天，是你的生日。'
  return `今天是「${event.title}」。`
}

function eventCare(event: CalendarEvent): string {
  if (event.type === 'birthday') {
    return '又长了一岁。你不需要在今天变得更厉害，能走到这里就已经很好了。愿你新的一岁，有地方放软弱，也有东西让你眼睛发亮。'
  }
  if (event.type === 'anniversary') {
    return '有些日子被记住，是因为里面有人。愿你们继续把平凡的日子，过成自己的纪念。'
  }
  return '你把它标成特别的日子，说明它对你很重要。愿这一天，按你喜欢的方式发生。'
}

function eventSmallThing(event: CalendarEvent): string {
  if (event.type === 'birthday') {
    return '如果今天只做一件事，就做一件让自己舒服的事。拍一张照片，或者写一句今天最想留下的话。'
  }
  if (event.type === 'anniversary') {
    return '和这个人一起，留下一张今天的照片，或者一句只有你们懂的话。'
  }
  return '给今天留一个记号：一张照片、一句话，或者只是好好吃一顿饭。'
}

function buildEventReport(entries: Entry[], event: CalendarEvent, today: string): ReportSnapshot {
  const start = eventPeriodStart(today)
  const scoped = scopedEntries(entries, start, today)
  const stats = computeMoodStats(scoped, 'all', today)
  const total = stats.total
  const days = uniqueDays(scoped)
  const top = stats.top.slice(0, 3)
  const quote = pickQuote(scoped)
  const year = today.slice(0, 4)
  const sections: ReportSection[] = [
    {
      title: '这一年的回声',
      body: total
        ? `过去一年，你在 ${days} 天里留下了 ${total} 篇日记。${toneSentence(
            stats.positivePercent,
            stats.neutralPercent,
            stats.negativePercent,
          )}。${topSentence(top)}`
        : '过去一年你没有留下太多日记。没关系，今天可以重新开始一小页。',
    },
    {
      title: '想对你说',
      body: eventCare(event),
    },
    {
      title: '今天，留一件小事',
      body: eventSmallThing(event),
    },
  ]

  return {
    id: eventReportId(event, today),
    kind: 'event',
    kicker: 'Metano · 特别的日子',
    title: `${event.title} · ${year}年`,
    headline: eventHeadline(event),
    intro:
      event.type === 'birthday'
        ? `今天是 ${fullCn(today)}。我把过去一年的回声收成一页，放在这里。不是为了总结你，只是想陪你停一下。`
        : `今天是 ${fullCn(today)}。你把这个日子标成了特别的一天。我把过去一年的回声整理在这里，陪你回看一会儿。`,
    periodStart: start,
    periodEnd: today,
    periodLabel: fullCn(today),
    generatedAt: Date.now(),
    total,
    days,
    score: stats.score,
    positivePercent: stats.positivePercent,
    neutralPercent: stats.neutralPercent,
    negativePercent: stats.negativePercent,
    top,
    quote,
    sections,
    eventType: event.type,
    eventTitle: event.title,
  }
}

export function eventReportId(event: CalendarEvent, today: string): string {
  return `event:${event.id}:${today}`
}

/**
 * 补齐已经结束的月份、年份，以及今天匹配到的特别日子的回顾。
 * 已有的回顾不会重写：它像一张已经收好的纸，保留生成时的样子。
 */
export function ensureReports(
  entries: Entry[],
  events: CalendarEvent[],
  today: string,
  existing: Record<string, ReportSnapshot>,
): Record<string, ReportSnapshot> {
  let next = existing
  const add = (report: ReportSnapshot) => {
    if (next === existing) next = { ...existing }
    next[report.id] = report
  }

  const currentMonth = today.slice(0, 7)
  const monthKeys = [...new Set(entries.map((entry) => entry.date.slice(0, 7)))]
    .filter((key) => key && key < currentMonth)
    .sort()
  for (const key of monthKeys) {
    if (!existing[`month:${key}`]) add(buildMonthReport(entries, key))
  }

  const currentYear = Number(today.slice(0, 4))
  const years = [...new Set(entries.map((entry) => Number(entry.date.slice(0, 4))))]
    .filter((year) => Number.isFinite(year) && year > 1900 && year < currentYear)
    .sort()
  for (const year of years) {
    if (!existing[`year:${year}`]) add(buildYearReport(entries, year))
  }

  for (const event of eventsOnDate(events, today)) {
    const id = eventReportId(event, today)
    if (!existing[id]) add(buildEventReport(entries, event, today))
  }

  return next
}

export function sortedReports(reports: Record<string, ReportSnapshot>): ReportSnapshot[] {
  return Object.values(reports).sort(
    (a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.generatedAt - a.generatedAt,
  )
}
