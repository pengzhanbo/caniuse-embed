import type { FeatureData, FeatureStatus } from '../types'
import { baselineInfo, months } from '../common/baseline'

export function getBaselineStatus(status: FeatureStatus | undefined, { deprecated, experimental }: FeatureData) {
  const type = experimental
    ? 'experimental'
    : deprecated
      ? 'deprecated'
      : status?.baseline === false ? 'limit' : (status?.baseline || 'limit')
  const { title, label, description } = baselineInfo[type]
  const [year, month] = status?.date?.split('-') || []

  const finalTitle = title?.replace('{date}', year || '')
  const finalDesc = description.replace('{date}', year && month ? `${months[+month - 1]} ${year}` : '')

  return {
    type,
    title: finalTitle,
    description: finalDesc,
    label,
    reason: status?.reason || '',
  }
}
