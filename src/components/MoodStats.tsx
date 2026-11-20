import { useMemo, useState } from 'react'
import type { Entry, ReportSnapshot } from '../types'
import { fullCn, weekdayCn } from '../lib/dates'
import {
  computeMoodStats,
  moodIndexCopy,
  type MoodRange,
} from '../lib/moodStats'
import { sortedReports } from '../lib/reports'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'
import { FullScreenPanel } from './FullScreenPanel'

const RANGE_OPTIONS: { id: MoodRange; label: string }[] = [
  { id: 'month', label: '一个月' },
  { id: 'quarter', label: '三个月' },
  { id: 'year', label: '一年' },
  { id: 'all', label: '全部' },
]

function rangeLabel(range: MoodRange): string {
  if (range === 'month') return '近一个月'
  if (range === 'quarter') return '近三个月'
  if (range === 'year') return '近一年'
  return '全部日记'
}

function reportChipLabel(report: ReportSnapshot): string {
  if (report.kind === 'month') {
    return `${Number(report.periodStart.slice(0, 4))}年${Number(report.periodStart.slice(5, 7))}月`
  }
  if (report.kind === 'year') return report.periodStart.slice(0, 4)
  return report.eventTitle || '特别的日子'
}

export function MoodStatsEntry({ entries, onClick }: { entries: Entry[]; onClick: () => void }) {
  const stats = computeMoodStats(entries, 'month')
  const top = stats.dominant

  return (
    <button type="button" className="mood-stats-entry" onClick={onClick}>
      <span className="mood-stats-entry-icon">
        <Icon name="sparkle" size={21} />
      </span>
      <span className="mood-stats-entry-main">
        <b>心情统计局</b>
        <em>
          {stats.total > 0
            ? `近一个月 ${stats.total} 篇 · ${top ? `${top.label}最多` : '还没有记录'}`
            : '还没有记录，从今天开始留一笔'}
        </em>
      </span>
      <span className="mood-stats-entry-score">{stats.total > 0 ? `${stats.score} 分` : '去看看'}</span>
      <Icon name="right" size={17} />
    </button>
  )
}

export function MoodStats({
  entries,
  today,
  open,
  onClose,
  reports,
  onOpenReport,
}: {
  entries: Entry[]
  today: string
  open: boolean
  onClose: () => void
  reports: Record<string, ReportSnapshot>
  onOpenReport: (id: string) => void
}) {
  const [range, setRange] = useState<MoodRange>('month')
  const stats = useMemo(() => computeMoodStats(entries, range, today), [entries, range, today])
  const allStats = useMemo(() => computeMoodStats(entries, 'all', today), [entries, today])
  const reportList = useMemo(() => sortedReports(reports), [reports])
  const monthReports = reportList.filter((report) => report.kind === 'month')
  const yearReports = reportList.filter((report) => report.kind === 'year')
  const eventReports = reportList.filter((report) => report.kind === 'event')
  const latestMonth = monthReports[0]
  const latestYear = yearReports[0]
  const latestEvent = eventReports[0]
  const olderReports = reportList.filter(
    (report) => report.id !== latestMonth?.id && report.id !== latestYear?.id && report.id !== latestEvent?.id,
  )
  const maxCount = Math.max(1, ...stats.top.map((item) => item.count))
  const firstDate = entries.map((entry) => entry.date).filter(Boolean).sort()[0]

  const pieBackground = stats.total
    ? `conic-gradient(#F58F4B 0 ${stats.positivePercent}%, #7FC4A2 ${stats.positivePercent}% ${
        stats.positivePercent + stats.neutralPercent
      }%, #8FC3E4 ${stats.positivePercent + stats.neutralPercent}% 100%)`
    : 'conic-gradient(#E6DCC8 0 100%)'

  return (
    <FullScreenPanel
      open={open}
      onClose={onClose}
      kicker="在日历里，看见心情的走向"
      title="心情统计局"
      className="mood-stats-screen"
    >
      <section className="stats-hero">
        <div className="stats-hero-faces">
          {['happy', 'excited', 'calm', 'sad', 'tired', 'anxious', 'angry', 'wink'].map((id, index) => (
            <span key={`${id}-${index}`} style={{ zIndex: 8 - index }}>
              <MoodFace mood={id} size={index === 0 ? 58 : 46} />
            </span>
          ))}
        </div>
        <div className="stats-hero-copy">
          <span className="stats-hero-brand">Metano</span>
          <span className="stats-hero-id">
            No.{firstDate ? firstDate.replace(/-/g, '') : ' —'}
          </span>
          <div className="stats-hero-numbers">
            <span><b>{allStats.total}</b><em>日记</em></span>
            <span><b>{allStats.days}</b><em>入住天数</em></span>
          </div>
        </div>
      </section>

      <div className="stats-score-row">
        <div className="stats-pie-card">
          <div className="stats-pie" style={{ background: pieBackground }}>
            <div className="stats-pie-hole">
              <MoodFace mood={stats.dominant?.id || 'neutral'} size={30} />
              <strong>{stats.score}</strong>
              <span>分</span>
            </div>
          </div>
          <div className="stats-legend">
            <span><i className="tone-positive" />明亮 <b>{stats.positivePercent}%</b></span>
            <span><i className="tone-neutral" />平稳 <b>{stats.neutralPercent}%</b></span>
            <span><i className="tone-negative" />低落 <b>{stats.negativePercent}%</b></span>
          </div>
        </div>

        <div className="stats-copy-card">
          <span className="stats-index-label">Metano 心情指数</span>
          <strong>{stats.score}<em>分</em></strong>
          <p>{moodIndexCopy(stats)}</p>
          <small>{rangeLabel(range)} · {stats.total} 篇</small>
        </div>
      </div>

      <section className="stats-reports">
        <div className="stats-reports-head">
          <div>
            <h3>给你的回顾</h3>
            <p>不用翻完所有日子，我把它们收成了几页。</p>
          </div>
        </div>

        {latestMonth ? (
          <button
            type="button"
            className="report-feature-card"
            onClick={() => onOpenReport(latestMonth.id)}
          >
            <div className="report-feature-top">
              <span className="report-stamp">月报</span>
              <span>{latestMonth.periodLabel}</span>
            </div>
            <h3>{latestMonth.headline}</h3>
            <p>{latestMonth.intro}</p>
            <div className="report-feature-foot">
              <span>{latestMonth.total} 篇 · {latestMonth.days} 天有记录</span>
              <b>打开这一页 <Icon name="right" size={14} /></b>
            </div>
          </button>
        ) : (
          <div className="report-empty-card">
            <b>月报还在路上</b>
            这个月的月报会在月底收好。先写下的每一篇，都会被记着。
          </div>
        )}

        {(latestYear || latestEvent) && (
          <div className="report-mini-grid">
            {latestYear && (
              <button
                type="button"
                className="report-mini-card"
                onClick={() => onOpenReport(latestYear.id)}
              >
                <span className="report-mini-icon"><Icon name="sparkle" size={16} /></span>
                <span className="report-mini-label">年报</span>
                <b>{latestYear.title}</b>
                <p>{latestYear.headline}</p>
              </button>
            )}
            {latestEvent && (
              <button
                type="button"
                className="report-mini-card"
                onClick={() => onOpenReport(latestEvent.id)}
              >
                <span className="report-mini-icon"><Icon name="heart" size={16} /></span>
                <span className="report-mini-label">特别的日子</span>
                <b>{latestEvent.title}</b>
                <p>{latestEvent.headline}</p>
              </button>
            )}
          </div>
        )}

        {olderReports.length > 0 && (
          <div className="report-history" aria-label="往期回顾">
            {olderReports.map((report) => (
              <button
                type="button"
                className="report-history-chip"
                key={report.id}
                onClick={() => onOpenReport(report.id)}
              >
                {reportChipLabel(report)}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="stats-top-card">
        <div className="stats-top-head">
          <div>
            <h3>心情 Top 10</h3>
            <p>{rangeLabel(range)}，你写得最多的表情</p>
          </div>
          <div className="stats-range-tabs" role="tablist" aria-label="统计时间范围">
            {RANGE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.id}
                className={range === option.id ? 'active' : ''}
                onClick={() => setRange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {stats.top.length > 0 ? (
          <div className="stats-top-list">
            {stats.top.map((item, index) => (
              <div className="stats-top-row" key={item.id}>
                <span className="stats-top-rank">{String(index + 1).padStart(2, '0')}</span>
                <MoodFace mood={item.id} size={32} />
                <span className="stats-top-label">{item.label}</span>
                <div className="stats-top-track">
                  <span style={{ width: `${Math.max(6, (item.count / maxCount) * 100)}%`, background: item.color }} />
                </div>
                <b>{item.count}</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-empty">
            <MoodFace mood="neutral" size={52} />
            <p>这段时间还没有日记。写一篇，心情统计局就会亮起来。</p>
          </div>
        )}
      </section>

      <div className="stats-foot-note">
        <Icon name="info" size={17} />
        <p>
          {firstDate ? `从 ${fullCn(firstDate)}（${weekdayCn(firstDate)}）开始记录；` : ''}
          分数只由你写下的心情计算，不代表任何评价。
        </p>
      </div>
    </FullScreenPanel>
  )
}
