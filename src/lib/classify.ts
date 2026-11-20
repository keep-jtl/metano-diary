import type { LearnedCategory, MoodId } from '../types'

export interface SubCategoryDef {
  name: string
  keywords: string[]
}

export interface CategoryDef {
  name: string
  keywords: string[]
  subs: SubCategoryDef[]
}

/** 两级分类词典：一级固定，二级按命中关键词选择 */
export const CATEGORIES: CategoryDef[] = [
  {
    name: '学习成长',
    keywords: ['论文', '学分', '答辩', '课程表', '作业'],
    subs: [
      { name: '课程', keywords: ['上课', '课程', '老师', '课堂', '自习'] },
      { name: '考试', keywords: ['考试', '复习', '成绩', '四级', '六级', '刷题', '题目'] },
      { name: '阅读', keywords: ['读书', '看书', '笔记'] },
      { name: '技能', keywords: ['学习', '背单词', '实训'] },
    ],
  },
  {
    name: '工作项目',
    keywords: ['项目', '公司', '老板', '同事', '加班', '立项', '融资', '商业计划书', 'PPT', '建模', '剪辑', '团队', '甲方', '产品', '技术', '版本', '功能', '页面'],
    subs: [
      { name: '任务', keywords: ['任务', '交付', '开发', '代码', '上线', '需求', 'app', '跑通', '调试', '部署', '接口', '服务器', '数据库', '程序', '第一版'] },
      { name: '会议', keywords: ['会议', '汇报', '方案'] },
      { name: '竞赛', keywords: ['竞赛', '比赛', '路演'] },
      { name: '推进', keywords: ['推进', '进展', '客户'] },
      { name: '求职', keywords: ['面试', '简历', 'offer', '招聘', '实习'] },
    ],
  },
  {
    name: '生活日常',
    keywords: ['回家', '天气', '降温', '晴天', '下雨'],
    subs: [
      { name: '饮食', keywords: ['吃饭', '午饭', '晚饭', '早饭', '食堂', '外卖', '奶茶', '咖啡', '零食'] },
      { name: '出行', keywords: ['通勤', '打车', '地铁', '公交'] },
      { name: '消费', keywords: ['买东西', '快递', '花钱', '逛街'] },
      { name: '居家', keywords: ['宿舍', '打扫', '洗衣', '理发', '洗澡', '起床'] },
    ],
  },
  {
    name: '情绪心情',
    keywords: ['累', '烦', '崩溃', '疲惫', '生气', '火大', '心情'],
    subs: [
      { name: '开心', keywords: ['开心', '高兴', '幸福', '放松'] },
      { name: '低落', keywords: ['难过', '伤心', 'emo', '委屈', '孤独', '郁闷'] },
      { name: '焦虑', keywords: ['焦虑', '压力', '紧张', '内耗'] },
      { name: '平静', keywords: ['平静'] },
    ],
  },
  {
    name: '人际社交',
    keywords: ['社交'],
    subs: [
      { name: '家人', keywords: ['家人', '爸妈', '妈妈', '爸爸', '生日'] },
      { name: '朋友', keywords: ['朋友', '室友', '聚会', '请客', '礼物'] },
      { name: '同学', keywords: ['同学'] },
      { name: '感情', keywords: ['女朋友', '男朋友', '对象', '吵架', '和好', '聊天', '微信', '电话'] },
    ],
  },
  {
    name: '身体健康',
    keywords: ['健康'],
    subs: [
      { name: '运动', keywords: ['运动', '跑步', '健身', '打球', '篮球', '足球', '游泳', '锻炼'] },
      { name: '睡眠', keywords: ['睡眠', '失眠', '熬夜'] },
      { name: '健康', keywords: ['体检', '体重', '减肥'] },
      { name: '生病', keywords: ['生病', '感冒', '发烧', '头疼', '医院', '吃药'] },
    ],
  },
  {
    name: '兴趣娱乐',
    keywords: [],
    subs: [
      { name: '游戏', keywords: ['游戏', '王者', '原神', '蛋仔'] },
      { name: '影视', keywords: ['电影', '电视剧', '追剧', '动漫', '综艺'] },
      { name: '音乐', keywords: ['音乐', '听歌', '吉他', '演唱会'] },
      { name: '创作', keywords: ['画画', '摄影', '视频', '手工', '小说', 'B站', '抖音'] },
    ],
  },
  {
    name: '计划目标',
    keywords: ['今年', '明天', '下周'],
    subs: [
      { name: '待办', keywords: ['计划', '待办', '安排', '清单', '打卡'] },
      { name: '目标', keywords: ['目标', '决定', '坚持', '习惯', '想要'] },
      { name: '反思', keywords: ['复盘', '反思', '总结'] },
    ],
  },
]

export const L1_NAMES = [...CATEGORIES.map((c) => c.name), '其他']

export const STOPWORDS = new Set([
  '今天', '昨天', '明天', '后天', '然后', '就是', '感觉', '觉得', '真的', '还是',
  '有点', '一下', '自己', '我们', '他们', '她们', '这个', '那个', '因为', '所以',
  '但是', '而且', '现在', '时候', '东西', '没有', '什么', '怎么', '如果', '已经',
  '可以', '一个', '不是', '这么', '那么', '还有', '只是', '其实', '应该', '可能',
  '比较', '非常', '特别', '一直', '开始', '结束', '事情', '记录', '日记', '心情',
  '今天天气', '一点', '一些', '起来', '出来', '回来', '上去', '下去', '知道',
  '看到', '听到', '想说', '说话', '不过', '第一', '第二', '第三', '最后', '同时',
  '于是', '中间', '一会', '一会儿', '这次', '那次', '以后', '以前', '当时', '刚才',
  '后来', '然后', '本来', '原来', '突然', '感觉', '好像', '大概', '差不多', '整个',
  '也没有', '那么', '这样', '那样', '一点', '一点也', '居然', '竟然',
])

const PARTICLES = /[了的着过地得吗呢吧啊呀哦]/

/** 关键词云和学习词典共用的噪声词判断 */
export function isNoiseWord(word: string): boolean {
  if (!word) return true
  if (STOPWORDS.has(word)) return true
  if (word.length <= 2 && PARTICLES.test(word)) return true
  if (word.length <= 3 && /^[第这那]/.test(word)) return true
  return false
}

let segmenter: Intl.Segmenter | null = null
try {
  segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })
} catch {
  segmenter = null
}

/** 中文分词，用于关键词云和“纠正分类后学习” */
export function segmentWords(text: string): string[] {
  if (!text) return []
  if (segmenter) {
    const words: string[] = []
    for (const seg of segmenter.segment(text)) {
      if (seg.isWordLike) words.push(seg.segment)
    }
    return words
  }
  return text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let index = 0
  while ((index = haystack.indexOf(needle, index)) !== -1) {
    count += 1
    index += needle.length
  }
  return count
}

export interface ClassifyResult {
  l1: string
  l2?: string
  score: number
  auto: boolean
}

const EMOTIONAL_MOODS: MoodId[] = ['sad', 'anxious', 'angry', 'tired']

export function classify(
  text: string,
  learned: Record<string, LearnedCategory> = {},
  mood?: MoodId,
): ClassifyResult {
  const t = (text || '').toLowerCase().trim()
  if (!t) {
    if (mood && EMOTIONAL_MOODS.includes(mood)) {
      return { l1: '情绪心情', l2: undefined, score: 3, auto: true }
    }
    return { l1: '其他', score: 0, auto: true }
  }

  let best: ClassifyResult = { l1: '其他', score: 0, auto: true }

  for (const cat of CATEGORIES) {
    let score = 0
    for (const keyword of cat.keywords) {
      const n = countOccurrences(t, keyword.toLowerCase())
      if (n > 0) score += n * (keyword.length >= 2 ? 2 : 1)
    }

    let bestSub: string | undefined
    let bestSubScore = 0
    for (const sub of cat.subs) {
      let subScore = 0
      for (const keyword of sub.keywords) {
        const n = countOccurrences(t, keyword.toLowerCase())
        if (n > 0) subScore += n * 3
      }
      if (subScore > bestSubScore) {
        bestSubScore = subScore
        bestSub = sub.name
      }
      score += subScore
    }

    for (const [term, target] of Object.entries(learned)) {
      if (target.l1 === cat.name && term && t.includes(term.toLowerCase())) {
        score += 4
      }
    }

    if (score > best.score) {
      best = { l1: cat.name, l2: bestSub, score, auto: true }
    }
  }

  if (best.score < 3) {
    if (mood && EMOTIONAL_MOODS.includes(mood)) {
      return { l1: '情绪心情', score: best.score, auto: true }
    }
    return { l1: '其他', score: best.score, auto: true }
  }

  return best
}

/** 手动改分类后，把这段文字里的高频词学进词典 */
export function learnFromCorrection(
  text: string,
  l1: string,
  l2: string | undefined,
  learned: Record<string, LearnedCategory>,
): Record<string, LearnedCategory> {
  const next: Record<string, LearnedCategory> = { ...learned }
  const counts = new Map<string, number>()
  for (const raw of segmentWords(text)) {
    const word = raw.trim()
    if (word.length < 2 || word.length > 8) continue
    if (isNoiseWord(word)) continue
    if (!/[\u4e00-\u9fa5a-zA-Z]/.test(word)) continue
    counts.set(word, (counts.get(word) || 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  for (const [word] of top) {
    next[word] = { l1, l2 }
  }
  return next
}

export function subNames(l1: string): string[] {
  const cat = CATEGORIES.find((c) => c.name === l1)
  return cat ? cat.subs.map((s) => s.name) : []
}
