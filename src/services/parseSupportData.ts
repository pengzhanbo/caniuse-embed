import type { FeatureBrowserSupport, FeatureSupport } from '../types'
import { PERIODS } from '../common/constants'

export function parseSupportData(supports: FeatureSupport[]): [string, FeatureBrowserSupport[]][] {
  const map: Record<string, FeatureBrowserSupport[]> = {}

  for (const support of supports) {
    const { periods, browser } = support
    for (const { period, ...rest } of periods) {
      const item = (map[period] ??= [])
      item.push({ browser, ...rest })
    }
  }
  const supportList: [string, FeatureBrowserSupport[]][] = []
  PERIODS.forEach((period) => {
    supportList.push([period, map[period]!])
  })

  return supportList
}
