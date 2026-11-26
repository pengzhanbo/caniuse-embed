import type { BaselineFeatureData, Discouraged, FeatureStatus, Status } from '../types'
import { formatId } from '../utils/format-id'

export function getBaselineStatusData(
  features: Record<string, BaselineFeatureData>,
): Record<string, FeatureStatus> {
  const res: Record<string, FeatureStatus> = {}

  const update = (feature: string, status: Status | undefined, discouraged?: Discouraged) => {
    const id = formatId(feature)
    const prev = res[id] || {} as FeatureStatus
    const baseline = discouraged ? 'discouraged' : status?.baseline || prev.baseline || false
    res[id] = { ...prev, baseline, support: status?.support || prev.support || {} }
    if (discouraged && baseline === 'discouraged') {
      res[id].reason = discouraged.reason
    }
    const date = baseline === 'discouraged'
      ? discouraged?.removal_date
      : baseline === 'high'
        ? status?.baseline_high_date
        : baseline === 'low'
          ? status?.baseline_low_date
          : undefined
    if (date)
      res[id].date = date
  }

  for (const [feature, data] of Object.entries(features)) {
    // discouraged 特性即使没有 headline status，也需要写入展示数据
    if (data.status || data.discouraged)
      update(data.caniuse?.[0] || feature, data.status, data.discouraged)

    if (data.compat_features?.length && (data.status?.by_compat_key || data.discouraged)) {
      // `features` 以 web-features id（kebab-case）为键，而这里的 feature 是
      // BCD compat key（如 `api.document.write`），因此不能再用 features[feature]
      // 取 discouraged，必须使用当前 web-feature 自身的 discouraged 信息。
      for (const compatKey of data.compat_features) {
        const status = data.status?.by_compat_key?.[compatKey]
        if (status || data.discouraged)
          update(compatKey, status, data.discouraged)
      }
    }
  }
  return res
}
