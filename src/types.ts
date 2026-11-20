/** 心情 id 会随表情库扩展，核心 8 个与“更多”里的扩展心情共用同一类型。 */
export type MoodId = string

export interface Category {
  l1: string
  l2?: string
  auto: boolean
}

export interface EntryPlace {
  label: string
  lat?: number
  lng?: number
}

export interface EntryAudio {
  dataUrl: string
  duration: number
  mime: string
}

export interface Entry {
  id: string
  date: string
  mood: MoodId
  text: string
  progress?: string
  photos: string[]
  place?: EntryPlace
  audio?: EntryAudio
  category: Category
  createdAt: number
  updatedAt: number
}

export interface LearnedCategory {
  l1: string
  l2?: string
}

export interface ReminderSetting {
  enabled: boolean
  time: string
}

export type BirthdayCalendar = 'solar' | 'lunar'

export type CalendarEventType = 'birthday' | 'anniversary' | 'special'
export type EventRepeat = 'yearly' | 'once'

/** 日历里记下的生日、纪念日和特别的日子。 */
export interface CalendarEvent {
  id: string
  type: CalendarEventType
  title: string
  calendar: BirthdayCalendar
  month: number
  day: number
  /** 仅一次的事件用这个年份；每年重复的事件可以为空 */
  year?: number
  repeat: EventRepeat
  reminder: boolean
  reminderTime: string
  createdAt: number
}

export interface BirthdaySetting {
  /** solar=按新历（公历）记，lunar=按农历记 */
  calendar: BirthdayCalendar
  month: number
  day: number
  /** 当天和提前一天发祝福的时间，默认 09:00 */
  time: string
}

export type PlanKind = 'reading' | 'habit'
export type PlanFrequency = 'daily' | 'weekly' | 'custom'
export type PlanPreset =
  | 'book'
  | 'fitness'
  | 'early'
  | 'diet'
  | 'fatloss'
  | 'running'
  | 'discipline'
  | 'other'

export type ReportKind = 'month' | 'year' | 'event'

export interface ReportMood {
  id: MoodId
  label: string
  color: string
  count: number
  percent: number
}

export interface ReportMonthPoint {
  month: number
  total: number
  score: number
}

export interface ReportSection {
  title: string
  body: string
}

/** 已经收好的一页回顾；生成后就不再因为改日记而变来变去。 */
export interface ReportSnapshot {
  id: string
  kind: ReportKind
  kicker: string
  title: string
  headline: string
  intro: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  generatedAt: number
  total: number
  days: number
  score: number
  positivePercent: number
  neutralPercent: number
  negativePercent: number
  top: ReportMood[]
  months?: ReportMonthPoint[]
  quote?: string
  sections: ReportSection[]
  eventType?: CalendarEventType
  eventTitle?: string
}

export interface Plan {
  id: string
  title: string
  kind: PlanKind
  frequency?: PlanFrequency
  preset?: PlanPreset
  tag?: string
  total?: number
  dailyTarget: number
  minutes?: number
  weeklyTarget?: number
  intervalDays?: number
  reminderDays?: number[]
  unit: string
  /** 健身/自律类：每天（或每次）做几组，每组几个 */
  reps?: number
  /** 早睡早起类：目标睡觉、起床时间 */
  sleepTime?: string
  wakeTime?: string
  /** 控制饮食类：每餐几分饱 */
  fullness?: string
  color: string
  reminderEnabled: boolean
  reminderTime: string
  startDate: string
  logs: Record<string, number>
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  pin?: string
  reminder?: ReminderSetting
  sound?: boolean
  learned?: Record<string, LearnedCategory>
  plans?: Plan[]
  planTags?: string[]
  birthday?: BirthdaySetting
  events?: CalendarEvent[]
  reports?: Record<string, ReportSnapshot>
}

export type TabId = 'today' | 'calendar' | 'review' | 'search' | 'settings'
