import { useState } from 'react'
import { Icon } from './Icon'
import { playUiSound } from '../lib/sound'

export function LockScreen({
  pin,
  onUnlock,
  onForgot,
}: {
  pin: string
  onUnlock: () => void
  onForgot: () => void
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [confirmForgot, setConfirmForgot] = useState(false)

  function press(key: string) {
    if (error) return
    if (key === 'del') {
      playUiSound('tick')
      setValue((v) => v.slice(0, -1))
      return
    }
    if (value.length >= 4) return
    playUiSound('tick')
    const next = value + key
    setValue(next)
    if (next.length === 4) {
      window.setTimeout(() => {
        if (next === pin) {
          onUnlock()
        } else {
          playUiSound('error')
          setError(true)
          setValue('')
          window.setTimeout(() => setError(false), 900)
        }
      }, 120)
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-symbol" aria-hidden="true">
        <Icon name="lock" size={38} strokeWidth={2.3} />
      </div>
      <h1 className="lock-title">请输入密码</h1>
      <p className="lock-sub">{confirmForgot ? '重置密码不会删除日记，确定吗？' : '打开 Metano'}</p>

      {!confirmForgot && (
        <div className={`pin-dots ${error ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={value.length > i ? 'filled' : ''} />
          ))}
        </div>
      )}

      {confirmForgot ? (
        <div className="lock-confirm">
          <button type="button" className="btn-primary" onClick={onForgot}>
            重置密码并进入
          </button>
          <button type="button" className="text-btn" onClick={() => setConfirmForgot(false)}>
            想起来了
          </button>
        </div>
      ) : (
        <>
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
              <button type="button" key={key} className="key" onClick={() => press(key)} aria-label={key}>
                {key}
              </button>
            ))}
            <button type="button" className="key key-text" onClick={() => setConfirmForgot(true)}>
              忘了
            </button>
            <button type="button" className="key" onClick={() => press('0')} aria-label="0">
              0
            </button>
            <button type="button" className="key key-text key-delete" onClick={() => press('del')} aria-label="删除一位">
              <Icon name="backspace" size={24} />
            </button>
          </div>
          {error && <p className="lock-error">密码不对，再试一次</p>}
        </>
      )}
    </div>
  )
}
