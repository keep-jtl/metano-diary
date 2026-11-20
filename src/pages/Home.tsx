import { dateKey, formatCn, greeting, weekdayCn } from '../lib/dates'
import type { Entry, MoodId } from '../types'
import { MoodFace } from '../components/MoodFace'
import { MoodOrbit } from '../components/MoodOrbit'
import { EntryCard } from '../components/EntryCard'
import { Icon } from '../components/Icon'
import { promptForDate } from '../components/Composer'
import { onThisDay } from '../lib/stats'

export function HomePage({
  today,
  entry,
  entries,
  streak,
  reminderDue,
  onDismissReminder,
  onStart,
  onOpen,
  onBackfillYesterday,
  celebrate = false,
  orbitMoods,
}: {
  today: string
  entry?: Entry
  entries: Entry[]
  streak: number
  reminderDue: boolean
  onDismissReminder: () => void
  onStart: (mood?: MoodId) => void
  onOpen: (entry: Entry) => void
  onBackfillYesterday: () => void
  celebrate?: boolean
  orbitMoods?: MoodId[]
}) {
  const memories = onThisDay(entries, today)
  const recent = entries.filter((e) => e.date < today).slice(0, 3)
  const yesterday = dateKey(new Date(Date.now() - 86400000))
  const yesterdayMissing = !entries.some((e) => e.date === yesterday)
  const prompt = promptForDate(today)

  return (
    <div className="page home-page">
      <header className="page-head">
        <div>
          <p className="greeting">
            {greeting()}
            {entry ? '，今天已经记下了' : '，今天也留一笔吧'}
          </p>
          <h1>
            {formatCn(today)} <span className="weekday">{weekdayCn(today)}</span>
          </h1>
        </div>
        <div className={`streak-badge ${streak > 0 ? 'active' : ''}`} title="连续记录天数">
          <Icon name="flame" size={22} />
          <span>{streak}</span>
        </div>
      </header>

      {reminderDue && !entry && (
        <div className="reminder-banner">
          <span>
            {streak > 0
              ? `今天还没记一笔，连续 ${streak} 天的火花要灭了。`
              : '今天还没记一笔，30 秒留个影子就好。'}
          </span>
          <button type="button" onClick={onDismissReminder} aria-label="知道了">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {entry ? (
        <section className="today-section">
          <div className="today-label">
            <span className="dot" /> 今天
          </div>
          <EntryCard entry={entry} onClick={() => onOpen(entry)} celebrate={celebrate} />
          <button type="button" className="btn-ghost" onClick={() => onStart(entry.mood)}>
            <Icon name="edit" size={18} />
            再补一句 / 修改今天
          </button>
          {yesterdayMissing && (
            <button type="button" className="backfill-link" onClick={onBackfillYesterday}>
              昨天漏了？补记一下
            </button>
          )}
        </section>
      ) : (
        <section className="hero-card">
          <div className="hero-tag">
            <Icon name="sparkle" size={15} /> 今日一问
          </div>
          <h2 className="hero-question">{prompt}</h2>
          <p className="hero-sub">点下面的 +，或选一个心情，30 秒记一笔。</p>
          {yesterdayMissing && (
            <button type="button" className="backfill-link" onClick={onBackfillYesterday}>
              昨天漏了？补记一下
            </button>
          )}
        </section>
      )}

      {memories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>往年今日</h2>
            <span className="section-hint">时间埋下的回信</span>
          </div>
          {memories.map((item) => (
            <EntryCard key={item.id} entry={item} onClick={() => onOpen(item)} compact />
          ))}
        </section>
      )}

      {recent.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>前几天的你</h2>
          </div>
          {recent.map((item) => (
            <EntryCard key={item.id} entry={item} onClick={() => onOpen(item)} compact />
          ))}
        </section>
      )}

      <footer className="home-quote">
        <MoodFace mood="calm" size={26} />
        <p>日子不是被记住才存在，但被记下的日子，回头看会发光。</p>
      </footer>

      <MoodOrbit onStart={onStart} moodIds={orbitMoods} />
    </div>
  )
}
