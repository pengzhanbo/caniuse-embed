export type Browser = 'ie' | 'edge' | 'firefox' | 'chrome' | 'safari' | 'ios_saf' | 'op_mini' | 'and_chr' | 'android' | 'samsung'

/**
 * 浏览器信息
 */
export interface CaniuseBrowserAgent {
  abbr: string
  /**
   * 浏览器名称
   */
  browser: string
  /**
   * 浏览器全称
   */
  long_name: string
  /**
   * 浏览器当前发行版本
   */
  current_version: string
  /**
   * 浏览器前缀，比如 webkit、ms
   */
  prefix: string
  /**
   * 浏览器所属平台类型 (e.g: desktop or mobile)
   */
  type: string
  /**
   * 不同版本的使用率（即市场占有率）
   * { [版本号]: 使用率 }
   */
  usage_global: Record<string, number>
  /**
   * 不同版本的信息列表
   */
  version_list: {
    /**
     * 版本距离现行版本的周期，0 表示现行版本，负数表示过去版本，正数表示未来版本
     */
    era: number
    /**
     * 当前版本的使用率
     */
    global_usage: number
    /**
     * 浏览器前缀，比如 webkit、ms
     */
    prefix: string
    /**
     * 发行日期，时间戳
     */
    release_date: number
    /**
     * 版本号
     */
    version: string
  }[]
}

/**
 * 特性的兼容数据
 */
export interface CaniuseCompatData {
  /**
   * 特性名称
   */
  title: string
  /**
   * 包含该功能可读性描述的字符串。
   */
  description: string
  /**
   * 测试用例的链接
   */
  spec: string

  /**
   * 特性的兼容状态
   */
  status: keyof CaniuseStatus

  /**
   * 文档链接
   */
  links: { title: string, url: string }[]

  /**
   * 特性的分类 {@link CaniuseCats}
   */
  categories: string[]

  /**
   * 不同浏览器的兼容数据
   * ```md
   * {
   *   [浏览器]: {
   *      [版本号]: 当前特性的支持状态
   *   }
   * }
   * ```
   * - `'n'` 不支持
   * -  `'a'` 仅部分支持，即表示该特性仅部分可用
   * - `'u'` 未知
   * - `'y'` 支持
   * - `'x'` 支持，但是需要前缀
   * - `'d'` 通过浏览器标识启用
   */
  stats: CaniuseBrowserStats

  /**
   * 备注
   */
  notes: string

  /**
   * 以数字为键的备注，格式为 `{ [数字]: 备注 }`
   *
   * 在 stats 中，可能包含 `#num`，关联到此处
   */
  notes_by_num: Record<string, string>

  /**
   * 实现当前特性的浏览器的使用率
   */
  usage_perc_y: number

  /**
   * 仅实现当前特性部分功能的浏览器的使用率
   */
  usage_perc_a: number

  /**
   * [暂时未知其含义]
   */
  ucprefix: string

  /**
   * 所属父级特性
   */
  parent: string

  /**
   * 关键词
   */
  keywords: string
}

export type CaniuseBrowserStats = Record<Browser, Record<string, CaniuseStats>>

export interface CaniuseStatus {
  rec: string // W3C 推荐标准
  pr: string // W3C 提案推荐标准
  cr: string // W3C 候选推荐标准
  wd: string // W3C工作草案
  ls: string // WHATWG 现行标准
  other: string // 其他
  unoff: string // 非官方/备注
}

export interface CaniuseCats {
  'CSS': string[]
  'HTML5': string[]
  'JS': string[]
  'JS API': string[]
  'Other': string[]
  'Security': string[]
  'SVG': string[]
}

export type CaniuseStats
  = | 'n' // 不支持
    | 'a' // 仅部分支持，即表示该特性仅部分可用
    | 'u' // 未知
    | 'y' // 支持
    | 'x' // 支持，但是需要前缀
    | 'd' // 通过浏览器标识启用
    | `${'a' | 'x' | 'd'} #${number}` // 仅部分支持，后面 `#1` 表示关联的 notes_by_num 序号

export type CaniuseAgents = Record<Browser, CaniuseBrowserAgent>

export interface CaniuseData {
  /**
   * 不同浏览器的信息
   */
  agents: CaniuseAgents
  /**
   * 不同特性的信息
   * { [特性 ID]: 兼容数据 }
   */
  data: Record<string, CaniuseCompatData>

  /**
   * 特性的进度状态集，包括推荐标准、推荐候选标准、工作草案等
   */
  statuses: CaniuseStatus

  /**
   * 分类
   */
  cats: CaniuseCats
  /**
   * 数据最后更新时间
   */
  updated: number
}
