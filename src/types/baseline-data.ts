export interface WebFeaturesData {
  features: Record<string, BaselineFeatureData>
}
/**
 * 特征数据条目
 *
 * 一个特征已永久迁移至唯一其他ID
 *
 * 一个特征已拆分为两个或更多其他特征
 */
export interface BaselineFeatureData {
  /**
   * caniuse.com 标识符
   */
  caniuse?: string[]
  /**
   * 此功能的支持数据来源
   */
  compat_features?: string[]
  /**
   * 功能简短描述，以纯文本字符串形式呈现
   */
  description?: string
  /**
   * 该功能的简短描述，以HTML字符串形式呈现
   */
  description_html?: string
  /**
   * 开发者是否被正式劝阻使用此功能
   */
  discouraged?: Discouraged
  /**
   * Group identifiers
   */
  group?: string[]
  kind: Kind
  /**
   * Short name
   */
  name?: string
  /**
   * Snapshot identifiers
   */
  snapshot?: string[]
  /**
   * Specification URLs
   */
  spec?: string[]
  /**
   * 一项功能是否被视为“基线”网络平台功能，以及它何时达到该状态
   */
  status?: StatusHeadline
  /**
   * The new ID for this feature
   */
  redirect_target?: string
  /**
   * The new IDs for this feature
   */
  redirect_targets?: string[]
}

/**
 * 开发者是否被正式劝阻使用此功能
 */
export interface Discouraged {
  /**
   * 指向正式弃用通知的链接，例如规范文本、意图弃用声明等。
   */
  according_to: string[]
  /**
   * 替代此功能部分或全部效用的功能ID
   */
  alternatives?: string[]
  /**
   * 关于为何不推荐使用该功能的简要、面向开发者的说明
   */
  reason: string
  /**
   * 一段面向开发者的简要说明，解释为何不推荐使用该功能，以HTML字符串形式呈现。
   */
  reason_html: string
  /**
   * 预期或实际的移除日期，例如“2029-12-31”。仅在所有当前实施供应商已宣布计划取消该功能，或该功能已从所有浏览器中移除时设置。
   */
  removal_date?: string
}
export type Kind = 'feature' | 'moved' | 'split'
/**
 * 一项功能是否被视为“基线”网络平台功能，以及它何时达到
 * 该状态
 */
export interface StatusHeadline {
  /**
   * 该特征是否为基线（low 状态）、基线（high 状态）或非基线（false）
   */
  baseline: false | BaselineEnum
  /**
   * 该功能达到基线 high 状态的日期
   */
  baseline_high_date?: string
  /**
   * 该功能达到基线 low 状态的日期
   */
  baseline_low_date?: string
  /**
   * 功能兼容性列表中每个键的状态（如适用）。
   */
  by_compat_key?: {
    [key: string]: Status
  }
  /**
   * 最近引入该功能的浏览器版本
   */
  support: BaselineSupport
}

export type BaselineEnum = 'high' | 'low'
export interface Status {
  /**
   * 该特征是否为基线（low 状态）、基线（high 状态）或非基线（false）
   */
  baseline: false | BaselineEnum
  /**
   * 该功能达到基线 high 状态的日期
   */
  baseline_high_date?: string
  /**
   * 该功能达到基线 low 状态的日期
   */
  baseline_low_date?: string
  /**
   * 最近引入该功能的浏览器版本
   */
  support: BaselineSupport
  [property: string]: any
}

/**
 * Browser versions that most-recently introduced the feature
 */
export interface BaselineSupport {
  chrome?: string
  chrome_android?: string
  edge?: string
  firefox?: string
  firefox_android?: string
  safari?: string
  safari_ios?: string
}
