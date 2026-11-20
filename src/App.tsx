import { useEffect, useState } from 'react'
import type {
  CalendarEvent,
  Entry,
  LearnedCategory,
  MoodId,
  Plan,
  ReminderSetting,
  ReportSnapshot,
  TabId,
} from './types'
import { dateKey, pad2 } from './lib/dates'
import { db, getSetting, loadEntries, setSetting } from './lib/db'
import { classify, learnFromCorrection } from './lib/classify'
import { calcStreak } from './lib/stats'
import {
  isNative,
  saveBackupNative,
  scheduleEventReminders,
  schedulePlanReminders,
  scheduleReminder,
} from './lib/native'
import { BRAND_STORY } from './lib/brand'
import { configureSound, playUiSound } from './lib/sound'
import { applyPreferencesToDocument, usePreferences } from './lib/prefs'
import { birthdayToEvent } from './lib/events'
import { ensureReports } from './lib/reports'
import { HomePage } from './pages/Home'
import { CalendarPage } from './pages/CalendarPage'
import { ReviewPage } from './pages/ReviewPage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'
import { Composer } from './components/Composer'
import { EntryDetail } from './components/EntryDetail'
import { LockScreen } from './components/LockScreen'
import { WelcomeCover } from './components/WelcomeCover'
import { DailyQuoteCard } from './components/DailyQuote'
import { dailyQuoteFor } from './lib/dailyQuotes'
import { Modal } from './components/Modal'
import { Icon } from './components/Icon'

type ModalState = {
  mode: 'view' | 'edit' | 'new'
  date: string
  entry?: Entry
  presetMood?: MoodId
  motion?: 'prev' | 'next' | 'none'
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'today', label: '今天', icon: 'sun' },
  { id: 'calendar', label: '日历', icon: 'calendar' },
  { id: 'review', label: '回顾', icon: 'sparkle' },
  { id: 'search', label: '搜索', icon: 'search' },
  { id: 'settings', label: '我的', icon: 'sliders' },
]

export function App() {
  const today = dateKey()
  const yesterday = dateKey(new Date(Date.now() - 86400000))

  const [entries, setEntries] = useState<Entry[]>([])
  const [tab, setTab] = useState<TabId>('today')
  const [tabMotion, setTabMotion] = useState<'forward' | 'back'>('forward')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [toast, setToast] = useState('')
  const [justSaved, setJustSaved] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [locked, setLocked] = useState(false)
  const [pin, setPin] = useState<string | undefined>(undefined)
  const [coverVisible, setCoverVisible] = useState(
    () => new URLSearchParams(window.location.search).get('cover') !== '0',
  )
  const [reminder, setReminder] = useState<ReminderSetting>({ enabled: false, time: '22:30' })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [learned, setLearned] = useState<Record<string, LearnedCategory>>({})
  const [plans, setPlans] = useState<Plan[]>([])
  const [planTags, setPlanTags] = useState<string[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [reports, setReports] = useState<Record<string, ReportSnapshot>>({})
  const [reminderDue, setReminderDue] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const prefs = usePreferences()

  useEffect(() => {
    if (isNative) document.documentElement.classList.add('native-app')
  }, [])

  useEffect(() => {
    applyPreferencesToDocument(prefs)
    if (prefs.theme !== 'system' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyPreferencesToDocument(prefs)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [prefs])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const list = await loadEntries()
      const storedPin = await getSetting<string | undefined>('pin', undefined)
      const storedReminder = await getSetting<ReminderSetting>('reminder', {
        enabled: false,
        time: '22:30',
      })
      const storedSound = await getSetting<boolean>('sound', true)
      const storedLearned = await getSetting<Record<string, LearnedCategory>>('learned', {})
      const storedPlans = await getSetting<Plan[]>('plans', [])
      const storedPlanTags = await getSetting<string[]>('planTags', [])
      const storedEvents = await getSetting<CalendarEvent[]>('events', [])
      const storedReports = await getSetting<Record<string, ReportSnapshot>>('reports', {})
      const storedBirthday = await getSetting<{
        calendar: 'solar' | 'lunar'
        month: number
        day: number
        time: string
      } | undefined>('birthday', undefined)
      if (!alive) return
      setEntries(list)
      setPin(storedPin || undefined)
      setReminder(storedReminder || { enabled: false, time: '22:30' })
      setSoundEnabled(storedSound !== false)
      setLearned(storedLearned || {})
      setPlans(Array.isArray(storedPlans) ? storedPlans : [])
      setPlanTags(Array.isArray(storedPlanTags) ? storedPlanTags : [])
      setReports(storedReports && typeof storedReports === 'object' ? storedReports : {})
      setEvents(
        Array.isArray(storedEvents) && storedEvents.length > 0
          ? storedEvents
          : storedBirthday
            ? [birthdayToEvent(storedBirthday)]
            : [],
      )
      if (storedBirthday && (!Array.isArray(storedEvents) || storedEvents.length === 0)) {
        const migrated = [birthdayToEvent(storedBirthday)]
        await setSetting('events', migrated)
        await db.settings.delete('birthday')
        if (alive) setEvents(migrated)
      }
      // 真正退出（页面卸载 / Activity 结束）时留下的标记；普通切后台不会写入。
      if (localStorage.getItem('metano-relock') === '1') {
        localStorage.removeItem('metano-relock')
        sessionStorage.removeItem('dd-unlocked')
      }
      const unlocked = sessionStorage.getItem('dd-unlocked') === '1'
      setLocked(Boolean(storedPin) && !unlocked)
      setLoaded(true)
      if (storedReminder?.enabled) {
        void scheduleReminder(true, storedReminder.time, list.some((e) => e.date === today))
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    const next = ensureReports(entries, events, today, reports)
    if (next === reports) return
    setReports(next)
    void setSetting('reports', next)
  }, [loaded, entries, events, today, reports])

  useEffect(() => {
    if (!loaded) return
    void schedulePlanReminders(plans)
  }, [loaded, plans])

  useEffect(() => {
    if (!loaded) return
    void scheduleEventReminders(events)
  }, [loaded, events])

  useEffect(() => {
    if (!loaded || !coverVisible) return
    const timer = window.setTimeout(() => setCoverVisible(false), 2200)
    return () => window.clearTimeout(timer)
  }, [loaded, coverVisible])

  // 每天第一次进入（封面之后、密码解锁之后）只弹一次今天的插画和那句话。
  useEffect(() => {
    if (!loaded || coverVisible || (locked && pin)) return
    if (localStorage.getItem('metano-daily-quote') === today) return
    setQuoteOpen(true)
  }, [loaded, coverVisible, locked, pin, today])

  // 页面真正卸载/被 Activity 结束时写重锁标记；普通切后台不会触发。
  useEffect(() => {
    if (!loaded || !pin) return
    function markForRelock() {
      try {
        localStorage.setItem('metano-relock', '1')
      } catch {
        /* 本地存储不可用时，下一次启动会因为没有 session 解锁而自动锁上 */
      }
    }
    window.addEventListener('pagehide', markForRelock)
    window.addEventListener('beforeunload', markForRelock)
    return () => {
      window.removeEventListener('pagehide', markForRelock)
      window.removeEventListener('beforeunload', markForRelock)
    }
  }, [loaded, pin])

  useEffect(() => {
    if (!loaded) return
    function check() {
      if (!reminder.enabled) {
        setReminderDue(false)
        return
      }
      const now = new Date()
      const hm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
      const hasToday = entries.some((e) => e.date === today)
      const dismissed = localStorage.getItem('dd-reminder-dismissed')
      const due = hm >= reminder.time && !hasToday && dismissed !== today
      setReminderDue(due)

      if (!isNative && due && 'Notification' in window && Notification.permission === 'granted') {
        const notified = localStorage.getItem('dd-notified')
        if (notified !== today) {
          try {
            new Notification('Metano', { body: '今天还没记一笔，30 秒给它留个影子。' })
            localStorage.setItem('dd-notified', today)
          } catch {
            /* 某些浏览器不支持直接构造通知，站内提醒仍然有效 */
          }
        }
      }
    }
    check()
    const timer = window.setInterval(check, 60000)
    return () => window.clearInterval(timer)
  }, [loaded, reminder, entries, today])

  useEffect(() => {
    configureSound(soundEnabled)
  }, [soundEnabled])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  async function refresh() {
    const list = await loadEntries()
    setEntries(list)
    return list
  }

  const todayEntry = entries.find((e) => e.date === today)
  const streak = calcStreak(entries)
  const detailIndex = modal?.entry
    ? entries.findIndex((e) => e.id === modal.entry!.id)
    : -1

  function switchTab(next: TabId) {
    if (next === tab) return
    playUiSound('tab')
    const current = TABS.findIndex((item) => item.id === tab)
    const target = TABS.findIndex((item) => item.id === next)
    setTabMotion(target >= current ? 'forward' : 'back')
    setTab(next)
  }

  function flipDetail(direction: 'prev' | 'next') {
    if (!modal?.entry) return
    const index = entries.findIndex((e) => e.id === modal.entry!.id)
    if (index < 0) return
    const step = direction === 'prev' ? 1 : -1
    const target = entries[index + step]
    if (!target) return
    setModal({ mode: 'view', date: target.date, entry: target, motion: direction })
  }

  function openDay(date: string) {
    playUiSound('open')
    const existing = entries.find((e) => e.date === date)
    if (existing) setModal({ mode: 'view', date, entry: existing })
    else setModal({ mode: 'new', date })
  }

  function startToday(mood?: MoodId) {
    playUiSound('open')
    const existing = entries.find((e) => e.date === today)
    if (existing) setModal({ mode: 'edit', date: today, entry: existing, presetMood: mood })
    else setModal({ mode: 'new', date: today, presetMood: mood })
  }

  function backfillYesterday() {
    playUiSound('open')
    const existing = entries.find((e) => e.date === yesterday)
    if (existing) setModal({ mode: 'view', date: yesterday, entry: existing })
    else setModal({ mode: 'new', date: yesterday })
  }

  async function handleSave(entry: Entry) {
    const editing = Boolean(modal?.entry)
    await db.entries.put(entry)
    const list = await refresh()
    setModal(null)
    playUiSound('save')
    showToast(editing ? '改好了。' : '记下了。今天也被好好收好了。')
    if (entry.date === today) {
      setJustSaved(entry.date)
      window.setTimeout(() => setJustSaved(''), 1500)
    }
    void scheduleReminder(
      reminder.enabled,
      reminder.time,
      list.some((item) => item.date === today),
    )
  }

  async function handleDelete(entry: Entry) {
    await db.entries.delete(entry.id)
    const list = await refresh()
    setModal(null)
    playUiSound('delete')
    showToast('这一天删掉了。')
    void scheduleReminder(
      reminder.enabled,
      reminder.time,
      list.some((item) => item.date === today),
    )
  }

  async function handleCategoryChange(entry: Entry, l1: string, l2?: string) {
    const text = `${entry.text} ${entry.progress || ''}`
    const nextLearned = learnFromCorrection(text, l1, l2, learned)
    await setSetting('learned', nextLearned)
    setLearned(nextLearned)
    const updated: Entry = { ...entry, category: { l1, l2, auto: false }, updatedAt: Date.now() }
    await db.entries.put(updated)
    await refresh()
    setModal((current) =>
      current && current.mode === 'view' ? { ...current, entry: updated } : current,
    )
    showToast('分类改好了，下次它会记住。')
  }

  async function handleSetPin(nextPin?: string) {
    if (nextPin) {
      await setSetting('pin', nextPin)
      setPin(nextPin)
      sessionStorage.setItem('dd-unlocked', '1')
      localStorage.removeItem('metano-relock')
      showToast('密码设好了。')
    } else {
      await db.settings.delete('pin')
      setPin(undefined)
      setLocked(false)
      sessionStorage.removeItem('dd-unlocked')
      localStorage.removeItem('metano-relock')
      showToast('密码锁已关闭。')
    }
  }

  async function handleSetReminder(next: ReminderSetting) {
    await setSetting('reminder', next)
    setReminder(next)
    void scheduleReminder(next.enabled, next.time, entries.some((item) => item.date === today))
  }

  async function handleSetSound(next: boolean) {
    await setSetting('sound', next)
    setSoundEnabled(next)
    configureSound(next)
    if (next) playUiSound('toggle')
    showToast(next ? '音效开了。' : '音效关了。')
  }

  async function handleSavePlan(plan: Plan) {
    const next = plans.some((item) => item.id === plan.id)
      ? plans.map((item) => (item.id === plan.id ? plan : item))
      : [...plans, plan]
    await setSetting('plans', next)
    setPlans(next)
    playUiSound('save')
    showToast(plans.some((item) => item.id === plan.id) ? '计划改好了。' : '计划放进日历了。')
  }

  async function handleDeletePlan(id: string) {
    const next = plans.filter((item) => item.id !== id)
    await setSetting('plans', next)
    setPlans(next)
    playUiSound('delete')
    showToast('计划删掉了。')
  }

  async function handleAddPlanTag(tag: string) {
    const clean = tag.trim().slice(0, 8)
    if (!clean || planTags.includes(clean)) return
    const next = [...planTags, clean]
    await setSetting('planTags', next)
    setPlanTags(next)
    showToast(`标签「${clean}」加好了。`)
  }

  async function handleSaveEvent(event: CalendarEvent) {
    const next = events.some((item) => item.id === event.id)
      ? events.map((item) => (item.id === event.id ? event : item))
      : [...events, event]
    await setSetting('events', next)
    setEvents(next)
    playUiSound('save')
    showToast(
      event.type === 'birthday'
        ? '生日记好了，前一天和当天都会提醒你。'
        : '这个日子记在日历里了。',
    )
  }

  async function handleDeleteEvent(id: string) {
    const next = events.filter((item) => item.id !== id)
    await setSetting('events', next)
    setEvents(next)
    playUiSound('delete')
    showToast('这个日子删掉了。')
  }

  async function handleCheckInPlan(id: string, value: number) {
    const next = plans.map((plan) => {
      if (plan.id !== id) return plan
      const logs = { ...plan.logs }
      if (value > 0) logs[today] = value
      else delete logs[today]
      return { ...plan, logs, updatedAt: Date.now() }
    })
    await setSetting('plans', next)
    setPlans(next)
    playUiSound(value > 0 ? 'check' : 'tick')
    if (value <= 0) showToast('撤销了今天的打卡。')
    else if (next.some((plan) => plan.id === id && plan.kind === 'habit')) showToast('今天做到了。')
  }

  async function handleExport() {
    const payload = {
      app: 'Metano',
      version: 2,
      exportedAt: new Date().toISOString(),
      entries,
      plans,
      brandStory: BRAND_STORY,
      settings: { reminder, learned, planTags, events },
    }
    const json = JSON.stringify(payload, null, 2)
    const fileName = `Metano-备份-${today}.json`

    if (isNative) {
      try {
        await saveBackupNative(fileName, json)
        showToast('备份已准备好，可以保存或分享。')
      } catch {
        showToast('导出没成功，再试一次。')
      }
      return
    }

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    showToast('备份已导出。')
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as {
        entries?: Entry[]
        plans?: Plan[]
        settings?: {
          planTags?: string[]
          events?: CalendarEvent[]
          birthday?: { calendar: 'solar' | 'lunar'; month: number; day: number; time?: string }
        }
      }
      const entriesRaw = Array.isArray(data.entries) ? data.entries : []
      const valid = entriesRaw.filter(
        (e) => e && typeof e.id === 'string' && typeof e.date === 'string' && e.mood && e.category,
      )
      const validPlans = (Array.isArray(data.plans) ? data.plans : [])
        .filter((p) => p && typeof p.id === 'string' && typeof p.title === 'string' && p.kind)
        .map((p) => ({
          ...p,
          logs: p.logs && typeof p.logs === 'object' ? p.logs : {},
          dailyTarget: Number(p.dailyTarget) || 1,
          reminderTime: p.reminderTime || '21:00',
          startDate: p.startDate || today,
          color: p.color || '#F2C94C',
        }))
      if (valid.length === 0 && validPlans.length === 0) throw new Error('empty')
      if (valid.length > 0) await db.entries.bulkPut(valid)
      if (validPlans.length > 0) {
        await setSetting('plans', validPlans)
        setPlans(validPlans)
      }
      const importedTags = [
        ...(Array.isArray(data.settings?.planTags) ? data.settings.planTags : []),
        ...validPlans.map((p) => p.tag || ''),
      ]
      const newTags = importedTags.map((t) => t.trim()).filter((t) => t && !planTags.includes(t))
      const mergedTags = [...new Set([...planTags, ...newTags])]
      if (newTags.length > 0) {
        await setSetting('planTags', mergedTags)
        setPlanTags(mergedTags)
      }
      const importedEvents = (Array.isArray(data.settings?.events) ? data.settings.events : [])
        .filter(
          (event) =>
            event &&
            typeof event.id === 'string' &&
            typeof event.title === 'string' &&
            (event.type === 'birthday' || event.type === 'anniversary' || event.type === 'special') &&
            (event.calendar === 'solar' || event.calendar === 'lunar') &&
            Number(event.month) >= 1 &&
            Number(event.month) <= 12 &&
            Number(event.day) >= 1 &&
            Number(event.day) <= 30,
        )
        .map((event) => ({
          ...event,
          month: Math.round(Number(event.month)),
          day: Math.round(Number(event.day)),
          reminderTime: event.reminderTime || '09:00',
          repeat: event.repeat === 'once' ? 'once' : 'yearly',
        })) as CalendarEvent[]
      const importedBirthday = data.settings?.birthday
      const migratedLegacy =
        importedBirthday &&
        importedBirthday.calendar &&
        Number(importedBirthday.month) >= 1 &&
        Number(importedBirthday.month) <= 12 &&
        Number(importedBirthday.day) >= 1 &&
        Number(importedBirthday.day) <= 30
          ? [
              birthdayToEvent({
                calendar: importedBirthday.calendar,
                month: Math.round(Number(importedBirthday.month)),
                day: Math.round(Number(importedBirthday.day)),
                time: importedBirthday.time || '09:00',
              }),
            ]
          : []
      if (importedEvents.length > 0 || migratedLegacy.length > 0) {
        const merged = [...events]
        for (const event of [...importedEvents, ...migratedLegacy]) {
          if (!merged.some((item) => item.id === event.id)) merged.push(event)
        }
        await setSetting('events', merged)
        setEvents(merged)
      }
      await db.settings.delete('reports')
      setReports({})
      await refresh()
      showToast(`导入了 ${valid.length} 篇日记${validPlans.length ? `、${validPlans.length} 个计划` : ''}。`)
    } catch {
      showToast('导入失败，这个文件不是 Metano 的备份。')
    }
  }

  async function handleClear() {
    await db.entries.clear()
    await db.settings.delete('plans')
    await db.settings.delete('planTags')
    await db.settings.delete('reports')
    setPlans([])
    setPlanTags([])
    setReports({})
    await refresh()
    setModal(null)
    showToast('日记和计划都清空了。')
  }

  function unlock() {
    sessionStorage.setItem('dd-unlocked', '1')
    localStorage.removeItem('metano-relock')
    playUiSound('unlock')
    setLocked(false)
  }

  async function forgotPin() {
    await db.settings.delete('pin')
    setPin(undefined)
    unlock()
    showToast('密码已重置，日记都还在。')
  }

  if (!loaded) {
    return (
      <div className="app loading-screen">
        <div className="loading-faces">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  if (coverVisible) {
    return <WelcomeCover onEnter={() => setCoverVisible(false)} />
  }

  if (locked && pin) {
    return <LockScreen pin={pin} onUnlock={unlock} onForgot={forgotPin} />
  }

  if (quoteOpen) {
    return (
      <DailyQuoteCard
        quote={dailyQuoteFor(today)}
        date={today}
        onClose={() => {
          localStorage.setItem('metano-daily-quote', today)
          setQuoteOpen(false)
        }}
      />
    )
  }

  return (
    <div className="app" data-tab-motion={tabMotion}>
      {tab === 'today' && (
        <HomePage
          today={today}
          entry={todayEntry}
          entries={entries}
          streak={streak}
          reminderDue={reminderDue}
          onDismissReminder={() => {
            localStorage.setItem('dd-reminder-dismissed', today)
            setReminderDue(false)
          }}
          onStart={startToday}
          onOpen={(entry) => setModal({ mode: 'view', date: entry.date, entry })}
          onBackfillYesterday={backfillYesterday}
          celebrate={justSaved === today}
          orbitMoods={prefs.orbitMoods}
        />
      )}

      {tab === 'calendar' && (
        <CalendarPage
          entries={entries}
          plans={plans}
          planTags={planTags}
          events={events}
          today={today}
          reports={reports}
          onOpenDay={openDay}
          onOpenEntry={(entry) => setModal({ mode: 'view', date: entry.date, entry })}
          onSavePlan={handleSavePlan}
          onDeletePlan={handleDeletePlan}
          onAddPlanTag={handleAddPlanTag}
          onCheckInPlan={handleCheckInPlan}
          onSaveEvent={handleSaveEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {tab === 'review' && (
        <ReviewPage
          entries={entries}
          today={today}
          onOpenEntry={(entry) => setModal({ mode: 'view', date: entry.date, entry })}
        />
      )}

      {tab === 'search' && (
        <SearchPage
          entries={entries}
          onOpenEntry={(entry) => setModal({ mode: 'view', date: entry.date, entry })}
        />
      )}

      {tab === 'settings' && (
        <SettingsPage
          entries={entries}
          pin={pin}
          reminder={reminder}
          soundEnabled={soundEnabled}
          onSetPin={handleSetPin}
          onSetReminder={handleSetReminder}
          onSetSound={handleSetSound}
          onExport={handleExport}
          onImport={handleImport}
          onClear={handleClear}
        />
      )}

      <nav className="tabbar">
        {TABS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`tab-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => switchTab(item.id)}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <Modal open={modal?.mode === 'view'} onClose={() => setModal(null)}>
        {modal?.entry && (
          <EntryDetail
            key={modal.entry.id}
            entry={modal.entry}
            motion={modal.motion || 'none'}
            pageIndex={detailIndex + 1}
            pageTotal={entries.length}
            hasPrev={detailIndex >= 0 && detailIndex < entries.length - 1}
            hasNext={detailIndex > 0}
            onFlip={flipDetail}
            onClose={() => setModal(null)}
            onEdit={() => setModal({ mode: 'edit', date: modal.date, entry: modal.entry })}
            onDelete={() => handleDelete(modal.entry!)}
            onCategoryChange={(l1, l2) => handleCategoryChange(modal.entry!, l1, l2)}
          />
        )}
      </Modal>

      <Modal open={modal?.mode === 'new' || modal?.mode === 'edit'} onClose={() => setModal(null)}>
        {modal && (modal.mode === 'new' || modal.mode === 'edit') && (
          <Composer
            date={modal.date}
            initial={modal.entry}
            learned={learned}
            presetMood={modal.presetMood}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
