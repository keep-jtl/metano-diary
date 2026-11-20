import type { ReactNode } from 'react'
import type { MoodId } from '../types'
import { moodById } from '../lib/moods'
import { DEFAULT_FACE_SPEC, FACE_SPECS, type EyeStyle, type MouthStyle, type ExtraStyle } from '../lib/moodFaces'

const INK = '#1C1917'

function dot(x: number, y: number, r = 2.4) {
  return <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={INK} />
}

function eyePair(style: EyeStyle): ReactNode {
  switch (style) {
    case 'closed':
      return (
        <>
          <path d="M15 26q5-5 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M31 26q5-5 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )
    case 'happy':
      return (
        <>
          <path d="M15 25q5-6 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M31 25q5-6 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )
    case 'wink':
      return (
        <>
          {dot(21, 25)}
          <path d="M32 25q4-4 8 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )
    case 'sad':
      return (
        <>
          <path d="M15 19l7 4M41 19l-7 4" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
          {dot(21, 27)}
          {dot(35, 27)}
        </>
      )
    case 'angry':
      return (
        <>
          <path d="M15 19l8 5M41 19l-8 5" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          {dot(21, 27, 2.2)}
          {dot(35, 27, 2.2)}
        </>
      )
    case 'wide':
      return (
        <>
          <circle cx="20" cy="25" r="4" fill="#fff" stroke={INK} strokeWidth="1.6" />
          <circle cx="36" cy="25" r="4" fill="#fff" stroke={INK} strokeWidth="1.6" />
          {dot(21, 25.5, 1.7)}
          {dot(35, 25.5, 1.7)}
        </>
      )
    case 'dizzy':
      return (
        <>
          <path d="M17 25c0-4 7-4 7 0s-7 4-7 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M32 25c0-4 7-4 7 0s-7 4-7 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )
    case 'sleepy':
      return (
        <>
          <path d="M15 24q5 3 9 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M32 24q5 3 9 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )
    case 'half':
      return (
        <>
          <path d="M15 23h9M32 23h9" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          {dot(20, 28, 1.6)}
          {dot(36, 28, 1.6)}
        </>
      )
    case 'side':
      return (
        <>
          <ellipse cx="21" cy="25" rx="3" ry="2.4" fill="#fff" stroke={INK} strokeWidth="1.4" />
          <ellipse cx="35" cy="25" rx="3" ry="2.4" fill="#fff" stroke={INK} strokeWidth="1.4" />
          {dot(19.5, 25, 1.6)}
          {dot(33.5, 25, 1.6)}
        </>
      )
    case 'heart':
      return (
        <>
          <path d="M20 21.5c-1.6 0-2.8 1.2-2.8 2.7 0 2 2.8 4.2 2.8 4.2s2.8-2.2 2.8-4.2c0-1.5-1.2-2.7-2.8-2.7" fill={INK} />
          <path d="M36 21.5c-1.6 0-2.8 1.2-2.8 2.7 0 2 2.8 4.2 2.8 4.2s2.8-2.2 2.8-4.2c0-1.5-1.2-2.7-2.8-2.7" fill={INK} />
        </>
      )
    case 'sparkle':
      return (
        <>
          <path d="M20 20l1.3 3.7 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7-3.7-1.3 3.7-1.3z" fill={INK} />
          <path d="M36 20l1.3 3.7 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7-3.7-1.3 3.7-1.3z" fill={INK} />
        </>
      )
    case 'teary':
      return (
        <>
          {dot(21, 25)}
          {dot(35, 25)}
          <path d="M22 29q2 4 0 6M34 29q-2 4 0 6" stroke="#7DB6D8" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )
    case 'tiny':
      return (
        <>
          {dot(21, 25, 1.1)}
          {dot(35, 25, 1.1)}
        </>
      )
    case 'line':
      return (
        <>
          <path d="M15 25h8M33 25h8" stroke={INK} strokeWidth="2.3" strokeLinecap="round" />
        </>
      )
    case 'dot':
    default:
      return (
        <>
          {dot(20, 25)}
          {dot(36, 25)}
        </>
      )
  }
}

function mouthPath(style: MouthStyle): ReactNode {
  switch (style) {
    case 'open':
      return (
        <>
          <ellipse cx="28" cy="36" rx="7" ry="5.5" fill={INK} />
          <circle cx="25" cy="34" r="1.1" fill="#fff" opacity="0.35" />
        </>
      )
    case 'laugh':
      return (
        <>
          <path d="M19 32q9 15 18 0z" fill={INK} />
          <path d="M24 40q4 3 8 0" stroke="#EF6B5E" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )
    case 'flat':
      return <path d="M21 35h14" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
    case 'frown':
      return <path d="M20 39q8-8 16 0" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
    case 'wavy':
      return <path d="M20 36q4-4 8 0t8 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    case 'small':
      return <path d="M24 35q4 3 8 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    case 'o':
      return <ellipse cx="28" cy="36" rx="3.5" ry="4.5" fill={INK} />
    case 'kiss':
      return (
        <>
          <path d="M23 35q5-2 10 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M25 38q3 3 6 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )
    case 'grit':
      return (
        <>
          <rect x="20" y="33" width="16" height="8" rx="4" fill={INK} />
          <path d="M22 37h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </>
      )
    case 'pout':
      return <path d="M24 39q4-4 8 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    case 'smirk':
      return <path d="M20 35q8 3 16-5" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    case 'tongue':
      return (
        <>
          <ellipse cx="28" cy="36" rx="6" ry="5" fill={INK} />
          <path d="M24 39q4 4 8 0" fill="#EF8FA8" />
        </>
      )
    case 'smile':
    default:
      return <path d="M18 33q10 9 20 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
  }
}

function heartShape(x: number, y: number, size: number, key: string) {
  const s = size / 9
  return (
    <path
      key={key}
      d={`M${x} ${y + 9 * s} L${x - 4 * s} ${y + 3 * s} Q${x - 4 * s} ${y} ${x - 1.4 * s} ${y} Q${x} ${y} ${x} ${y + 2 * s} Q${x} ${y} ${x + 1.4 * s} ${y} Q${x + 4 * s} ${y} ${x + 4 * s} ${y + 3 * s} Z`}
      fill={INK}
    />
  )
}

function extras(styles?: ExtraStyle[]): ReactNode {
  if (!styles) return null
  return (
    <>
      {styles.includes('blush') && (
        <>
          <ellipse cx="15" cy="34" rx="5" ry="3" fill="#F1A0B0" opacity="0.45" />
          <ellipse cx="41" cy="34" rx="5" ry="3" fill="#F1A0B0" opacity="0.45" />
        </>
      )}
      {styles.includes('tear') && (
        <>
          <path d="M23 30c-2 3-2.5 5 0 6 2.5-1 1.5-3 0-6" fill="#8FC3E4" opacity="0.85" />
          <path d="M34 30c2 3 2.5 5 0 6-2.5-1-1.5-3 0-6" fill="#8FC3E4" opacity="0.65" />
        </>
      )}
      {styles.includes('sweat') && (
        <path d="M44 16c-2 4-3 6 0 7 3-1 2-3 0-7" fill="#8FC3E4" opacity="0.8" />
      )}
      {styles.includes('fire') && (
        <>
          <path d="M43 13c-2 3-5 4-4 8 1 3 4 3 5 0 1-3-1-5-1-8z" fill="#EF6B5E" />
          <path d="M45 17c-1 2-2 3-1 5 1 1 2 0 2-1 1-2 0-3-1-4z" fill="#F6C84C" />
        </>
      )}
      {styles.includes('stars') && (
        <>
          <path d="M45 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#F6C84C" />
          <path d="M11 14l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8z" fill="#F6C84C" />
          <path d="M47 28l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="#F58F4B" />
        </>
      )}
      {styles.includes('hearts') && (
        <>
          {heartShape(43, 12, 9, 'h1')}
          {heartShape(9, 18, 7, 'h2')}
        </>
      )}
      {styles.includes('sparkle') && (
        <>
          <path d="M45 14v7M41.5 17.5h7" stroke="#F6C84C" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
          <path d="M11 27v5M8.5 29.5h5" stroke="#F58F4B" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        </>
      )}
      {styles.includes('hair') && (
        <path d="M16 16q10-10 24-2-5 3-13 3-7 0-11-1z" fill={INK} opacity="0.9" />
      )}
    </>
  )
}

export function MoodFace({
  mood,
  size = 44,
  className = '',
}: {
  mood: MoodId
  size?: number
  className?: string
}) {
  const def = moodById(mood)
  const spec = FACE_SPECS[mood] || DEFAULT_FACE_SPEC
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      className={className}
      role="img"
      aria-label={def.label}
    >
      <circle cx="28" cy="28" r="25" fill={def.color} />
      {extras(spec.extras)}
      {eyePair(spec.eyes)}
      {mouthPath(spec.mouth)}
    </svg>
  )
}
