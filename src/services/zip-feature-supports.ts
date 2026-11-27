import type { FeatureSupport, FeatureSupportPeriod } from '../types'
import { BROWSERS, PERIODS } from '../common/constants'

/**
 * zipFeatureSupports
 *
 * 数据层只保存真实存在的周期；渲染层在这里为缺失的浏览器补一个空单元格，
 * 既保持 10 列网格的视觉连续，又不把空占位写进缓存。
 *
 * @return [period, support[]]
 */
export function zipFeatureSupports(
  supports: FeatureSupport[],
): (readonly [string, (FeatureSupportPeriod & { browser: string })[]])[] {
  const map: Record<string, Map<string, FeatureSupportPeriod>> = {}
  for (const { periods, browser } of supports) {
    for (const period of periods) {
      const item = (map[period.period] ??= new Map())
      item.set(browser, period)
    }
  }

  return PERIODS.map((period): readonly [string, (FeatureSupportPeriod & { browser: string })[]] => {
    const byBrowser = map[period]
    return [period, BROWSERS.map((browser): FeatureSupportPeriod & { browser: string } => {
      const item = byBrowser?.get(browser)
      return item
        ? { browser, ...item }
        : { browser, period, version: [''], usage: 0 }
    })]
  })
    // 过滤掉没有任何浏览器存在该周期的行（全部为空占位）
    .filter(([, periods]) => periods.some(period => period.version[0]))
}
