type SoundKind =
  | 'tap'
  | 'tab'
  | 'open'
  | 'mood'
  | 'save'
  | 'check'
  | 'tick'
  | 'unlock'
  | 'delete'
  | 'toggle'
  | 'error'

let soundEnabled = true
let context: AudioContext | null = null

export function configureSound(enabled: boolean) {
  soundEnabled = enabled
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      context = new Ctor()
    } catch {
      return null
    }
  }
  if (context.state === 'suspended') void context.resume().catch(() => {})
  return context
}

function tone(
  ctx: AudioContext,
  frequency: number,
  offset: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'sine',
  glideTo?: number,
) {
  const start = ctx.currentTime + offset
  const oscillator = ctx.createOscillator()
  const amp = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  if (glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration)
  }
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.018, duration / 3))
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(amp)
  amp.connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.03)
}

function playPattern(ctx: AudioContext, kind: SoundKind) {
  switch (kind) {
    case 'tap':
      tone(ctx, 620, 0, 0.045, 0.018, 'triangle')
      break
    case 'tab':
      tone(ctx, 510, 0, 0.06, 0.022, 'triangle')
      tone(ctx, 760, 0.018, 0.055, 0.009)
      break
    case 'open':
      tone(ctx, 390, 0, 0.12, 0.026, 'sine', 620)
      tone(ctx, 620, 0.055, 0.1, 0.012)
      break
    case 'mood':
      tone(ctx, 500, 0, 0.11, 0.025, 'triangle', 640)
      tone(ctx, 760, 0.04, 0.09, 0.012)
      break
    case 'save':
      tone(ctx, 523, 0, 0.16, 0.03, 'sine')
      tone(ctx, 659, 0.09, 0.18, 0.025, 'sine')
      tone(ctx, 784, 0.18, 0.22, 0.02, 'sine')
      break
    case 'check':
      tone(ctx, 660, 0, 0.13, 0.026, 'sine', 880)
      break
    case 'tick':
      tone(ctx, 880, 0, 0.035, 0.012, 'triangle')
      break
    case 'unlock':
      tone(ctx, 523, 0, 0.12, 0.025)
      tone(ctx, 784, 0.1, 0.15, 0.02)
      tone(ctx, 1046, 0.21, 0.2, 0.016)
      break
    case 'delete':
      tone(ctx, 210, 0, 0.11, 0.022, 'triangle', 160)
      break
    case 'toggle':
      tone(ctx, 560, 0, 0.045, 0.015, 'triangle')
      break
    case 'error':
      tone(ctx, 170, 0, 0.12, 0.02, 'triangle', 140)
      break
  }
}

export function playUiSound(kind: SoundKind) {
  if (!soundEnabled) return
  const ctx = getContext()
  if (!ctx) return
  try {
    playPattern(ctx, kind)
  } catch {
    /* 音效失败不影响主流程 */
  }
}
