import type { BaselineSupport } from './baseline-data'
import type { Browser, CaniuseStats } from './caniuse-data'

export type PeriodType = 'past_5' | 'past_4' | 'past_3' | 'past_2' | 'past_1' | 'current' | 'future' | 'future_1' | 'future_2' | 'future_3'

export interface FeatureData {
  /**
   * 特性唯一 id
   */
  id: string
  /**
   * 来源
   */
  source: 'mdn' | 'caniuse'
  /**
   * 路径 e.g: api.navigator.requestMediaKeySystemAccess
   */
  paths: string
  /**
   * 名称
   */
  title: string

  /**
   * 描述
   */
  description?: string

  /**
   * 特性相关文档链接
   */
  url: string

  /**
   * 在任意浏览器中是否存在 实验性支持
   */
  experimental: boolean
  /**
   * 在任意浏览器中是否存在 已被废弃
   */
  deprecated: boolean
  /**
   * 在任意浏览器中是否存在需要使用前缀，  如 `--webkit-` 等
   */
  prefixed: boolean
  /**
   * 在任意浏览器中是否存在 使用情况未知
   */
  unknown: boolean
  /**
   * 在任意浏览器中是否存在 需要通过浏览器标识启用功能
   */
  flag: boolean
  /**
   * 该特性的广泛使用情况
   *
   * 统计各种浏览器的各种版本的市场占有率，计算得出的特性支持率
   */
  usage?: FeatureUsage | undefined

  /**
   * 在各个浏览器中的支持情况
   */
  supports: FeatureSupport[]

  /**
   * 该特性的基线支持情况，baseline 表示该特性是否被视为基线平台功能
   */
  status?: FeatureStatus | undefined
}

export interface FeatureUsage {
  /**
   * 可稳定使用的浏览器占有率
   */
  supported: number
  /**
   * 未完全稳定支持的浏览器占有率
   */
  partial: number
  /**
   * 总的浏览器占有率
   */
  total: number

}

export interface FeatureSupport {
  browser: Browser
  periods: FeatureSupportPeriod[]
}

/**
 * 支持情况，根据不同的浏览器，以该浏览器的 latest 发行版本为基准，
 * 过去的 5 个版本，当前版本，未来的 3 个版本
 */
export interface FeatureSupportPeriod {
  /**
   * 版本相对于 current 发行版本的时期
   */
  period: PeriodType
  /**
   * 版本号
   */
  version: [string] | [string, string]
  /**
   * 该版本号的使用率
   */
  usage: number

  /**
   * 各个浏览器的支持情况
   */
  stats?: CaniuseStats[]

  /**
   * 是否支持
   */
  supported?: boolean
  /**
   * 是否部分支持
   */
  partialSupported?: boolean
  /**
   * 支持但需要前缀
   */
  prefixed?: boolean
  /**
   * 支持情况未知
   */
  unknown?: boolean
  /**
   * 支持但需要设置浏览器标识
   */
  flag?: boolean
}

export interface FeatureStatus {
  /**
   * 该功能是基线广泛可用、基线新近可用，还是非基线
   * - 'high': 基线广泛可用 widely available
   * - 'low': 基线新近可用 newly available
   * - 'discouraged': 劝阻使用此功能
   * - false: 非基线 limited availability
   */
  baseline: 'high' | 'low' | 'discouraged' | false
  /**
   * 该功能的基线日期
   * 格式为 `YYYY-MM-DD`
   */
  date?: string | undefined

  /**
   * 劝阻使用此功能的原因
   */
  reason?: string

  /**
   * 该功能在各个浏览器开始支持的版本
   * { [browser]: version }
   */
  support: BaselineSupport
}
