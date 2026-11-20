import type { MoodId } from '../types'

export interface MoodDef {
  id: MoodId
  label: string
  color: string
  tip: string
}

/** 首页心情环、封面和常用心情选择里的 8 个基础心情。 */
export const MOODS: MoodDef[] = [
  { id: 'happy', label: '开心', color: '#F6C84C', tip: '今天有好事发生' },
  { id: 'excited', label: '兴奋', color: '#F58F4B', tip: '有点忍不住想分享' },
  { id: 'calm', label: '平静', color: '#8FC3E4', tip: '安安稳稳的一天' },
  { id: 'neutral', label: '一般', color: '#D8CBB2', tip: '说不上好也说不上坏' },
  { id: 'tired', label: '累', color: '#A9B4C7', tip: '只想躺一会儿' },
  { id: 'sad', label: '难过', color: '#A6A1D8', tip: '心里有点沉' },
  { id: 'anxious', label: '焦虑', color: '#7FC4A2', tip: '脑子停不下来' },
  { id: 'angry', label: '生气', color: '#EF6B5E', tip: '今天有点火大' },
]

/** “更多”表情库里的 42 个扩展心情。 */
export const EXTRA_MOODS: MoodDef[] = [
  // 基础
  { id: 'worry', label: '担心', color: '#B9A7D6', tip: '心里悬着一件事' },
  { id: 'great', label: '非常棒', color: '#F58F4B', tip: '今天状态很好' },
  { id: 'blue', label: '忧郁', color: '#58739B', tip: '有一点说不上来的低落' },
  { id: 'blank', label: '无感', color: '#C8C2B8', tip: '今天没什么波动' },
  { id: 'flutter', label: '心动', color: '#F3B6C8', tip: '有一点点小鹿乱撞' },
  { id: 'good', label: '好', color: '#F6C84C', tip: '今天还不错' },
  { id: 'hmph', label: '哼', color: '#72C7C7', tip: '有点小情绪' },
  { id: 'sleepy', label: '困觉', color: '#4D5A88', tip: '现在只想睡觉' },
  { id: 'furious', label: '气坏了', color: '#E7683F', tip: '今天真的被气到了' },
  { id: 'hyper', label: '上头', color: '#91B86B', tip: '脑子一热，停不下来' },
  { id: 'decayed', label: '颓废', color: '#8C8DD6', tip: '今天想摆烂一会儿' },

  // 可爱
  { id: 'laugh', label: 'hahahh', color: '#F7D7A8', tip: '笑到停不下来' },
  { id: 'wink', label: 'wink', color: '#9B79D8', tip: '悄悄给你一个眼神' },
  { id: 'loved', label: '爱了爱了', color: '#D8C7F8', tip: '有被可爱到' },
  { id: 'daze', label: '发呆', color: '#C8F0A0', tip: '脑子暂时放空' },
  { id: 'shy', label: '害羞', color: '#F5BFD0', tip: '有点不好意思' },
  { id: 'madcute', label: '好气哦', color: '#D94B3E', tip: '气鼓鼓但还是很可爱' },
  { id: 'startled', label: '惊', color: '#8CDDE0', tip: '被吓了一跳' },
  { id: 'tangled', label: '纠结', color: '#F2A6C8', tip: '左右都想，拿不定主意' },
  { id: 'almostcry', label: '快哭了', color: '#6C86C9', tip: '眼眶有点热' },
  { id: 'wow', label: '哇', color: '#E8B4F0', tip: '被惊艳到了' },
  { id: 'speechless', label: '无语', color: '#ABB3C4', tip: '一时间不知道说什么' },
  { id: 'kiss', label: '么么哒', color: '#CDB7F5', tip: '想给你一个亲亲' },
  { id: 'evil', label: '邪恶', color: '#E86A4A', tip: '脑子里冒出一个坏主意' },
  { id: 'joy', label: '愉悦', color: '#F2D46E', tip: '心情轻轻地飘起来' },
  { id: 'dizzy', label: '晕', color: '#9CC3E8', tip: '转得有点晕乎乎的' },
  { id: 'drunk', label: '醉了', color: '#A98BD8', tip: '有点上头，有点迷糊' },

  // 搞怪
  { id: 'bashful', label: '羞羞羞', color: '#CBB8E8', tip: '捂脸，不好意思看' },
  { id: 'hehe', label: '嘿嘿', color: '#D8CFC0', tip: '偷偷笑一下' },
  { id: 'awkward', label: '囧', color: '#96B8D9', tip: '场面有一点尴尬' },
  { id: 'chuckle', label: '呵呵', color: '#E8C97A', tip: '礼貌而不失尴尬地笑' },
  { id: 'expect', label: '期待', color: '#F7E2A6', tip: '在等一件好事发生' },
  { id: 'peace', label: '平和', color: '#F39A62', tip: '心里很安稳' },
  { id: 'blush', label: '羞', color: '#F3B3C3', tip: '脸有点热热的' },
  { id: 'horror', label: '恐怖', color: '#A9A9A9', tip: '被吓到了' },
  { id: 'sulk', label: '赌气', color: '#80BC78', tip: '不想理人，先气一会儿' },
  { id: 'gloom', label: '愁', color: '#A9A9A9', tip: '愁得皱起眉头' },
  { id: 'delight', label: '欢喜', color: '#F6D66B', tip: '藏不住的开心' },
  { id: 'sideeye', label: '白眼', color: '#F29A6D', tip: '给你一个眼神自己体会' },
  { id: 'aggrieved', label: '委屈', color: '#B8B8B8', tip: '有点想哭，但先忍着' },
  { id: 'shock', label: '惊吓', color: '#A7C0C9', tip: '魂都吓飞了一半' },

  // 热门
  { id: 'joyful', label: '快乐', color: '#F58F4B', tip: '今天是轻快的一天' },
]

export const ALL_MOODS: MoodDef[] = [...MOODS, ...EXTRA_MOODS]

export const MOOD_BY_ID: Record<MoodId, MoodDef> = ALL_MOODS.reduce(
  (acc, m) => {
    acc[m.id] = m
    return acc
  },
  {} as Record<MoodId, MoodDef>,
)

export function moodById(id: MoodId): MoodDef {
  return MOOD_BY_ID[id] || MOOD_BY_ID.neutral
}

export interface MoodGroup {
  id: string
  label: string
  hint: string
  moods: MoodDef[]
}

function groupMoods(ids: MoodId[]): MoodDef[] {
  return ids.map((id) => MOOD_BY_ID[id]).filter(Boolean)
}

/** “更多表情”里的四页，对应参考里的四组表情仓库。 */
export const MOOD_GROUPS: MoodGroup[] = [
  {
    id: 'basic',
    label: '基础',
    hint: '日常里最常见的那些心情',
    moods: groupMoods([
      'worry',
      'great',
      'tired',
      'calm',
      'blue',
      'blank',
      'flutter',
      'good',
      'angry',
      'hmph',
      'sleepy',
      'furious',
      'hyper',
      'decayed',
    ]),
  },
  {
    id: 'cute',
    label: '可爱',
    hint: '一点点心动和小情绪',
    moods: groupMoods([
      'laugh',
      'wink',
      'loved',
      'daze',
      'shy',
      'madcute',
      'startled',
      'tangled',
      'almostcry',
      'wow',
      'speechless',
      'kiss',
      'evil',
      'joy',
      'dizzy',
      'drunk',
    ]),
  },
  {
    id: 'funny',
    label: '搞怪',
    hint: '不好意思说出口的怪心情',
    moods: groupMoods([
      'bashful',
      'hehe',
      'awkward',
      'happy',
      'chuckle',
      'expect',
      'peace',
      'blush',
      'horror',
      'dizzy',
      'sulk',
      'gloom',
      'delight',
      'sideeye',
      'aggrieved',
      'shock',
    ]),
  },
  {
    id: 'hot',
    label: '热门',
    hint: '最常被点到的表情',
    moods: groupMoods([
      'dizzy',
      'kiss',
      'wink',
      'madcute',
      'happy',
      'joy',
      'loved',
      'joyful',
      'shy',
      'laugh',
      'drunk',
      'evil',
      'wow',
      'daze',
      'tangled',
      'expect',
    ]),
  },
]
