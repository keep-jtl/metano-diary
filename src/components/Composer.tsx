import { useEffect, useMemo, useRef, useState } from 'react'
import type { Entry, EntryAudio, EntryPlace, LearnedCategory, MoodId } from '../types'
import { MOOD_BY_ID } from '../lib/moods'
import { formatCn, parseKey, weekdayCn } from '../lib/dates'
import { classify } from '../lib/classify'
import { compressImage } from '../lib/image'
import { newId } from '../lib/db'
import { blobToDataUrl, formatDuration, preferredAudioMime } from '../lib/audio'
import { locateCurrentPlace } from '../lib/location'
import { senseMood } from '../lib/moodSense'
import { playUiSound } from '../lib/sound'
import { getPreferences, savePreferences } from '../lib/prefs'
import { MoodPicker } from './MoodPicker'
import { MoodLibrary } from './MoodLibrary'
import { Icon } from './Icon'

const MAX_RECORD_SECONDS = 180

const PROMPTS = [
  '今天有什么特别的事？',
  '今天最想记住的一个瞬间是什么？',
  '今天有什么小事让你开心？',
  '今天有什么让你不舒服的？说出来会轻一点。',
  '如果给今天起个标题，会是什么？',
  '今天的时间花在哪了？你觉得值吗？',
  '有没有一件今天没做、明天想做的事？',
  '今天想对以后的自己说什么？',
]

export function promptForDate(date: string): string {
  const index = Math.floor(parseKey(date).getTime() / 86400000) % PROMPTS.length
  return PROMPTS[index]
}

export function Composer({
  date,
  initial,
  learned,
  presetMood,
  onSave,
  onCancel,
}: {
  date: string
  initial?: Entry
  learned: Record<string, LearnedCategory>
  presetMood?: MoodId
  onSave: (entry: Entry) => void
  onCancel: () => void
}) {
  const [mood, setMood] = useState<MoodId | null>(initial?.mood || presetMood || null)
  const [moodTouched, setMoodTouched] = useState(Boolean(initial?.mood || presetMood))
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [text, setText] = useState(initial?.text || '')
  const [progress, setProgress] = useState(initial?.progress || '')
  const [photos, setPhotos] = useState<string[]>(initial?.photos || [])
  const [place, setPlace] = useState<EntryPlace | undefined>(initial?.place)
  const [audio, setAudio] = useState<EntryAudio | undefined>(initial?.audio)
  const [locating, setLocating] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordStartedRef = useRef(0)

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordStartedRef.current) / 1000)
      setRecordSeconds(elapsed)
      if (elapsed >= MAX_RECORD_SECONDS) stopRecording()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(
    () => () => {
      const recorder = recorderRef.current
      if (recorder) recorder.onstop = null
      streamRef.current?.getTracks().forEach((track) => track.stop())
      recorderRef.current = null
      streamRef.current = null
    },
    [],
  )

  const autoCategory = useMemo(
    () => classify(`${text} ${progress}`, learned, mood || undefined),
    [text, progress, learned, mood],
  )
  const moodSuggestion = useMemo(() => senseMood(text, progress), [text, progress])

  useEffect(() => {
    if (moodTouched) return
    if (!text.trim() && !progress.trim()) return
    setMood(moodSuggestion.mood)
  }, [moodTouched, moodSuggestion, text, progress])

  const keepManual = initial && !initial.category.auto
  const category = keepManual ? initial!.category : autoCategory

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setBusy(true)
    try {
      const room = Math.max(0, 6 - photos.length)
      const next: string[] = []
      for (const file of Array.from(files).slice(0, room)) {
        if (!file.type.startsWith('image/')) continue
        next.push(await compressImage(file))
      }
      setPhotos((prev) => [...prev, ...next])
    } catch (e) {
      setError(e instanceof Error ? e.message : '图片处理失败')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleLocate() {
    setError('')
    setLocating(true)
    try {
      setPlace(await locateCurrentPlace())
    } catch {
      setError('没拿到位置权限。可以手动写“家、学校、公司”。')
    } finally {
      setLocating(false)
    }
  }

  async function startRecording() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('这个设备不支持录音。')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = preferredAudioMime()
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      recordStartedRef.current = Date.now()
      setRecordSeconds(0)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const duration = Math.max(
          1,
          Math.round((Date.now() - recordStartedRef.current) / 1000),
        )
        try {
          if (blob.size > 0) {
            setAudio({
              dataUrl: await blobToDataUrl(blob),
              duration,
              mime: blob.type || 'audio/webm',
            })
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : '录音保存失败')
        }
        stream.getTracks().forEach((track) => track.stop())
        if (streamRef.current === stream) streamRef.current = null
        if (recorderRef.current === recorder) recorderRef.current = null
        setRecording(false)
      }
      recorder.start()
      setRecording(true)
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setRecording(false)
      setError('需要麦克风权限才能录音。')
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setRecording(false)
      return
    }
    recorder.stop()
  }

  function handleAudioButton() {
    playUiSound('tap')
    if (recording) stopRecording()
    else void startRecording()
  }

  function handleSave() {
    if (recording) {
      playUiSound('error')
      setError('先点一下“停止”结束录音，再收好这一天。')
      return
    }
    const finalMood = mood || moodSuggestion.mood
    setSaving(true)
    const now = Date.now()
    const cleanPlace =
      place && place.label.trim()
        ? { ...place, label: place.label.trim() }
        : undefined
    const entry: Entry = {
      id: initial?.id || newId(),
      date,
      mood: finalMood,
      text: text.trim(),
      progress: progress.trim() || undefined,
      photos,
      place: cleanPlace,
      audio,
      category: keepManual ? initial!.category : autoCategory,
      createdAt: initial?.createdAt || now,
      updatedAt: now,
    }
    onSave(entry)
  }

  return (
    <div className="composer">
      <div className="sheet-head">
        <div>
          <div className="sheet-date">
            {formatCn(date)} {weekdayCn(date)}
          </div>
          <h2>{initial ? '编辑这一天' : '留一笔'}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="关闭">
          <Icon name="close" size={22} />
        </button>
      </div>

      <div className="field-label">今天的心情</div>
      <MoodPicker
        value={mood}
        onChange={(next) => {
          playUiSound('mood')
          setMood(next)
          setMoodTouched(true)
        }}
        onClear={() => {
          playUiSound('tap')
          setMood(null)
          setMoodTouched(true)
        }}
        onMore={() => setLibraryOpen(true)}
      />
      <MoodLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onPick={(next) => {
          playUiSound('mood')
          const prefs = getPreferences()
          const currentMoods = prefs.composerMoods?.length ? prefs.composerMoods : prefs.orbitMoods
          if (!currentMoods.includes(next)) {
            savePreferences({ composerMoods: [...currentMoods, next] })
          }
          setMood(next)
          setMoodTouched(true)
          setLibraryOpen(false)
        }}
        current={mood}
      />
      {(text.trim() || progress.trim()) && (
        <div className={`mood-sense ${moodTouched ? 'manual' : ''}`}>
          <Icon name="sparkle" size={14} />
          {moodTouched ? (
            <span>
              你选的是 <b>{MOOD_BY_ID[mood || moodSuggestion.mood].label}</b>。
              {moodSuggestion.score > 0 && mood !== moodSuggestion.mood ? (
                <>
                  文字里更像 <b>{MOOD_BY_ID[moodSuggestion.mood].label}</b>。
                  <button
                    type="button"
                    className="mood-sense-action"
                    onClick={() => {
                      playUiSound('mood')
                      setMood(moodSuggestion.mood)
                    }}
                  >
                    换成它
                  </button>
                </>
              ) : (
                <span className="mood-sense-soft">这个选择会记进回顾。</span>
              )}
            </span>
          ) : (
            <span>
              我猜你今天有点 <b>{MOOD_BY_ID[moodSuggestion.mood].label}</b>。
              {moodSuggestion.reason}
              <em>不准就点上面的脸改。</em>
            </span>
          )}
        </div>
      )}

      <div className="field-label">
        {promptForDate(date)}
        <span className="optional">一句话就够</span>
      </div>
      <textarea
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="不用写完整，想到什么写什么。"
        rows={4}
      />

      <div className="progress-box">
        <div className="field-label">
          <Icon name="progress" size={16} />
          和昨天比，有进步吗？
          <span className="optional">选填</span>
        </div>
        <textarea
          className="text-input text-input-small"
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
          placeholder="哪怕只是早睡了半小时、多走了一段路。"
          rows={2}
        />
      </div>

      <div className="place-box">
        <div className="place-head">
          <Icon name="pin" size={15} />
          <span>在哪里</span>
          <span className="optional">会写进落款</span>
        </div>
        <div className="place-line">
          <input
            className="place-input"
            value={place?.label || ''}
            onChange={(e) => {
              const value = e.target.value
              setPlace((prev) =>
                value ? { ...(prev || {}), label: value } : undefined,
              )
            }}
            placeholder="家、学校、公司，或点右侧定位"
          />
          <button
            type="button"
            className="place-btn"
            onClick={handleLocate}
            disabled={locating}
          >
            <Icon name="pin" size={14} />
            {locating ? '定位中' : '定位'}
          </button>
        </div>
        {place?.lat != null && <p className="place-hint">坐标只存本机；反查地名会联网一次</p>}
      </div>

      <div className="photo-row">
        {photos.map((src, index) => (
          <div className="photo-thumb" key={index}>
            <img src={src} alt="" />
            <button
              type="button"
              className="photo-remove"
              onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
              aria-label="移除照片"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
        {photos.length < 6 && (
          <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>
            <Icon name={busy ? 'sparkle' : 'camera'} size={22} />
            <span>{busy ? '处理中' : '照片'}</span>
          </button>
        )}
        <button
          type="button"
          className={`audio-add ${recording ? 'recording' : ''}`}
          onClick={handleAudioButton}
        >
          <Icon name={recording ? 'stop' : 'mic'} size={22} />
          <span>
            {recording
              ? `停止 ${formatDuration(recordSeconds)}`
              : audio
                ? '重录语音'
                : '语音'}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {recording && (
        <div className="recording-hint">
          <span className="recording-dot" />
          正在录音 {formatDuration(recordSeconds)} · 再点一下停止（最长 3 分钟）
        </div>
      )}

      {audio && !recording && (
        <div className="audio-preview">
          <div className="audio-preview-head">
            <span>
              <Icon name="mic" size={15} /> 这一天的声音
            </span>
            <span>{formatDuration(audio.duration)}</span>
            <button type="button" className="audio-remove-text" onClick={() => setAudio(undefined)}>
              删除
            </button>
          </div>
          <audio controls src={audio.dataUrl} preload="metadata" />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="composer-foot">
        <div className="category-preview">
          会自动归到
          <b>
            {category.l1}
            {category.l2 ? ` · ${category.l2}` : ''}
          </b>
        </div>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          收好这一天
        </button>
      </div>
      {mood && <div className="mood-tip">{MOOD_BY_ID[mood].tip}</div>}
    </div>
  )
}
