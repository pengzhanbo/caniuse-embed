export type PeriodType = 'past_5' | 'past_4' | 'past_3' | 'past_2' | 'past_1' | 'current' | 'future' | 'future_1' | 'future_2' | 'future_3'

export interface Period {
  period: PeriodType
  version: string
  usage: string
}

export interface BrowserData {
  browser: string
  periods: Period[]
}
