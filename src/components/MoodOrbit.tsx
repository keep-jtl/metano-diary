import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { MOODS, moodById } from '../lib/moods'
import type { MoodId } from '../types'
import { MoodFace } from './MoodFace'
import { MoodLibrary } from './MoodLibrary'
import { Icon } from './Icon'

const FULL_RADIUS = 88
const CLUSTER_RADIUS = 65
const FACE_SIZE = 42
const STEP_DEG = 40
const MORE_INDEX = 8
const EXPAND_MS = 1120
const COLLAPSE_MS = 900

type Phase = 'collapsed' | 'expanding' | 'expanded' | 'collapsing'

function angleDelta(next: number, previous: number): number {
  let delta = next - previous
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return delta
}

export function MoodOrbit({
  onStart,
  moodIds,
}: {
  onStart: (mood?: MoodId) => void
  moodIds?: MoodId[]
}) {
  const orbitMoods = (moodIds && moodIds.length === 8 ? moodIds : MOODS.map((mood) => mood.id)).map(
    (id) => moodById(id),
  )
  const [phase, setPhase] = useState<Phase>('collapsed')
  const [selected, setSelected] = useState<MoodId | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const orbitRef = useRef<HTMLDivElement>(null)
  const phaseTimerRef = useRef<number | null>(null)
  const actionTimerRef = useRef<number | null>(null)
  const settleFrameRef = useRef<number | null>(null)
  const rotationRef = useRef(0)
  const dragRef = useRef<{
    active: boolean
    pointerId: number
    startX: number
    startY: number
    centerX: number
    centerY: number
    startRotation: number
    rotation: number
    lastAngle: number
    lastTime: number
    velocity: number
    mode: 'angle' | 'linear'
    moved: boolean
    startedOnControl: boolean
  } | null>(null)
  const suppressClickRef = useRef(false)

  const expanded = phase === 'expanded' || phase === 'expanding'

  useEffect(() => {
    applyRotation(0)
    return () => {
      if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current)
      if (phaseTimerRef.current) window.clearTimeout(phaseTimerRef.current)
      if (settleFrameRef.current) window.cancelAnimationFrame(settleFrameRef.current)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'expanded' || libraryOpen) return
    let start: { x: number; y: number } | null = null

    function isInteractive(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return false
      return Boolean(
        target.closest(
          'button, a, input, textarea, select, label, [role="button"], [role="tab"], ' +
            '.mood-library, .mood-edit-backdrop, .composer, .overlay, .fs-panel, .modal, .sheet, .tabbar',
        ),
      )
    }

    function onPointerDown(event: PointerEvent) {
      if (orbitRef.current?.contains(event.target as Node)) return
      if (isInteractive(event.target)) return
      start = { x: event.clientX, y: event.clientY }
    }

    function onPointerUp(event: PointerEvent) {
      const origin = start
      start = null
      if (!origin) return
      if (orbitRef.current?.contains(event.target as Node)) return
      if (isInteractive(event.target)) return
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 8) {
        toggleOrbit()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', onPointerUp, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', onPointerUp, true)
    }
  }, [phase, libraryOpen])

  function applyRotation(value: number) {
    rotationRef.current = value
    const node = orbitRef.current
    if (!node) return
    node.style.setProperty('--orbit-rotation', `${value}deg`)
    node.style.setProperty('--orbit-counter-rotation', `${-value}deg`)
  }

  function stopSettle() {
    if (settleFrameRef.current) {
      window.cancelAnimationFrame(settleFrameRef.current)
      settleFrameRef.current = null
    }
  }

  function settleTo(target: number) {
    stopSettle()
    const from = rotationRef.current
    const distance = Math.abs(target - from)
    if (distance < 0.5) {
      applyRotation(target)
      return
    }
    const startedAt = performance.now()
    const duration = Math.min(360, Math.max(180, distance * 2.4))

    function frame(now: number) {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      applyRotation(from + (target - from) * eased)
      if (progress < 1) {
        settleFrameRef.current = window.requestAnimationFrame(frame)
      } else {
        settleFrameRef.current = null
        applyRotation(target)
      }
    }

    settleFrameRef.current = window.requestAnimationFrame(frame)
  }

  function clearPhaseTimer() {
    if (phaseTimerRef.current) {
      window.clearTimeout(phaseTimerRef.current)
      phaseTimerRef.current = null
    }
  }

  function toggleOrbit() {
    if (phase === 'expanding' || phase === 'collapsing') return
    clearPhaseTimer()
    stopSettle()
    if (phase === 'collapsed') {
      applyRotation(0)
      setPhase('expanding')
      phaseTimerRef.current = window.setTimeout(() => setPhase('expanded'), EXPAND_MS)
    } else {
      applyRotation(0)
      setPhase('collapsing')
      phaseTimerRef.current = window.setTimeout(() => setPhase('collapsed'), COLLAPSE_MS)
    }
  }

  function pickMood(mood: MoodId) {
    if (selected || phase !== 'expanded') return
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setSelected(mood)
    actionTimerRef.current = window.setTimeout(() => {
      setSelected(null)
      onStart(mood)
    }, 380)
  }

  function chooseFromLibrary(mood: MoodId) {
    setLibraryOpen(false)
    if (selected) return
    if (phase !== 'expanded') {
      clearPhaseTimer()
      setPhase('expanded')
    }
    setSelected(mood)
    actionTimerRef.current = window.setTimeout(() => {
      setSelected(null)
      onStart(mood)
    }, 320)
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (phase !== 'expanded') return
    const target = event.target as HTMLElement
    if (target.closest('.orbit-plus') || target.closest('.orbit-more-slot')) return
    stopSettle()
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY)
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerX,
      centerY,
      startRotation: rotationRef.current,
      rotation: rotationRef.current,
      lastAngle: (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI,
      lastTime: event.timeStamp,
      velocity: 0,
      mode: distance < 22 ? 'linear' : 'angle',
      moved: false,
      startedOnControl: Boolean(target.closest('button')),
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || !drag.active || drag.pointerId !== event.pointerId) return

    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) < 6) return
    drag.moved = true

    let next = drag.rotation
    const dt = Math.max(1, event.timeStamp - drag.lastTime)

    if (drag.mode === 'angle') {
      const distance = Math.hypot(event.clientX - drag.centerX, event.clientY - drag.centerY)
      if (distance < 20) {
        drag.mode = 'linear'
      } else {
        const angle = (Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180) / Math.PI
        const delta = Math.max(-36, Math.min(36, angleDelta(angle, drag.lastAngle)))
        if (Math.abs(delta) > 0.15) {
          drag.rotation += delta
          drag.velocity = drag.velocity * 0.6 + (delta / dt) * 0.4
          drag.lastAngle = angle
          drag.lastTime = event.timeStamp
          next = drag.rotation
        }
      }
    }

    if (drag.mode === 'linear') {
      const motion = Math.abs(dx) >= Math.abs(dy) ? dx : dy
      next = drag.startRotation + motion * 1.15
      drag.rotation = next
      drag.velocity = drag.velocity * 0.65 + (motion * 1.15 / dt) * 0.35
      drag.lastTime = event.timeStamp
    }

    drag.velocity = Math.max(-0.9, Math.min(0.9, drag.velocity))
    applyRotation(next)
    if (event.cancelable) event.preventDefault()
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || !drag.active) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!drag.moved) {
      if (phase === 'expanded' && !drag.startedOnControl) toggleOrbit()
      return
    }

    suppressClickRef.current = true
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 140)

    const projected = drag.rotation + drag.velocity * 120
    settleTo(Math.round(projected / STEP_DEG) * STEP_DEG)
  }

  const radius = expanded ? FULL_RADIUS : CLUSTER_RADIUS
  const moreAngle = MORE_INDEX * STEP_DEG - 90

  const orbit = (
      <div
        ref={orbitRef}
        className={`mood-orbit ${phase}`}
        aria-label="写今天的日记"
        onClick={(event) => {
          if (phase !== 'collapsed') return
          if ((event.target as HTMLElement).closest('button')) return
          toggleOrbit()
        }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="orbit-spinner">
          {orbitMoods.map((mood, index) => {
            const angle = index * STEP_DEG - 90
            return (
              <div
                key={mood.id}
                className="orbit-slot"
                style={{ transform: `rotate(${angle}deg) translateX(${radius}px)` }}
              >
                <div className="orbit-upright" style={{ transform: `rotate(${-angle}deg)` }}>
                  <div className="orbit-counter">
                    <button
                      type="button"
                      className={`orbit-mood ${selected === mood.id ? 'selected' : ''}`}
                      onClick={() => pickMood(mood.id)}
                      title={mood.tip}
                      aria-label={`记录${mood.label}的心情`}
                      tabIndex={phase === 'expanded' ? 0 : -1}
                    >
                      <MoodFace mood={mood.id} size={FACE_SIZE} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          <div
            className="orbit-slot orbit-slot-more"
            style={{ transform: `rotate(${moreAngle}deg) translateX(${radius}px)` }}
          >
            <div className="orbit-upright" style={{ transform: `rotate(${-moreAngle}deg)` }}>
              <div className="orbit-counter">
                <button
                  type="button"
                  className="orbit-more-slot"
                  onClick={() => setLibraryOpen(true)}
                  aria-label="打开更多表情"
                  title="更多表情"
                  tabIndex={0}
                >
                  <MoodFace mood="happy" size={23} className="orbit-more-face" />
                  <Icon name="arrowUpRight" size={13} strokeWidth={2} className="orbit-more-arrow" />
                  <span className="orbit-more-label">更多</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`orbit-plus ${phase === 'expanded' || phase === 'expanding' ? 'is-open' : ''}`}
          onClick={toggleOrbit}
          aria-label={expanded ? '收起心情' : '展开心情'}
          aria-expanded={expanded}
          title={expanded ? '收起' : '选一个心情'}
        >
          {expanded ? (
            <Icon name="close" size={26} strokeWidth={2.4} />
          ) : (
            <Icon name="plus" size={27} strokeWidth={2.4} />
          )}
        </button>
      </div>
  )

  return (
    <>
      {createPortal(orbit, document.body)}
      <MoodLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onPick={chooseFromLibrary}
        current={selected}
      />
    </>
  )
}
