import { useSyncExternalStore } from 'react'
import { ALL_MOODS, MOODS } from './moods'
import type { MoodId } from '../types'

export type ThemeMode = 'system' | 'light' | 'dark'
export type FontStyle =
  | 'system'
  | 'rounded'
  | 'serif'
  | 'hand'
  | 'misans'
  | 'wencang'
  | 'qiantu'
  | 'chenyu'
  | 'caramel'
  | 'pangmen'
  | 'fonarto'

const FONT_IDS: FontStyle[] = [
  'system',
  'rounded',
  'serif',
  'hand',
  'misans',
  'wencang',
  'qiantu',
  'chenyu',
  'caramel',
  'pangmen',
  'fonarto',
]
export type JournalAlign = 'left' | 'center' | 'right'

export interface Preferences {
  theme: ThemeMode
  font: FontStyle
  fontScale: number
  hiddenMoods: MoodId[]
  orbitMoods: MoodId[]
  /** 写日记页的两排心情；没设置时跟随首页转盘。 */
  composerMoods?: MoodId[]
  journalAlign: JournalAlign
}

const STORAGE_KEY = 'metano-preferences-v1'
const CHANGE_EVENT = 'metano-preferences-change'
const DEFAULT_ORBIT = MOODS.map((mood) => mood.id)
const ALL_IDS = ALL_MOODS.map((mood) => mood.id)

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  font: 'system',
  fontScale: 1,
  hiddenMoods: [],
  orbitMoods: DEFAULT_ORBIT,
  journalAlign: 'left',
}

function uniqueMoodIds(value: unknown, fallback: MoodId[]): MoodId[] {
  if (!Array.isArray(value)) return fallback
  const clean = value
    .filter((item): item is MoodId => typeof item === 'string' && ALL_IDS.includes(item))
  return clean.length ? [...new Set(clean)] : fallback
}

function normalizeFont(value: unknown): FontStyle {
  if (typeof value === 'string' && FONT_IDS.includes(value as FontStyle)) {
    return value as FontStyle
  }
  return DEFAULT_PREFERENCES.font
}

function normalize(input: unknown): Preferences {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<Preferences>
  const theme: ThemeMode =
    raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system'
      ? raw.theme
      : DEFAULT_PREFERENCES.theme
  const font: FontStyle = normalizeFont(raw.font)
  const fontScale = Math.min(
    1.2,
    Math.max(0.85, Number(raw.fontScale) >= 0.85 ? Number(raw.fontScale) : DEFAULT_PREFERENCES.fontScale),
  )
  const journalAlign: JournalAlign =
    raw.journalAlign === 'center' || raw.journalAlign === 'right' || raw.journalAlign === 'left'
      ? raw.journalAlign
      : DEFAULT_PREFERENCES.journalAlign
  const orbitMoodsRaw = uniqueMoodIds(raw.orbitMoods, DEFAULT_ORBIT).slice(0, 8)
  const orbitMoods = orbitMoodsRaw.length === 8 ? orbitMoodsRaw : DEFAULT_ORBIT
  const composerMoods =
    Array.isArray(raw.composerMoods) && raw.composerMoods.length >= 8
      ? uniqueMoodIds(raw.composerMoods, orbitMoods)
      : undefined

  return {
    theme,
    font,
    fontScale: Math.round(fontScale * 100) / 100,
    hiddenMoods: uniqueMoodIds(raw.hiddenMoods, []),
    orbitMoods,
    ...(composerMoods ? { composerMoods } : {}),
    journalAlign,
  }
}

let cached: Preferences = readPreferences()

function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalize(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getPreferences(): Preferences {
  return cached
}

export function savePreferences(patch: Partial<Preferences>): Preferences {
  cached = normalize({ ...cached, ...patch })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    /* 存储不可用时本次会话仍然生效 */
  }
  applyPreferencesToDocument(cached)
  emitChange()
  return cached
}

export function resetPreferences(): Preferences {
  cached = { ...DEFAULT_PREFERENCES }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    /* ignore */
  }
  applyPreferencesToDocument(cached)
  emitChange()
  return cached
}

export function applyPreferencesToDocument(prefs: Preferences = getPreferences()): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const systemDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark)

  root.dataset.theme = dark ? 'dark' : 'light'
  root.dataset.themeMode = prefs.theme
  root.dataset.font = prefs.font
  root.dataset.journalAlign = prefs.journalAlign
  root.style.setProperty('--fs', String(prefs.fontScale))
  root.style.setProperty('--app-font', fontFamilyFor(prefs.font))
  root.style.colorScheme = dark ? 'dark' : 'light'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#12100e' : '#efe6d5')
}

export function fontFamilyFor(font: FontStyle): string {
  switch (font) {
    case 'rounded':
      return '"HarmonyOS Sans SC", "MiSans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
    case 'serif':
      return '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "SimSun", serif'
    case 'hand':
      return '"Kaiti SC", "KaiTi", "STKaiti", "Noto Serif SC", cursive'
    case 'misans':
      return '"MetanoMiSans", "MiSans", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
    case 'wencang':
      return '"MetanoWencang", "Songti SC", "SimSun", "Noto Serif SC", serif'
    case 'qiantu':
      return '"MetanoQiantu", "Kaiti SC", "KaiTi", "STKaiti", cursive'
    case 'chenyu':
      return '"MetanoChenyu", "Kaiti SC", "STKaiti", "KaiTi", cursive'
    case 'caramel':
      return '"MetanoCaramel", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif'
    case 'pangmen':
      return '"MetanoPangmen", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif'
    case 'fonarto':
      return '"MetanoFonarto", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", serif'
    default:
      return '"PingFang SC", "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei", "Noto Sans SC", system-ui, -apple-system, sans-serif'
  }
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener(CHANGE_EVENT, listener)
      return () => window.removeEventListener(CHANGE_EVENT, listener)
    },
    () => cached,
    () => cached,
  )
}
