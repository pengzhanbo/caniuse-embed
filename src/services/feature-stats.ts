import type { FeatureSupport } from '../types'
import { FEATURE_IDENTIFIERS } from '../common/constants'

/**
 * 特性级「未知支持」只统计主流浏览器
 *
 * BCD 几乎不提供 Opera Mini 的支持数据，如果把它也算进来，
 * 几乎所有特性都会带上 `unknown` 标记，图例中的「?」失去区分度。
 */
const MAINSTREAM_BROWSERS = new Set(['chrome', 'edge', 'firefox', 'safari'])

function isCurrentOrFuture(period: string): boolean {
  return period === 'current' || period.startsWith('future_')
}

export function hasMainstreamUnknown(supports: FeatureSupport[]): boolean {
  return supports.some(({ browser, periods }) => MAINSTREAM_BROWSERS.has(browser) && periods.some(period => isCurrentOrFuture(period.period) && period.stats?.includes(FEATURE_IDENTIFIERS.unknown)))
}
