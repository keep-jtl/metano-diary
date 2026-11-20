import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export function FullScreenPanel({
  open,
  onClose,
  title,
  kicker,
  action,
  children,
  className = '',
}: {
  open: boolean
  onClose: () => void
  title: string
  kicker?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const panels = document.querySelectorAll('.fs-panel')
      if (panels[panels.length - 1] === panelRef.current) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div ref={panelRef} className={`fs-panel ${className}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="fs-head">
        <button type="button" className="fs-close" onClick={onClose} aria-label="关闭">
          <Icon name="close" size={24} strokeWidth={2.2} />
        </button>
        <div className="fs-title-wrap">
          {kicker && <p className="fs-kicker">{kicker}</p>}
          <h2>{title}</h2>
        </div>
        {action ? <div className="fs-action">{action}</div> : <span className="fs-action-placeholder" />}
      </header>
      <div className="fs-body">{children}</div>
    </div>,
    document.body,
  )
}
