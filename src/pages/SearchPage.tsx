import { useMemo, useState } from 'react'
import type { Entry, MoodId } from '../types'
import { MOODS } from '../lib/moods'
import { L1_NAMES } from '../lib/classify'
import { expandTerms, searchEntries } from '../lib/search'
import { MoodFace } from '../components/MoodFace'
import { EntryCard } from '../components/EntryCard'
import { Icon } from '../components/Icon'

export function SearchPage({
  entries,
  onOpenEntry,
}: {
  entries: Entry[]
  onOpenEntry: (entry: Entry) => void
}) {
  const [query, setQuery] = useState('')
  const [mood, setMood] = useState<MoodId | 'all'>('all')
  const [l1, setL1] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const terms = useMemo(() => expandTerms(query), [query])
  const results = useMemo(
    () => searchEntries(entries, query, { mood, l1, dateFrom, dateTo }),
    [entries, query, mood, l1, dateFrom, dateTo],
  )

  const filtering =
    Boolean(query.trim()) || mood !== 'all' || l1 !== 'all' || Boolean(dateFrom) || Boolean(dateTo)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="greeting">找一句话，或者找那一天</p>
          <h1>搜索</h1>
        </div>
      </header>

      <div className="search-bar">
        <Icon name="search" size={20} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜关键词，比如「考试」「难过」「室友」"
          aria-label="搜索日记"
        />
        {query && (
          <button type="button" className="icon-btn small" onClick={() => setQuery('')} aria-label="清空">
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      {query.trim() && terms.some((t) => t !== query.trim().toLowerCase()) && (
        <p className="search-synonym">
          已自动包含近义词：
          {terms.filter((t) => t !== query.trim().toLowerCase()).join('、')}
        </p>
      )}

      <div className="filter-block">
        <div className="filter-row">
          <button
            type="button"
            className={`chip ${mood === 'all' ? 'active' : ''}`}
            onClick={() => setMood('all')}
          >
            全部心情
          </button>
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`chip mood-chip ${mood === m.id ? 'active' : ''}`}
              onClick={() => setMood(mood === m.id ? 'all' : m.id)}
            >
              <MoodFace mood={m.id} size={20} />
              {m.label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <button
            type="button"
            className={`chip ${l1 === 'all' ? 'active' : ''}`}
            onClick={() => setL1('all')}
          >
            全部分类
          </button>
          {L1_NAMES.map((name) => (
            <button
              type="button"
              key={name}
              className={`chip ${l1 === name ? 'active' : ''}`}
              onClick={() => setL1(l1 === name ? 'all' : name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="filter-row filter-date-row">
          <span className="filter-label">日期</span>
          <label className="date-filter">
            <span>从</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="起始日期"
            />
          </label>
          <span className="date-filter-dash">至</span>
          <label className="date-filter">
            <span>到</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="结束日期"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="chip date-clear"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
            >
              清除日期
            </button>
          )}
        </div>
      </div>

      <div className="search-count">
        {filtering ? (
          <>
            找到 <b>{results.length}</b> 篇
          </>
        ) : (
          <>
            全部记录 <b>{results.length}</b> 篇
          </>
        )}
      </div>

      {results.length > 0 ? (
        <div className="entry-list">
          {results.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              terms={terms}
              onClick={() => onOpenEntry(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MoodFace mood="neutral" size={64} />
          <p>没找到。换个词，或者少选一个筛选条件。</p>
          {filtering && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setQuery('')
                setMood('all')
                setL1('all')
                setDateFrom('')
                setDateTo('')
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      )}
    </div>
  )
}
