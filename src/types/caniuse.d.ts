export type Browser = 'ie' | 'edge' | 'firefox' | 'chrome' | 'safari' | 'ios_saf' | 'op_mini' | 'and_chr' | 'android' | 'samsung'

export interface CaniuseAgent {
  abbr: string
  browser: string
  current_version: string
  long_name: string
  prefix: string
  type: string
  usage_global: Record<string, number>
  version_list: {
    era: number
    global_usage: number
    prefix: string
    release_date: number
    version: string
  }[]
}

export type CaniuseFeatureList = [string, CaniuseDataOption][]

export interface CaniuseData {
  agents: CaniuseAgents
  data: CaniuseDataOptions
  updated: number
}

export type CaniuseAgents = Record<Browser, CaniuseAgent>
export type CaniuseDataOptions = Record<string, CaniuseDataOption>

export interface CaniuseDataOption {
  categories: string[]
  chrome_id: string
  title: string
  description: string
  keywords: string
  links: { title: string, url: string }[]
  notes: string
  notes_by_num: Record<number, string>
  parent: string
  spec: string
  stats: Record<Browser, Record<string, string>>
  status: string
  ucprefix: string
  usage_perc_a: number
  usage_perc_y: number
}
