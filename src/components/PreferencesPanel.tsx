import { useEffect, useState } from 'react'
import {
  DEFAULT_PREFERENCES,
  fontFamilyFor,
  savePreferences,
  usePreferences,
  type FontStyle,
  type JournalAlign,
  type ThemeMode,
} from '../lib/prefs'
import { ALL_MOODS } from '../lib/moods'
import { MoodFace } from './MoodFace'
import { Icon } from './Icon'
import { FullScreenPanel } from './FullScreenPanel'
import { OrbitMoodSettings } from './OrbitMoodSettings'
import { MoodManage } from './MoodManage'

type View = 'main' | 'theme' | 'font' | 'align'

const THEME_OPTIONS: { id: ThemeMode; label: string; sub: string }[] = [
  { id: 'system', label: '跟随系统', sub: '手机切到深色时，Metano 也一起变暗' },
  { id: 'light', label: '浅色', sub: '奶油纸面，一直亮着' },
  { id: 'dark', label: '深色', sub: '墨色背景，晚上看更舒服' },
]

const BASE_FONT_OPTIONS: { id: FontStyle; label: string; sub: string }[] = [
  { id: 'system', label: '系统字体', sub: '手机自带，最稳妥的阅读感' },
  { id: 'rounded', label: '圆润黑体', sub: '干净、轻快，适合日常记录' },
  { id: 'serif', label: '宋体', sub: '像纸页上的旧字，慢慢读' },
  { id: 'hand', label: '手写体', sub: '更像自己写下来的一页' },
]

const LOCAL_FONT_OPTIONS: { id: FontStyle; label: string; sub: string }[] = [
  { id: 'misans', label: '小米黑体', sub: '干净、现代，适合日常记录' },
  { id: 'wencang', label: '问藏书房', sub: '偏宋体，像纸页上的旧字' },
  { id: 'qiantu', label: '千图笔锋手写体', sub: '带笔锋的手写感' },
  { id: 'chenyu', label: '辰宇落雁体', sub: '清瘦、轻盈的落笔' },
  { id: 'caramel', label: '焦糖下午茶', sub: '圆润俏皮，适合短句标题' },
  { id: 'pangmen', label: '庞门正道细线体', sub: '很细、很轻的现代线体' },
  { id: 'fonarto', label: 'Fonarto', sub: '英文装饰体；中文自动回退' },
]

const ALL_FONT_OPTIONS = [...BASE_FONT_OPTIONS, ...LOCAL_FONT_OPTIONS]

const ALIGN_OPTIONS: { id: JournalAlign; label: string }[] = [
  { id: 'left', label: '日记居左' },
  { id: 'center', label: '日记居中' },
  { id: 'right', label: '日记居右' },
]

function themeLabel(theme: ThemeMode): string {
  return THEME_OPTIONS.find((item) => item.id === theme)?.label || '跟随系统'
}

function alignLabel(align: JournalAlign): string {
  return ALIGN_OPTIONS.find((item) => item.id === align)?.label.replace('日记', '') || '居左'
}

export function PreferencesPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const prefs = usePreferences()
  const [view, setView] = useState<View>('main')
  const [orbitOpen, setOrbitOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  useEffect(() => {
    if (open) setView('main')
  }, [open])

  if (view === 'theme') {
    return (
      <FullScreenPanel
        onClose={() => setView('main')}
        open={open}
        kicker="外观"
        title="深色模式"
        action={
          <button type="button" className="fs-check" onClick={() => setView('main')} aria-label="完成">
            <Icon name="check" size={22} strokeWidth={2.4} />
          </button>
        }
      >
        <div className="pref-preview theme-preview">
          <span className="pref-preview-eyebrow">Metano 的一页</span>
          <p className="pref-preview-title">晚上好，今天也留一笔吧。</p>
          <p className="pref-preview-sub">会随着系统一起切换明暗。</p>
          <div className="theme-preview-faces">
            {['happy', 'excited', 'calm', 'sad'].map((id) => (
              <MoodFace key={id} mood={id} size={38} />
            ))}
          </div>
        </div>

        <div className="pref-option-list">
          {THEME_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`pref-option ${prefs.theme === option.id ? 'selected' : ''}`}
              onClick={() => savePreferences({ theme: option.id })}
            >
              <span className="pref-option-radio" />
              <span className="pref-option-main">
                <b>{option.label}</b>
                <em>{option.sub}</em>
              </span>
              {prefs.theme === option.id && <Icon name="check" size={19} />}
            </button>
          ))}
        </div>
        <p className="fs-note">跟随系统会监听手机的明暗设置，不需要每次手动切换。</p>
      </FullScreenPanel>
    )
  }

  if (view === 'font') {
    return (
      <FullScreenPanel
        open={open}
        onClose={() => setView('main')}
        kicker="阅读体感"
        title="字体设置"
        action={
          <button type="button" className="fs-check" onClick={() => setView('main')} aria-label="完成">
            <Icon name="check" size={22} strokeWidth={2.4} />
          </button>
        }
      >
        <div className="font-preview">
          <span className="font-preview-date">20 <em>fri</em></span>
          <strong>非常棒</strong>
          <span className="font-preview-hi">你好，Metano</span>
        </div>

        <div className="font-size-block">
          <div className="font-size-head">
            <b>字号</b>
            <span>{Math.round(prefs.fontScale * 100)}%</span>
          </div>
          <div className="font-size-slider-row">
            <span className="font-size-a small">A</span>
            <input
              className="font-size-slider"
              type="range"
              min="0.85"
              max="1.2"
              step="0.01"
              value={prefs.fontScale}
              onChange={(event) => savePreferences({ fontScale: Number(event.target.value) })}
              aria-label="调整字号"
            />
            <span className="font-size-a large">A</span>
          </div>
        </div>

        <div className="pref-section-label">字体样式</div>
        <div className="pref-option-list font-option-list">
          {BASE_FONT_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`pref-option ${prefs.font === option.id ? 'selected' : ''}`}
              onClick={() => savePreferences({ font: option.id })}
            >
              <span className="pref-option-radio" />
              <span className="pref-option-main">
                <b style={{ fontFamily: fontFamilyFor(option.id) }}>{option.label}</b>
                <em>{option.sub}</em>
              </span>
              {prefs.font === option.id && <Icon name="check" size={19} />}
            </button>
          ))}
        </div>

        <div className="pref-section-label">你下载的本地字体 · 7 款</div>
        <div className="pref-option-list font-option-list">
          {LOCAL_FONT_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`pref-option ${prefs.font === option.id ? 'selected' : ''}`}
              onClick={() => savePreferences({ font: option.id })}
            >
              <span className="pref-option-radio" />
              <span className="pref-option-main">
                <b style={{ fontFamily: fontFamilyFor(option.id) }}>{option.label}</b>
                <em>{option.sub}</em>
              </span>
              {prefs.font === option.id && <Icon name="check" size={19} />}
            </button>
          ))}
        </div>
        <p className="fs-note">
          这 7 款字体都来自你下载的本地文件，已转成网页字体嵌进安装包；某个字体缺字时会自动回退到系统字体。
        </p>
        <p className="fs-note">
          字体仅供这台设备自用；当前是 debug 安装包，请不要公开分发字体或安装包。
        </p>
        <p className="fs-note">
          字号会同时影响页面标题、正文和按钮文字；手势与布局不会改变。
        </p>
      </FullScreenPanel>
    )
  }

  if (view === 'align') {
    return (
      <FullScreenPanel
        open={open}
        onClose={() => setView('main')}
        kicker="日记版式"
        title="设置日记初始位置"
        action={
          <button type="button" className="fs-check" onClick={() => setView('main')} aria-label="完成">
            <Icon name="check" size={22} strokeWidth={2.4} />
          </button>
        }
      >
        <div className="align-preview">
          <span className="font-preview-date">20 <em>fri</em></span>
          <p className="align-preview-title">非常棒</p>
          <p className="align-preview-text" style={{ textAlign: prefs.journalAlign }}>
            今天把一直拖着的事做完了。虽然只是很小的一步，但心里松了一点。
          </p>
        </div>
        <div className="pref-option-list">
          {ALIGN_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`pref-option ${prefs.journalAlign === option.id ? 'selected' : ''}`}
              onClick={() => savePreferences({ journalAlign: option.id })}
            >
              <span className="pref-option-radio" />
              <span className="pref-option-main">
                <b>{option.label}</b>
              </span>
              {prefs.journalAlign === option.id && <Icon name="check" size={19} />}
            </button>
          ))}
        </div>
        <p className="fs-note">这里设的是默认位置；如果某篇日记在编辑界面单独调过，以那一篇为准。</p>
      </FullScreenPanel>
    )
  }

  const hiddenCount = prefs.hiddenMoods.length

  return (
    <>
      <FullScreenPanel
        open={open}
        onClose={onClose}
        kicker="把 Metano 调成你的样子"
        title="偏好设置"
        action={
          <button type="button" className="fs-check" onClick={onClose} aria-label="完成">
            <Icon name="check" size={22} strokeWidth={2.4} />
          </button>
        }
      >
        <div className="pref-hero">
          <div className="pref-hero-faces">
            {prefs.orbitMoods.slice(0, 4).map((id) => (
              <MoodFace key={id} mood={id} size={42} />
            ))}
          </div>
          <div>
            <b>这是你的 Metano</b>
            <p>深色、字体、表情和版式，都按你的习惯。</p>
          </div>
        </div>

        <div className="pref-list">
          <button type="button" className="pref-row" onClick={() => setView('theme')}>
            <span className="pref-row-icon"><Icon name="moon" size={21} /></span>
            <span className="pref-row-main">
              <b>深色模式</b>
              <em>{prefs.theme === 'system' ? '跟随系统明暗' : prefs.theme === 'dark' ? '一直使用深色' : '一直使用浅色'}</em>
            </span>
            <span className="pref-row-value">{themeLabel(prefs.theme)}</span>
            <Icon name="right" size={17} />
          </button>

          <button type="button" className="pref-row" onClick={() => setView('font')}>
            <span className="pref-row-icon"><Icon name="font" size={21} /></span>
            <span className="pref-row-main">
              <b>字体样式</b>
              <em>字号与字体，按你的阅读习惯</em>
            </span>
            <span className="pref-row-value">
              {ALL_FONT_OPTIONS.find((item) => item.id === prefs.font)?.label} · {Math.round(prefs.fontScale * 100)}%
            </span>
            <Icon name="right" size={17} />
          </button>

          <button type="button" className="pref-row" onClick={() => setOrbitOpen(true)}>
            <span className="pref-row-icon"><Icon name="sparkle" size={21} /></span>
            <span className="pref-row-main">
              <b>设置转盘表情</b>
              <em>首页轮盘的 8 个位置，可以逐个替换</em>
            </span>
            <span className="pref-row-value">8 个位置</span>
            <Icon name="right" size={17} />
          </button>

          <button type="button" className="pref-row" onClick={() => setManageOpen(true)}>
            <span className="pref-row-icon"><Icon name="grid" size={21} /></span>
            <span className="pref-row-main">
              <b>整理表情仓库</b>
              <em>隐藏或恢复“更多”里的表情</em>
            </span>
            <span className="pref-row-value">{hiddenCount ? `隐藏 ${hiddenCount} 个` : `${ALL_MOODS.length} 个表情`}</span>
            <Icon name="right" size={17} />
          </button>

          <button type="button" className="pref-row" onClick={() => setView('align')}>
            <span className="pref-row-icon"><Icon name="list" size={21} /></span>
            <span className="pref-row-main">
              <b>设置日记初始位置</b>
              <em>日记正文默认居左、居中或居右</em>
            </span>
            <span className="pref-row-value">{alignLabel(prefs.journalAlign)}</span>
            <Icon name="right" size={17} />
          </button>
        </div>

        <div className="pref-foot">
          <p>偏好只保存在这台设备上，不会上传。写下的日记不会因为换字体或换主题而改变。</p>
          <button
            type="button"
            className="text-button"
            onClick={() => savePreferences({ ...DEFAULT_PREFERENCES })}
          >
            恢复默认偏好
          </button>
        </div>
      </FullScreenPanel>

      <OrbitMoodSettings open={open && orbitOpen} onClose={() => setOrbitOpen(false)} />
      <MoodManage open={open && manageOpen} onClose={() => setManageOpen(false)} />
    </>
  )
}
