import type { FeatureSupport, FeatureSupportPeriod } from '../types'
import { PERIODS } from '../common/constants'

/**
 * zipFeatureSupports
 *
 * @return [period, support[]]
 */
export function zipFeatureSupports(
  supports: FeatureSupport[],
): (readonly [string, (FeatureSupportPeriod & { browser: string })[]])[] {
  const map: Record<string, (FeatureSupportPeriod & { browser: string })[]> = {}
  for (const { periods, browser } of supports) {
    for (const period of periods) {
      const item = (map[period.period] ??= [])
      item.push({ browser, ...period })
    }
  }

  return PERIODS.map(period => [period, map[period]!] as const)
    // 过滤掉没有支持情况的版本
    .filter(([, periods]) => !periods.every(period => !period.version[0]))
}
