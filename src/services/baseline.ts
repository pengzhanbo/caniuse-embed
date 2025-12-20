import type { BaselineFeatureData, Discouraged, FeatureStatus, Status } from '../types'

export function getBaselineStatusData(
  features: Record<string, BaselineFeatureData>,
): Record<string, FeatureStatus> {
  const res: Record<string, FeatureStatus> = {}

  const update = (feature: string, status: Status, discouraged?: Discouraged) => {
    const prev = res[feature] || {} as FeatureStatus
    const baseline = discouraged ? 'discouraged' : status.baseline || prev.baseline || false
    res[feature] = { ...prev, baseline, support: status.support || prev.support }
    if (discouraged && baseline === 'discouraged') {
      res[feature].reason = discouraged.reason
    }
    const date = baseline === 'discouraged'
      ? discouraged?.removal_date
      : baseline === 'high'
        ? status.baseline_high_date
        : baseline === 'low'
          ? status.baseline_low_date
          : undefined
    if (date)
      res[feature].date = date
  }
  for (const [feature, data] of Object.entries(features)) {
    if (data.status)
      update(data.caniuse?.[0] || feature, data.status, data.discouraged)

    if (data.status?.by_compat_key && data.compat_features?.length) {
      for (const feature of data.compat_features) {
        const status = data.status.by_compat_key[feature]
        if (status)
          update(feature, status, features[feature]?.discouraged)
      }
    }
  }
  return res
}
