export interface DailyQuote {
  file: string
  text: string
}

/** 21 张每日鼓励插画和对应的一句话。 */
export const DAILY_QUOTES: DailyQuote[] = [
  {
    file: '01-morning-window.webp',
    text: '今天不用一下子变得很好，先把自己叫醒，就已经在往前走了。',
  },
  {
    file: '02-sprout.webp',
    text: '慢慢长，也算长大。你不需要在一天里证明自己。',
  },
  {
    file: '03-winding-path.webp',
    text: '路弯一点没关系，只要还在走，就会到想去的地方。',
  },
  {
    file: '04-book-stars.webp',
    text: '你读过的每一页，都会在某个时刻替你照亮一步。',
  },
  {
    file: '05-coffee-heart.webp',
    text: '先照顾好今天的自己，别把温柔都留给明天。',
  },
  {
    file: '06-rain-window.webp',
    text: '下雨天不必假装晴朗，安静地待一会儿，也是一种恢复。',
  },
  {
    file: '07-paper-boat.webp',
    text: '再小的船也能过河，再小的进步也值得被记住。',
  },
  {
    file: '08-passing-light.webp',
    text: '你不用一个人扛所有事。被接住的时候，也允许自己松一口气。',
  },
  {
    file: '09-rest-tree.webp',
    text: '休息不是偷懒，是把力气还给自己。',
  },
  {
    file: '10-calendar-sun.webp',
    text: '把今天过好，就是对未来最稳的承诺。',
  },
  {
    file: '11-bicycle-flowers.webp',
    text: '去走走吧，风会替你翻过心里那一页。',
  },
  {
    file: '12-ink-bird.webp',
    text: '写下来，乱糟糟的心事就会有一条可以走的路。',
  },
  {
    file: '13-stairs-light.webp',
    text: '你不需要看见整段楼梯，只要先迈出下一级。',
  },
  {
    file: '14-kite.webp',
    text: '有些自由不是跑到很远，而是终于敢松开手。',
  },
  {
    file: '15-cozy-bed.webp',
    text: '今天到这里就好，睡一觉，明天再继续。',
  },
  {
    file: '16-warm-soup.webp',
    text: '好好吃饭，是对自己最具体的爱。',
  },
  {
    file: '17-mirror-light.webp',
    text: '你比镜子里的自己，更值得被好好看见。',
  },
  {
    file: '18-forest-path.webp',
    text: '走过的路不会白走，它们正在把你带到更开阔的地方。',
  },
  {
    file: '19-star-jar.webp',
    text: '把小小的好收集起来，难过的时候它们会发光。',
  },
  {
    file: '20-cloud-hug.webp',
    text: '累了就靠一靠，世界不会因为你停一下就消失。',
  },
  {
    file: '21-seed-flower.webp',
    text: '你现在埋下的每一件小事，都在悄悄准备一场花开。',
  },
]

export function dailyQuoteFor(date: string): DailyQuote {
  const [year, month, day] = date.split('-').map((part) => Number(part))
  const stamp = Date.UTC(year, (month || 1) - 1, day || 1)
  const index = Math.abs(Math.floor(stamp / 86400000)) % DAILY_QUOTES.length
  return DAILY_QUOTES[index]
}
