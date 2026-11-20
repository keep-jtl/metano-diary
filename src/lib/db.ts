import Dexie, { type Table } from 'dexie'
import type { AppSettings, Entry } from '../types'

class DiaryDB extends Dexie {
  entries!: Table<Entry, string>
  settings!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('diandian-diary')
    this.version(1).stores({
      entries: 'id,date,mood,createdAt',
      settings: 'key',
    })
  }
}

export const db = new DiaryDB()

export async function loadEntries(): Promise<Entry[]> {
  const list = await db.entries.orderBy('date').reverse().toArray()
  return list
}

export async function getSetting<T>(key: keyof AppSettings, fallback: T): Promise<T> {
  const row = await db.settings.get(key)
  if (!row) return fallback
  return row.value as T
}

export async function setSetting(key: keyof AppSettings, value: unknown): Promise<void> {
  await db.settings.put({ key, value })
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
