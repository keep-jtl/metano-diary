import type { MoodId } from '../types'
import { MOOD_BY_ID } from './moods'

interface WordRule {
  word: string
  weight: number
}

const RULES: Record<MoodId, WordRule[]> = {
  happy: [
    { word: '开心', weight: 3 },
    { word: '高兴', weight: 3 },
    { word: '快乐', weight: 3 },
    { word: '愉快', weight: 2 },
    { word: '开森', weight: 3 },
    { word: '美好', weight: 2 },
    { word: '幸运', weight: 2 },
    { word: '惊喜', weight: 2 },
    { word: '满足', weight: 2 },
    { word: '舒服', weight: 2 },
    { word: '顺利', weight: 2 },
    { word: '成功', weight: 2 },
    { word: '被夸', weight: 2 },
    { word: '好棒', weight: 2 },
    { word: '笑死', weight: 2 },
    { word: '开怀', weight: 2 },
    { word: '心情不错', weight: 2 },
    { word: '轻松', weight: 2 },
    { word: '安心', weight: 2 },
  ],
  excited: [
    { word: '兴奋', weight: 3 },
    { word: '激动', weight: 3 },
    { word: '期待', weight: 2 },
    { word: '迫不及待', weight: 3 },
    { word: '太棒了', weight: 3 },
    { word: '热血', weight: 2 },
    { word: '振奋', weight: 3 },
    { word: '冲', weight: 1 },
    { word: '燃', weight: 2 },
  ],
  calm: [
    { word: '平静', weight: 3 },
    { word: '安静', weight: 2 },
    { word: '安稳', weight: 2 },
    { word: '踏实', weight: 2 },
    { word: '平和', weight: 2 },
    { word: '放松', weight: 2 },
    { word: '悠闲', weight: 2 },
    { word: '慢慢', weight: 1 },
    { word: '散步', weight: 1 },
    { word: '阳光', weight: 1 },
    { word: '喝茶', weight: 1 },
    { word: '看书', weight: 1 },
    { word: '日常', weight: 1 },
    { word: '不焦虑', weight: 3 },
    { word: '不累了', weight: 3 },
  ],
  neutral: [
    { word: '一般', weight: 3 },
    { word: '平常', weight: 2 },
    { word: '普通', weight: 2 },
    { word: '照常', weight: 2 },
    { word: '没什么', weight: 2 },
    { word: '没啥', weight: 2 },
    { word: '还行', weight: 2 },
    { word: '老样子', weight: 2 },
  ],
  tired: [
    { word: '累', weight: 2 },
    { word: '疲惫', weight: 3 },
    { word: '好困', weight: 3 },
    { word: '困', weight: 1 },
    { word: '好累', weight: 2 },
    { word: '心累', weight: 2 },
    { word: '精疲力尽', weight: 3 },
    { word: '熬夜', weight: 2 },
    { word: '没力气', weight: 3 },
    { word: '撑不住', weight: 3 },
    { word: '睡不够', weight: 3 },
    { word: '不想动', weight: 2 },
    { word: '躺', weight: 1 },
    { word: '忙了一天', weight: 1 },
    { word: '乏力', weight: 2 },
  ],
  sad: [
    { word: '难过', weight: 3 },
    { word: '伤心', weight: 3 },
    { word: '失落', weight: 3 },
    { word: '委屈', weight: 3 },
    { word: '想哭', weight: 3 },
    { word: '低落', weight: 3 },
    { word: '沮丧', weight: 3 },
    { word: '破防', weight: 2 },
    { word: '心酸', weight: 2 },
    { word: '遗憾', weight: 2 },
    { word: '孤独', weight: 2 },
    { word: '寂寞', weight: 2 },
    { word: '压抑', weight: 2 },
    { word: '不开心', weight: 3 },
    { word: '没意思', weight: 2 },
    { word: '心里空', weight: 2 },
    { word: '空空的', weight: 2 },
    { word: '提不起劲', weight: 2 },
    { word: '没劲', weight: 2 },
  ],
  anxious: [
    { word: '焦虑', weight: 3 },
    { word: '紧张', weight: 3 },
    { word: '担心', weight: 3 },
    { word: '害怕', weight: 3 },
    { word: '慌', weight: 2 },
    { word: '压力', weight: 2 },
    { word: '不安', weight: 3 },
    { word: '内耗', weight: 3 },
    { word: '睡不着', weight: 2 },
    { word: '来不及', weight: 2 },
    { word: '烦躁', weight: 2 },
    { word: '心跳很快', weight: 2 },
    { word: '停不下来', weight: 2 },
    { word: '想太多', weight: 2 },
  ],
  angry: [
    { word: '生气', weight: 3 },
    { word: '愤怒', weight: 3 },
    { word: '火大', weight: 3 },
    { word: '气死', weight: 3 },
    { word: '讨厌', weight: 2 },
    { word: '恼火', weight: 3 },
    { word: '暴躁', weight: 3 },
    { word: '无语', weight: 2 },
    { word: '吵架', weight: 2 },
    { word: '不公平', weight: 2 },
    { word: '烦', weight: 1 },
    { word: '气到', weight: 2 },
    { word: '受不了', weight: 2 },
  ],
}

const NEGATIONS = ['不', '没', '没有', '别', '并不', '不太', '毫不', '无']

function isNegated(text: string, index: number): boolean {
  const prefix = text.slice(Math.max(0, index - 4), index)
  return NEGATIONS.some((word) => prefix.endsWith(word))
}

function collect(text: string, mood: MoodId): { score: number; words: string[] } {
  let score = 0
  const words: string[] = []
  for (const rule of RULES[mood]) {
    let from = 0
    while (from < text.length) {
      const index = text.indexOf(rule.word, from)
      if (index < 0) break
      if (!isNegated(text, index)) {
        score += rule.weight
        if (!words.includes(rule.word)) words.push(rule.word)
      }
      from = index + rule.word.length
    }
  }
  return { score, words }
}

export interface MoodSuggestion {
  mood: MoodId
  score: number
  words: string[]
  reason: string
}

export function senseMood(text: string, progress = ''): MoodSuggestion {
  const source = `${text} ${progress}`.trim()
  let bestMood: MoodId = 'neutral'
  let bestScore = 0
  let bestWords: string[] = []

  ;(Object.keys(RULES) as MoodId[]).forEach((mood) => {
    const result = collect(source, mood)
    if (result.score > bestScore) {
      bestMood = mood
      bestScore = result.score
      bestWords = result.words
    }
  })

  if (bestScore === 0) {
    return {
      mood: 'neutral',
      score: 0,
      words: [],
      reason: '文字里还没有明显的情绪词，先按“一般”记着，也可以自己选一个。',
    }
  }

  const label = MOOD_BY_ID[bestMood].label
  const reason =
    bestWords.length === 1 && bestWords[0] === label
      ? '文字里的情绪很直接。'
      : `文字里有 ${bestWords
          .slice(0, 3)
          .map((word) => `「${word}」`)
          .join('、')}，我把它记成「${label}」。`
  return {
    mood: bestMood,
    score: bestScore,
    words: bestWords,
    reason,
  }
}
