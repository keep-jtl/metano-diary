import { useRef, useState, type TouchEvent } from 'react'
import type { CalendarEvent, Entry, Plan, ReportSnapshot } from '../types'
import { dateKey, isFuture, monthGrid, shiftMonth, WEEK_CN } from '../lib/dates'
import { eventMatchesDate, eventsOnDate } from '../lib/events'
import { eventReportId } from '../lib/reports'
import { lunarInfo, lunarMonthRange } from '../lib/lunar'
import { MoodFace } from '../components/MoodFace'
import { Icon } from '../components/Icon'
import { EntryCard } from '../components/EntryCard'
import { PlanBoard } from '../components/PlanBoard'
import { DayDetailSheet } from '../components/DayDetailSheet'
import { MoodStats, MoodStatsEntry } from '../components/MoodStats'
import { ReportPanel } from '../components/ReportPanel'

export function CalendarPage({
  entries,
  plans,
  planTags,
  events,
  today,
  reports,
  onOpenDay,
  onOpenEntry,
  onSavePlan,
  onDeletePlan,
  onAddPlanTag,
  onCheckInPlan,
  onSaveEvent,
  onDeleteEvent,
}: {
  entries: Entry[]
  plans: Plan[]
  planTags: string[]
  events: CalendarEvent[]
  today: string
  reports: Record<string, ReportSnapshot>
  onOpenDay: (key: string) => void
  onOpenEntry: (entry: Entry) => void
  onSavePlan: (plan: Plan) => void | Promise<void>
  onDeletePlan: (id: string) => void | Promise<void>
  onAddPlanTag: (tag: string) => void | Promise<void>
  onCheckInPlan: (id: string, value: number) => void | Promise<void>
  onSaveEvent: (event: CalendarEvent) => void | Promise<void>
  onDeleteEvent: (id: string) => void | Promise<void>
}) {
  const todayDate = new Date()
  const [view, setView] = useState({ year: todayDate.getFullYear(), monthIndex: todayDate.getMonth() })
  const [flip, setFlip] = useState<'next' | 'prev' | 'none'>('none')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const todayEventReports = eventsOnDate(events, today)
    .map((event) => reports[eventReportId(event, today)])
    .filter((report): report is ReportSnapshot => Boolean(report))

  function goToMonth(year: number, monthIndex: number) {
    const current = view.year * 12 + view.monthIndex
    const target = year * 12 + monthIndex
    if (target === current) return
    setFlip(target > current ? 'next' : 'prev')
    setView({ year, monthIndex })
  }

  function moveMonth(delta: number) {
    const next = shiftMonth(view.year, view.monthIndex, delta)
    goToMonth(next.year, next.monthIndex)
  }

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0]
    if (!touch) return
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    if (dx < 0) moveMonth(1)
    else moveMonth(-1)
  }

  const cells = monthGrid(view.year, view.monthIndex)
  const map = new Map(entries.map((e) => [e.date, e]))
  const planMarks = new Map<string, string[]>()
  plans.forEach((plan) => {
    Object.entries(plan.logs).forEach(([key, value]) => {
      if (Number(value) > 0) {
        const list = planMarks.get(key) || []
        list.push(plan.color)
        planMarks.set(key, list)
      }
    })
  })
  const prefix = `${view.year}-${String(view.monthIndex + 1).padStart(2, '0')}`
  const monthEntries = entries.filter((e) => e.date.startsWith(prefix))
  const isCurrentMonth =
    view.year === todayDate.getFullYear() && view.monthIndex === todayDate.getMonth()

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="greeting">翻一翻，哪天被好好记住了</p>
          <h1>日历</h1>
        </div>
      </header>

      <section className="calendar-card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="calendar-head">
          <button
            type="button"
            className="icon-btn"
            onClick={() => moveMonth(-1)}
            aria-label="上个月"
          >
            <Icon name="left" size={20} />
          </button>
          <div className="calendar-title">
            <span className="calendar-title-main">
              <span key={prefix} className="month-label">
                {view.year}年{view.monthIndex + 1}月
              </span>
              {!isCurrentMonth && (
                <button
                  type="button"
                  className="back-today"
                  onClick={() => goToMonth(todayDate.getFullYear(), todayDate.getMonth())}
                >
                  回到本月
                </button>
              )}
            </span>
            <span className="calendar-lunar-title">农历 {lunarMonthRange(view.year, view.monthIndex)}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => moveMonth(1)}
            aria-label="下个月"
          >
            <Icon name="right" size={20} />
          </button>
        </div>

        <div className="calendar-weekdays">
          {WEEK_CN.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div key={prefix} className={`calendar-grid ${flip === 'none' ? '' : `flip-${flip}`}`}>
          {cells.map((cell, index) => {
            if (!cell.key || !cell.day) return <div key={index} className="cal-cell empty" />
            const entry = map.get(cell.key)
            const isToday = cell.key === today
            const future = isFuture(cell.key)
            const lunar = lunarInfo(cell.key)
            const dayEvents = events.filter((event) => eventMatchesDate(event, cell.key!))
            const hasBirthday = dayEvents.some((event) => event.type === 'birthday')
            return (
              <button
                type="button"
                key={cell.key}
                className={`cal-cell ${isToday ? 'today' : ''} ${future ? 'future' : ''} ${
                  hasBirthday ? 'birthday' : ''
                } ${dayEvents.length ? 'has-event' : ''}`}
                onClick={() => setSelectedKey(cell.key!)}
              >
                <span className="cal-day">{cell.day}</span>
                <span className={`cal-lunar ${lunar.festival ? 'festival' : ''}`}>{lunar.display}</span>
                {entry ? (
                  <MoodFace mood={entry.mood} size={32} />
                ) : (
                  <span className="cal-dot" />
                )}
                {dayEvents.length > 0 && (
                  <span className="cal-event-marks" aria-label="特别的日子">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span key={event.id} className={`cal-event-mark event-${event.type}`}>
                        {event.type === 'birthday' ? '♥' : event.type === 'anniversary' ? '✿' : '★'}
                      </span>
                    ))}
                  </span>
                )}
                {planMarks.get(cell.key)?.length ? (
                  <span className="cal-plan-dots">
                    {(planMarks.get(cell.key) || []).slice(0, 3).map((color, dotIndex) => (
                      <span key={`${color}-${dotIndex}`} style={{ background: color }} />
                    ))}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="calendar-summary">
          <span>
            这个月写了 <b>{monthEntries.length}</b> 天
          </span>
          <span className="calendar-hint">点任意一天看日记、补记或记一个特别的日子</span>
        </div>
      </section>

      {todayEventReports.map((report) => (
        <button
          type="button"
          className="special-report-card"
          key={report.id}
          onClick={() => setReportId(report.id)}
        >
          <span className="special-report-icon">
            <Icon name={report.eventType === 'special' ? 'sparkle' : 'heart'} size={20} />
          </span>
          <span className="special-report-main">
            <em>今天 · {report.eventType === 'birthday' ? '生日回顾' : '特别的日子'}</em>
            <b>{report.headline}</b>
            <p>点开这一页，看看这一年的回声。</p>
          </span>
          <Icon name="right" size={18} className="special-report-arrow" />
        </button>
      ))}

      <MoodStatsEntry entries={entries} onClick={() => setStatsOpen(true)} />

      <PlanBoard
        plans={plans}
        planTags={planTags}
        today={today}
        onSave={onSavePlan}
        onDelete={onDeletePlan}
        onAddTag={onAddPlanTag}
        onCheckIn={onCheckInPlan}
      />

      {monthEntries.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>这个月</h2>
            <span className="section-hint">{monthEntries.length} 篇</span>
          </div>
          {monthEntries.slice(0, 6).map((entry) => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onOpenEntry(entry)} compact />
          ))}
          {monthEntries.length > 6 && (
            <p className="list-more">还有 {monthEntries.length - 6} 篇，点日历上的日子查看</p>
          )}
        </section>
      )}

      {monthEntries.length === 0 && (
        <div className="empty-state">
          <MoodFace mood="neutral" size={64} />
          <p>这个月这里还空着。</p>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onOpenDay(isCurrentMonth ? dateKey() : `${prefix}-01`)}
          >
            选一天记一笔
          </button>
        </div>
      )}
      {selectedKey && (
        <DayDetailSheet
          dayKey={selectedKey}
          entry={map.get(selectedKey)}
          events={events}
          today={today}
          onClose={() => setSelectedKey(null)}
          onOpenDay={(key) => {
            setSelectedKey(null)
            onOpenDay(key)
          }}
          onSaveEvent={onSaveEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}

      <MoodStats
        entries={entries}
        today={today}
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        reports={reports}
        onOpenReport={setReportId}
      />
      <ReportPanel
        report={reportId ? reports[reportId] : undefined}
        open={Boolean(reportId)}
        onClose={() => setReportId(null)}
      />
    </div>
  )
}
