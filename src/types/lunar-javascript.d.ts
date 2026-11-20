declare module 'lunar-javascript' {
  export interface SolarDate {
    getYear(): number
    getMonth(): number
    getDay(): number
    getLunar(): LunarDate
    getFestivals(): string[]
  }

  export interface LunarDate {
    getYear(): number
    getMonth(): number
    getDay(): number
    getMonthInChinese(): string
    getDayInChinese(): string
    getFestivals(): string[]
    getOtherFestivals(): string[]
    getSolar(): SolarDate
  }

  export interface LunarMonth {
    getDayCount(): number
  }

  export interface LunarYear {
    getMonth(month: number): LunarMonth | null
  }

  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarDate
  }

  export const Lunar: {
    fromYmd(year: number, month: number, day: number): LunarDate
  }

  export const LunarYear: {
    fromYear(year: number): LunarYear
  }
}
