import type { KeyboardEvent } from 'react'
import { MOODS } from '../lib/moods'
import { MoodFace } from './MoodFace'

const FACE_SIZES = [56, 50, 54, 46, 52, 56, 48, 50]

export function WelcomeCover({ onEnter }: { onEnter: () => void }) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEnter()
    }
  }

  return (
    <div
      className="cover-screen"
      onClick={onEnter}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="进入 Metano"
    >
      <div className="cover-stage">
        <div className="cover-moods" aria-hidden="true">
          {MOODS.map((mood, index) => (
            <div
              key={mood.id}
              className={`cover-mood cover-mood-${index + 1}`}
              style={{ animationDelay: `${index * 0.3}s` }}
            >
              <MoodFace mood={mood.id} size={FACE_SIZES[index]} />
            </div>
          ))}
        </div>

        <div className="cover-word">
          <h1 className="cover-title">Metano</h1>
          <p className="cover-tagline">你今天过得好吗？</p>
        </div>
      </div>

      <p className="cover-enter">轻触进入</p>
    </div>
  )
}
