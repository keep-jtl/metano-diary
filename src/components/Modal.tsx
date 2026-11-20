import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return createPortal(
    <div className="overlay" onMouseDown={onClose}>
      <div
        className={`sheet ${wide ? 'sheet-wide' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sheet-grab" />
        {children}
      </div>
    </div>,
    document.body,
  )
}
