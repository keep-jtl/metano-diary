import type { ReportSnapshot } from '../types'
import { FullScreenPanel } from './FullScreenPanel'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'

const TONE_ROWS = [
  { key: 'positive' as const, label: '明亮', color: '#F58F4B' },
  { key: 'neutral' as const, label: '平稳', color: '#7FC4A2' },
  { key: 'negative' as const, label: '低落', color: '#8FC3E4' },
]

export function ReportPanel({
  report,
  open,
  onClose,
}: {
  report?: ReportSnapshot
  open: boolean
  onClose: () => void
}) {
  if (!report) return null
  const maxMonth = Math.max(1, ...(report.months || []).map((point) => point.total))

  return (
    <FullScreenPanel
      open={open}
      onClose={onClose}
      kicker={report.kicker}
      title={report.title}
      className="report-screen"
    >
      <section className="report-hero">
        <div className="report-hero-meta">
          <span className="report-stamp">
            {report.kind === 'month' ? '月报' : report.kind === 'year' ? '年报' : '特别的一天'}
          </span>
          <span>{report.periodLabel}</span>
        </div>
        <h1>{report.headline}</h1>
        <p>{report.intro}</p>
        <div className="report-numbers">
          <span><b>{report.total}</b><em>篇日记</em></span>
          <span><b>{report.days}</b><em>天有记录</em></span>
          <span><b>{report.score}</b><em>心情指数</em></span>
        </div>
      </section>

      <section className="report-tone-card">
        <div className="report-tone-head">
          <h3>心情底色</h3>
          <span>{report.periodLabel}</span>
        </div>
        <div className="report-tone-list">
          {TONE_ROWS.map((row) => {
            const value =
              row.key === 'positive'
                ? report.positivePercent
                : row.key === 'neutral'
                  ? report.neutralPercent
                  : report.negativePercent
            return (
              <div className="report-tone-row" key={row.key}>
                <span className="report-tone-name"><i style={{ background: row.color }} />{row.label}</span>
                <span className="report-tone-track">
                  <b style={{ width: `${value}%`, background: row.color }} />
                </span>
                <em>{value}%</em>
              </div>
            )
          })}
        </div>
        {report.top.length > 0 ? (
          <div className="report-mood-row">
            {report.top.map((mood) => (
              <span className="report-mood-pill" key={mood.id}>
                <MoodFace mood={mood.id} size={28} />
                <b>{mood.label}</b>
                <em>{mood.count} 次</em>
              </span>
            ))}
          </div>
        ) : (
          <div className="report-mood-empty">
            <MoodFace mood="neutral" size={34} />
            <span>这个时期还没有留下明显的心情形状。</span>
          </div>
        )}
      </section>

      {report.months && report.kind === 'year' && (
        <section className="report-month-card">
          <div className="report-tone-head">
            <h3>十二个月的回声</h3>
            <span>按记录篇数</span>
          </div>
          <div className="report-month-chart">
            {report.months.map((point) => (
              <div className="report-month-cell" key={point.month}>
                <div className="report-month-track">
                  <span
                    style={{
                      height: `${point.total ? Math.max(10, (point.total / maxMonth) * 100) : 3}%`,
                    }}
                  />
                </div>
                <em>{point.month}</em>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.quote && (
        <blockquote className="report-quote">
          <Icon name="sparkle" size={20} />
          <p>「{report.quote}」</p>
          <span>你曾经写下的一句话</span>
        </blockquote>
      )}

      <div className="report-sections">
        {report.sections.map((section) => (
          <section className="report-section" key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </section>
        ))}
      </div>

      <footer className="report-sign">
        <span className="report-sign-mark">Metano</span>
        <p>你的小角落 · 一直在这里</p>
      </footer>
    </FullScreenPanel>
  )
}
