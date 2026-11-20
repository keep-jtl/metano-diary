import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Share } from '@capacitor/share'
import type { CalendarEvent, Plan } from '../types'
import { addDays } from './birthday'
import { eventOccurrences } from './events'
import {
  planComplete,
  planDoneToday,
  planDueOnDate,
  planFrequency,
  planIntervalDays,
  planWeeklyDoneOn,
  planWeeklyTarget,
} from './plans'

export const isNative = Capacitor.isNativePlatform()

const REMINDER_IDS = [1001, 1002, 1003, 1004, 1005, 1006, 1007]
const PLAN_REMINDER_BASE = 2100
const PLAN_REMINDER_SLOTS = 20
const PLAN_REMINDER_DAYS = 7
const PLAN_REMINDER_IDS = Array.from(
  { length: PLAN_REMINDER_SLOTS * 10 },
  (_, index) => PLAN_REMINDER_BASE + index,
)
const BIRTHDAY_REMINDER_IDS = [3001, 3002, 3003, 3004]
const EVENT_REMINDER_BASE = 5000
const EVENT_REMINDER_IDS = Array.from({ length: 100 }, (_, index) => EVENT_REMINDER_BASE + index)

async function notificationsAllowed(): Promise<boolean> {
  const permission = await LocalNotifications.checkPermissions()
  if (permission.display === 'granted') return true
  const requested = await LocalNotifications.requestPermissions()
  return requested.display === 'granted'
}

function dateAt(key: string, hour: number, minute: number): Date {
  const [year, month, day] = key.split('-').map(Number)
  const safeHour = Number.isFinite(hour) ? hour : 9
  const safeMinute = Number.isFinite(minute) ? minute : 0
  return new Date(year, month - 1, day, safeHour, safeMinute, 0, 0)
}


/**
 * 打包版用系统本地通知排未来 7 天，避免网页版关掉页面就收不到提醒。
 * 每次打开 App、保存或删除今天的内容都会重新排，已写过的当天不会再提醒。
 */
export async function scheduleReminder(
  enabled: boolean,
  time: string,
  hasToday: boolean,
): Promise<void> {
  if (!isNative) return
  try {
    await LocalNotifications.cancel({
      notifications: REMINDER_IDS.map((id) => ({ id })),
    })
  } catch {
    /* 没有已排的通知时取消会报错，忽略即可 */
  }
  if (!enabled) return

  try {
    if (!(await notificationsAllowed())) return

    const [hour, minute] = time.split(':').map((value) => Number(value))
    const first = new Date()
    first.setHours(hour || 22, minute || 30, 0, 0)
    if (hasToday || first.getTime() <= Date.now()) {
      first.setDate(first.getDate() + 1)
    }

    await LocalNotifications.schedule({
      notifications: REMINDER_IDS.map((id, index) => {
        const at = new Date(first)
        at.setDate(first.getDate() + index)
        return {
          id,
          title: 'Metano',
          body: '今天还没记一笔，30 秒留个影子就好。',
          isExactNotification: false,
          schedule: {
            at,
            allowWhileIdle: true,
          },
        }
      }),
    })
  } catch (error) {
    console.warn('scheduleReminder failed', error)
  }
}

/**
 * 每个计划按自己的频率和提醒时间排未来 7 天。
 * 今天已经完成、或时间已过，就不排今天的；计划完成或关掉提醒就不排。
 */
export async function schedulePlanReminders(plans: Plan[]): Promise<void> {
  if (!isNative) return
  try {
    await LocalNotifications.cancel({
      notifications: PLAN_REMINDER_IDS.map((id) => ({ id })),
    })
  } catch {
    /* 没有已排的通知时取消会报错，忽略即可 */
  }

  const active = plans.slice(0, PLAN_REMINDER_SLOTS).filter((plan) => plan.reminderEnabled && !planComplete(plan))
  if (active.length === 0) return

  try {
    if (!(await notificationsAllowed())) return

    const notifications: {
      id: number
      title: string
      body: string
      isExactNotification: boolean
      schedule: { at: Date; allowWhileIdle: boolean }
    }[] = []

    active.forEach((plan, planIndex) => {
      const [hour, minute] = plan.reminderTime.split(':').map((value) => Number(value))
      const base = new Date()
      base.setHours(hour || 21, minute || 0, 0, 0)
      const handledToday = planDoneToday(plan)
      const frequency = planFrequency(plan)

      for (let offset = 0; offset < PLAN_REMINDER_DAYS; offset++) {
        const at = new Date(base)
        at.setDate(base.getDate() + offset)
        const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(
          at.getDate(),
        ).padStart(2, '0')}`
        if (!planDueOnDate(plan, key)) continue
        if (offset === 0 && (handledToday || at.getTime() <= Date.now())) continue
        if (frequency === 'weekly' && planWeeklyDoneOn(plan, key)) continue
        const id = PLAN_REMINDER_BASE + planIndex * 10 + offset
        notifications.push({
          id,
          title: 'Metano · 计划提醒',
          body:
            plan.kind === 'reading'
              ? `「${plan.title}」今天还差 ${plan.dailyTarget} 页左右，抽一点时间就好。`
              : frequency === 'weekly'
                ? `「${plan.title}」本周目标 ${planWeeklyTarget(plan)} 次，抽一点时间完成一次。`
                : frequency === 'custom'
                  ? `「${plan.title}」每 ${planIntervalDays(plan)} 天一次，今天该做一次了。`
                  : `「${plan.title}」今天还没打卡，别忘了。`,
          isExactNotification: false,
          schedule: { at, allowWhileIdle: true },
        })
      }
    })

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch (error) {
    console.warn('schedulePlanReminders failed', error)
  }
}

/**
 * 日历里记下的日子：生日排“前一天”和“当天”两条；
 * 纪念日、特别的日子如果开了提醒，也排当天一条（生日多一条提前祝福）。
 * 每次打开 App、修改或删除事件都会重排，避免重复通知。
 */
export async function scheduleEventReminders(events: CalendarEvent[]): Promise<void> {
  if (!isNative) return
  try {
    await LocalNotifications.cancel({
      notifications: [...BIRTHDAY_REMINDER_IDS, ...EVENT_REMINDER_IDS].map((id) => ({ id })),
    })
  } catch {
    /* 没有已排的通知时取消会报错，忽略即可 */
  }
  if (!events.length) return

  try {
    if (!(await notificationsAllowed())) return

    const notifications: {
      id: number
      title: string
      body: string
      isExactNotification: boolean
      schedule: { at: Date; allowWhileIdle: boolean }
    }[] = []
    let nextId = EVENT_REMINDER_BASE

    for (const event of events) {
      if (!event.reminder) continue
      const [hour, minute] = (event.reminderTime || '09:00').split(':').map((value) => Number(value))
      const upcoming = eventOccurrences(event, undefined, 2)

      for (const key of upcoming) {
        if (event.type === 'birthday') {
          const beforeKey = addDays(key, -1)
          const beforeAt = dateAt(beforeKey, hour, minute)
          if (beforeAt.getTime() > Date.now()) {
            notifications.push({
              id: nextId++,
              title: 'Metano · 生日前一天',
              body: `明天是「${event.title}」，提前一天祝你生日快乐。`,
              isExactNotification: false,
              schedule: { at: beforeAt, allowWhileIdle: true },
            })
          }
        }

        const dayAt = dateAt(key, hour, minute)
        if (dayAt.getTime() <= Date.now()) continue
        const title =
          event.type === 'birthday'
            ? 'Metano · 生日快乐'
            : event.type === 'anniversary'
              ? 'Metano · 纪念日'
              : 'Metano · 特别的日子'
        const body =
          event.type === 'birthday'
            ? `今天是「${event.title}」，生日快乐。愿你今天被好好对待，也记得给自己留一笔。`
            : event.type === 'anniversary'
              ? `今天是「${event.title}」，记得回头看看一起走过的日子。`
              : `今天是「${event.title}」，把它留在这一天。`
        notifications.push({
          id: nextId++,
          title,
          body,
          isExactNotification: false,
          schedule: { at: dayAt, allowWhileIdle: true },
        })
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch (error) {
    console.warn('scheduleEventReminders failed', error)
  }
}


export async function saveBackupNative(fileName: string, json: string): Promise<void> {
  const result = await Filesystem.writeFile({
    path: fileName,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  await Share.share({
    title: 'Metano 备份',
    text: '这是你的 Metano 备份文件。',
    url: result.uri,
    dialogTitle: '保存或分享备份',
  })
}
