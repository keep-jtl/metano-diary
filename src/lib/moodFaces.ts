export type EyeStyle =
  | 'dot'
  | 'closed'
  | 'happy'
  | 'wink'
  | 'sad'
  | 'angry'
  | 'wide'
  | 'dizzy'
  | 'sleepy'
  | 'half'
  | 'side'
  | 'heart'
  | 'sparkle'
  | 'teary'
  | 'tiny'
  | 'line'

export type MouthStyle =
  | 'smile'
  | 'open'
  | 'laugh'
  | 'flat'
  | 'frown'
  | 'wavy'
  | 'small'
  | 'o'
  | 'kiss'
  | 'grit'
  | 'pout'
  | 'smirk'
  | 'tongue'

export type ExtraStyle =
  | 'blush'
  | 'tear'
  | 'sweat'
  | 'fire'
  | 'stars'
  | 'hearts'
  | 'sparkle'
  | 'hair'

export interface FaceSpec {
  eyes: EyeStyle
  mouth: MouthStyle
  extras?: ExtraStyle[]
}

/** 每个心情自己的五官组合；图形全部是 Metano 自己的手绘矢量脸。 */
export const FACE_SPECS: Record<string, FaceSpec> = {
  happy: { eyes: 'dot', mouth: 'smile', extras: ['sparkle'] },
  excited: { eyes: 'happy', mouth: 'open', extras: ['blush'] },
  calm: { eyes: 'dot', mouth: 'smile' },
  neutral: { eyes: 'dot', mouth: 'flat' },
  tired: { eyes: 'sleepy', mouth: 'flat', extras: ['sweat'] },
  sad: { eyes: 'sad', mouth: 'frown', extras: ['tear'] },
  anxious: { eyes: 'dot', mouth: 'wavy', extras: ['sweat'] },
  angry: { eyes: 'angry', mouth: 'grit' },

  worry: { eyes: 'tiny', mouth: 'small' },
  great: { eyes: 'happy', mouth: 'open', extras: ['sparkle', 'blush'] },
  blue: { eyes: 'sad', mouth: 'frown', extras: ['tear'] },
  blank: { eyes: 'tiny', mouth: 'flat' },
  flutter: { eyes: 'heart', mouth: 'small', extras: ['blush', 'hearts'] },
  good: { eyes: 'dot', mouth: 'smile' },
  hmph: { eyes: 'side', mouth: 'smirk' },
  sleepy: { eyes: 'sleepy', mouth: 'o' },
  furious: { eyes: 'angry', mouth: 'open', extras: ['fire'] },
  hyper: { eyes: 'sparkle', mouth: 'open', extras: ['stars'] },
  decayed: { eyes: 'sad', mouth: 'wavy', extras: ['hair', 'sweat'] },

  laugh: { eyes: 'happy', mouth: 'laugh', extras: ['blush'] },
  wink: { eyes: 'wink', mouth: 'smile' },
  loved: { eyes: 'heart', mouth: 'smile', extras: ['hearts', 'blush'] },
  daze: { eyes: 'wide', mouth: 'o' },
  shy: { eyes: 'closed', mouth: 'small', extras: ['blush'] },
  madcute: { eyes: 'angry', mouth: 'pout', extras: ['blush'] },
  startled: { eyes: 'wide', mouth: 'o', extras: ['sweat'] },
  tangled: { eyes: 'side', mouth: 'wavy', extras: ['sweat'] },
  almostcry: { eyes: 'teary', mouth: 'frown', extras: ['tear'] },
  wow: { eyes: 'sparkle', mouth: 'o', extras: ['stars'] },
  speechless: { eyes: 'line', mouth: 'flat', extras: ['sweat'] },
  kiss: { eyes: 'closed', mouth: 'kiss', extras: ['hearts'] },
  evil: { eyes: 'angry', mouth: 'smirk', extras: ['blush'] },
  joy: { eyes: 'happy', mouth: 'open', extras: ['sparkle'] },
  dizzy: { eyes: 'dizzy', mouth: 'wavy' },
  drunk: { eyes: 'half', mouth: 'wavy', extras: ['blush'] },

  bashful: { eyes: 'closed', mouth: 'small', extras: ['blush', 'hearts'] },
  hehe: { eyes: 'side', mouth: 'smirk' },
  awkward: { eyes: 'dot', mouth: 'flat', extras: ['sweat'] },
  chuckle: { eyes: 'happy', mouth: 'open' },
  expect: { eyes: 'wide', mouth: 'small', extras: ['sparkle'] },
  peace: { eyes: 'closed', mouth: 'smile' },
  blush: { eyes: 'closed', mouth: 'small', extras: ['blush'] },
  horror: { eyes: 'wide', mouth: 'o' },
  sulk: { eyes: 'side', mouth: 'pout' },
  gloom: { eyes: 'sad', mouth: 'flat' },
  delight: { eyes: 'happy', mouth: 'open', extras: ['sparkle'] },
  sideeye: { eyes: 'side', mouth: 'flat' },
  aggrieved: { eyes: 'sad', mouth: 'wavy', extras: ['tear'] },
  shock: { eyes: 'wide', mouth: 'o', extras: ['sweat'] },

  joyful: { eyes: 'happy', mouth: 'laugh', extras: ['sparkle'] },
}

export const DEFAULT_FACE_SPEC: FaceSpec = { eyes: 'dot', mouth: 'smile' }
