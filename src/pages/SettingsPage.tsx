import { useMemo, useRef, useState } from 'react'
import type { Entry, ReminderSetting } from '../types'
import { calcStreak } from '../lib/stats'
import { dateKey, fullCn, parseKey } from '../lib/dates'
import { MoodFace } from '../components/MoodFace'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { PreferencesPanel } from '../components/PreferencesPanel'
import { usePreferences } from '../lib/prefs'
import { isNative } from '../lib/native'
import { BRAND_STORY } from '../lib/brand'
import { playUiSound } from '../lib/sound'

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className={`switch ${on ? 'on' : ''}`}
      onClick={() => {
        playUiSound('toggle')
        onChange()
      }}
      role="switch"
      aria-checked={on}
    >
      <span />
    </button>
  )
}

export function SettingsPage({
  entries,
  pin,
  reminder,
  soundEnabled,
  onSetPin,
  onSetReminder,
  onSetSound,
  onExport,
  onImport,
  onClear,
}: {
  entries: Entry[]
  pin?: string
  reminder: ReminderSetting
  soundEnabled: boolean
  onSetPin: (pin?: string) => void
  onSetReminder: (r: ReminderSetting) => void
  onSetSound: (enabled: boolean) => void
  onExport: () => void
  onImport: (file: File) => void
  onClear: () => void
}) {
  const [pinOpen, setPinOpen] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState('')
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const prefs = usePreferences()

  const streak = calcStreak(entries)
  const firstDate = entries.length > 0 ? entries[entries.length - 1].date : null
  const days = useMemo(() => {
    if (!firstDate) return 0
    return Math.floor((parseKey(dateKey()).getTime() - parseKey(firstDate).getTime()) / 86400000) + 1
  }, [firstDate])

  async function toggleReminder() {
    if (reminder.enabled) {
      onSetReminder({ ...reminder, enabled: false })
      return
    }
    try {
      if (!isNative && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    } catch {
      /* 通知权限申请失败不影响站内提醒 */
    }
    onSetReminder({ ...reminder, enabled: true, time: reminder.time || '22:30' })
  }

  function togglePin() {
    if (pin) {
      setConfirmDisable(true)
    } else {
      setPinValue('')
      setPinError('')
      setPinOpen(true)
    }
  }

  function savePin() {
    if (pinValue.length !== 4) {
      setPinError('要 4 位数字')
      return
    }
    onSetPin(pinValue)
    playUiSound('save')
    setPinOpen(false)
    setPinValue('')
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="greeting">这里是你的小角落</p>
          <h1>我的</h1>
        </div>
      </header>

      <section className="profile-card">
        <div className="profile-faces">
          <MoodFace mood="happy" size={64} className="pf pf1" />
          <MoodFace mood="excited" size={52} className="pf pf2" />
          <MoodFace mood="calm" size={48} className="pf pf3" />
          <MoodFace mood="sad" size={44} className="pf pf4" />
        </div>
        <div className="profile-right">
          <div className="profile-name">Metano</div>
          <div className="profile-id">只属于你的小角落</div>
          <div className="profile-meta">
            {entries.length > 0 ? `第 ${days} 天 · ${entries.length} 篇 · 连续 ${streak} 天` : '还没有开始'}
          </div>
        </div>
      </section>

      <div className="settings-list">
        <button type="button" className="setting-row preference-entry" onClick={() => setPreferencesOpen(true)}>
          <div className="setting-icon">
            <Icon name="sliders" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">偏好设置</div>
            <div className="setting-sub">
              深色模式 · 字体字号 · 转盘 · 仓库 · 版式
            </div>
          </div>
          <span className="setting-value">
            {prefs.theme === 'system' ? '跟随系统' : prefs.theme === 'dark' ? '深色' : '浅色'}
          </span>
          <Icon name="right" size={18} />
        </button>

        <div className="setting-row">
          <div className="setting-icon">
            <Icon name="bell" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">每日提醒</div>
            <div className="setting-sub">
              {reminder.enabled ? `每天 ${reminder.time}，轻轻提醒你记一笔` : '关着，不打扰你'}
            </div>
          </div>
          <Switch on={reminder.enabled} onChange={toggleReminder} />
        </div>

        {reminder.enabled && (
          <div className="reminder-config">
            <label>
              提醒时间
              <input
                type="time"
                value={reminder.time}
                onChange={(e) => onSetReminder({ ...reminder, time: e.target.value })}
              />
            </label>
            <p>
              {isNative
                ? '会在设定时间提醒你，写过了当天就不再打扰。'
                : '网页版需要 App 开着才会提醒；打包成手机 App 后可以后台提醒。'}
            </p>
          </div>
        )}

        <div className="setting-row">
          <div className="setting-icon">
            <Icon name="lock" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">App 密码</div>
            <div className="setting-sub">
              {pin ? '只在冷启动时输入；切后台回来不用重复' : 'App 自带的密码，不是系统应用锁'}
            </div>
          </div>
          <Switch on={Boolean(pin)} onChange={togglePin} />
        </div>

        <div className="setting-row">
          <div className="setting-icon">
            <Icon name="sound" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">音效</div>
            <div className="setting-sub">
              {soundEnabled ? '点按、保存、打卡时轻轻响一下' : '静音模式，不发出声音'}
            </div>
          </div>
          <Switch on={soundEnabled} onChange={() => onSetSound(!soundEnabled)} />
        </div>
      </div>
      <p className="settings-note">
        密码和音效只保存在本机；切到后台再回来不重复输入密码，忘记可在锁屏页重置，不会删除日记。
      </p>

      <div className="settings-group-title">数据</div>
      <div className="settings-list">
        <button type="button" className="setting-row" onClick={onExport}>
          <div className="setting-icon">
            <Icon name="download" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">导出备份</div>
            <div className="setting-sub">存成一个 JSON 文件，换手机也不丢</div>
          </div>
          <Icon name="right" size={18} />
        </button>

        <button type="button" className="setting-row" onClick={() => fileRef.current?.click()}>
          <div className="setting-icon">
            <Icon name="upload" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">导入备份</div>
            <div className="setting-sub">把之前导出的文件读回来</div>
          </div>
          <Icon name="right" size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,text/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onImport(file)
            if (fileRef.current) fileRef.current.value = ''
          }}
        />

        <button type="button" className="setting-row danger" onClick={() => setConfirmClear(true)}>
          <div className="setting-icon">
            <Icon name="trash" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">清空数据</div>
            <div className="setting-sub">删掉所有日记和计划，不可恢复</div>
          </div>
          <Icon name="right" size={18} />
        </button>
      </div>

      <div className="settings-group-title">关于</div>
      <div className="settings-list">
        <button type="button" className="setting-row" onClick={() => setBrandOpen(true)}>
          <div className="setting-icon">
            <Icon name="heart" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">Metano 的名字</div>
            <div className="setting-sub">metanoia · 重新思考，认知转变</div>
          </div>
          <Icon name="right" size={18} />
        </button>
        <button type="button" className="setting-row" onClick={() => setAboutOpen(true)}>
          <div className="setting-icon">
            <Icon name="info" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">关于 Metano</div>
            <div className="setting-sub">每天 30 秒，把日子留成可以翻阅的样子</div>
          </div>
          <Icon name="right" size={18} />
        </button>
        <div className="setting-row static">
          <div className="setting-icon">
            <Icon name="sparkle" size={22} />
          </div>
          <div className="setting-main">
            <div className="setting-title">版本</div>
            <div className="setting-sub">0.7.1 · 本地存储，不上传</div>
          </div>
        </div>
      </div>

      {firstDate && (
        <p className="settings-footer">
          从{fullCn(firstDate)}开始，你已经留下了 {entries.length} 个日子。
        </p>
      )}

      <PreferencesPanel open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />

      <Modal open={pinOpen} onClose={() => setPinOpen(false)}>
        <h2 className="modal-title">设置 App 密码</h2>
        <p className="modal-sub">
          这是 Metano 自己的 4 位密码，不是手机系统的应用锁。忘了可以在锁屏页重置，不会删日记。
        </p>
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pinValue}
          autoFocus
          onChange={(e) => {
            setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))
            setPinError('')
          }}
          placeholder="••••"
        />
        {pinError && <p className="form-error">{pinError}</p>}
        <button type="button" className="btn-primary" onClick={savePin} disabled={pinValue.length !== 4}>
          设好了
        </button>
      </Modal>

      <Modal open={confirmDisable} onClose={() => setConfirmDisable(false)}>
        <h2 className="modal-title">关掉密码锁？</h2>
        <p className="modal-sub">关掉之后，打开 App 就不需要密码了。</p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={() => setConfirmDisable(false)}>
            留着
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              onSetPin(undefined)
              setConfirmDisable(false)
            }}
          >
            关掉
          </button>
        </div>
      </Modal>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)}>
        <h2 className="modal-title">清空所有日记和计划？</h2>
        <p className="modal-sub">这个操作不可恢复。建议先导出一份备份。</p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={() => setConfirmClear(false)}>
            取消
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              onClear()
              setConfirmClear(false)
            }}
          >
            确定清空
          </button>
        </div>
      </Modal>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)}>
        <h2 className="modal-title">关于 Metano</h2>
        <p className="modal-sub">
          一个懒人也能坚持的电子日记。每天选一个心情，写一句话，偶尔补一句“今天的进步”。
          所有内容只存在这台设备上，不联网、不上传。
        </p>
        <div className="about-moods">
          <MoodFace mood="happy" size={34} />
          <MoodFace mood="calm" size={34} />
          <MoodFace mood="tired" size={34} />
          <MoodFace mood="sad" size={34} />
          <MoodFace mood="anxious" size={34} />
          <MoodFace mood="angry" size={34} />
        </div>
        <p className="about-version">版本 0.7.1</p>
        <button type="button" className="btn-primary" onClick={() => setAboutOpen(false)}>
          知道了
        </button>
      </Modal>

      <Modal open={brandOpen} onClose={() => setBrandOpen(false)}>
        <div className="brand-story">
          <p className="sheet-eyebrow">Metano · 名字的来历</p>
          <h2 className="brand-name">Metano</h2>
          <p className="brand-pron">{BRAND_STORY.pronunciation}</p>
          <p className="brand-origin">来自古希腊语 {BRAND_STORY.origin}</p>
          <div className="brand-parts">
            {BRAND_STORY.parts.map((part) => (
              <span key={part.word}>
                <b>{part.word}</b>
                {part.meaning}
              </span>
            ))}
          </div>
          <p className="brand-meaning">{BRAND_STORY.meaning}</p>
          <p className="brand-copy">{BRAND_STORY.note}</p>
          <p className="brand-copy">{BRAND_STORY.coincidence}</p>
          <div className="brand-line">{BRAND_STORY.line}</div>
          <p className="brand-save-note">这段故事会跟着 Metano 一起保存，也会写进你的备份。</p>
          <button type="button" className="btn-primary" onClick={() => setBrandOpen(false)}>
            记住了
          </button>
        </div>
      </Modal>
    </div>
  )
}
