import type { Entry } from '../types'
import { formatCn } from '../lib/dates'
import { MOODS, MOOD_BY_ID } from '../lib/moods'
import {
  categoryBreakdown,
  countByMood,
  macroBreakdown,
  onThisDay,
  randomEntry,
  weeklyReview,
} from '../lib/stats'
import { MoodFace } from '../components/MoodFace'
import { EntryCard } from '../components/EntryCard'
import { Icon } from '../components/Icon'

const MACRO_COLORS: Record<string, string> = {
  生活: '#7FC4A2',
  学习: '#8FC3E4',
  '工作/事业': '#F6C84C',
  人际: '#F58F4B',
  其他: '#D8CBB2',
}

function colorOf(name: string) {
  return MACRO_COLORS[name] || '#D8CBB2'
}

export function ReviewPage({
  entries,
  today,
  onOpenEntry,
}: {
  entries: Entry[]
  today: string
  onOpenEntry: (entry: Entry) => void
}) {
  const week = weeklyReview(entries, today)
  const memories = onThisDay(entries, today)
  const allMoods = countByMood(entries)
  const total = entries.length
  const buckets = categoryBreakdown(entries)
  const macros = macroBreakdown(buckets)
  const topMood = week.topMood
  const topCategory = week.categories.find((c) => c.name !== '其他')

  const narrative =
    week.count === 0
      ? '这周还没开始记录。今天写一篇，周末就能看见这一周的样子。'
      : `这周你写下了 ${week.count} 篇${
          topMood ? `，最常出现的心情是「${MOOD_BY_ID[topMood].label}」` : ''
        }${topCategory ? `，注意力主要放在「${topCategory.name}」` : ''}。`

  function handleRandom() {
    const pick = randomEntry(entries, today)
    if (pick) onOpenEntry(pick)
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="greeting">把日子翻过来看看</p>
          <h1>回顾</h1>
        </div>
      </header>

      <section className="review-card">
        <div className="review-top">
          <span className="review-tag">
            <Icon name="sparkle" size={14} /> 本周
          </span>
          <span className="review-range">
            {formatCn(week.startKey)} – {formatCn(today)}
          </span>
        </div>
        <div className="review-big">
          <b>{week.count}</b>
          <span>篇</span>
          <em>{topMood ? `${MOOD_BY_ID[topMood].label}居多` : '还没有记录'}</em>
        </div>
        <p className="review-narrative">{narrative}</p>

        {week.progressEntries.length > 0 && (
          <div className="progress-list">
            <div className="progress-title">
              <Icon name="progress" size={15} /> 你写下的进步
            </div>
            {week.progressEntries.slice(0, 3).map((entry) => (
              <button
                type="button"
                key={entry.id}
                className="progress-item"
                onClick={() => onOpenEntry(entry)}
              >
                <MoodFace mood={entry.mood} size={22} />
                <span>{entry.progress}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {memories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>往年今日</h2>
            <span className="section-hint">同一日期，不同年份</span>
          </div>
          {memories.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onOpenEntry(entry)} compact />
          ))}
        </section>
      )}

      <button type="button" className="random-card" onClick={handleRandom} disabled={entries.length === 0}>
        <div className="random-icon">
          <Icon name="shuffle" size={26} />
        </div>
        <div>
          <h3>随机翻开一页</h3>
          <p>{entries.length > 0 ? '看看过去的某一天，你在想什么' : '等第一篇日记出现'}</p>
        </div>
        <Icon name="right" size={20} />
      </button>

      {total > 0 && macros.length > 0 && (
        <section className="section category-section">
          <div className="section-head">
            <h2>分类分布</h2>
            <span className="section-hint">生活 / 学习 / 工作 / 人际 / 其他</span>
          </div>

          <div className="category-overview">
            <div className="category-stack" aria-hidden="true">
              {macros.map((macro) => (
                <span
                  key={macro.name}
                  style={{ flexGrow: macro.count, background: colorOf(macro.name) }}
                />
              ))}
            </div>

            <div className="category-list">
              {macros.map((macro) => (
                <article className="category-block" key={macro.name}>
                  <div className="category-block-head">
                    <span
                      className="category-swatch"
                      style={{ background: colorOf(macro.name) }}
                    />
                    <h3>{macro.name}</h3>
                    <span className="category-count">{macro.count} 篇</span>
                    <span className="category-percent">{macro.percent}%</span>
                  </div>

                  <div className="category-track">
                    <div
                      className="category-fill"
                      style={{
                        width: `${macro.percent}%`,
                        background: colorOf(macro.name),
                      }}
                    />
                  </div>

                  <div className="category-subs">
                    {macro.subs.map((sub) => (
                      <span
                        key={sub.name}
                        className={`sub-chip ${sub.name === '未细分' ? 'sub-chip-muted' : ''}`}
                      >
                        {sub.name}
                        <em>{sub.count}</em>
                      </span>
                    ))}
                  </div>

                  {macro.keywords.length > 0 && (
                    <div className="category-words">
                      <span className="category-words-label">写到的词</span>
                      {macro.keywords.slice(0, 5).map((word) => (
                        <span key={word.word} className="cat-word">
                          {word.word}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {total > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>心情分布</h2>
            <span className="section-hint">共 {total} 篇</span>
          </div>
          <div className="mood-bars">
            {MOODS.map((mood) => {
              const count = allMoods[mood.id] || 0
              const percent = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div className="bar-row" key={mood.id}>
                  <MoodFace mood={mood.id} size={26} />
                  <span className="bar-label">{mood.label}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${percent}%`, background: mood.color }}
                    />
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="empty-state">
          <MoodFace mood="happy" size={64} />
          <p>回忆还空着，去写今天的第一笔吧。</p>
        </div>
      )}
    </div>
  )
}
