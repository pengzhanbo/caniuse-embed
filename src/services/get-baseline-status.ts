import type { FeatureData, FeatureStatus } from '../types'
import { baselineInfo, months } from '../common/baseline'

function formatDate(date: string | undefined): string {
  const [year, month] = date?.split('-') || []
  if (!year)
    return ''
  return month ? `${months[+month - 1]} ${year}` : year
}

export function getBaselineStatus(status: FeatureStatus | undefined, { deprecated, experimental }: FeatureData) {
  // discouraged 比 BCD 的 deprecated 更具体（带原因与移除时间），优先展示
  // `status` 缺失表示 web-features 尚未收录，不能等同于「不是 Baseline」
  const type = status?.baseline === 'discouraged'
    ? 'discouraged'
    : experimental
      ? 'experimental'
      : deprecated
        ? 'deprecated'
        : status
          ? status.baseline === false ? 'limit' : status.baseline
          : 'unknown'
  const { title, label, description } = baselineInfo[type]
  const date = formatDate(status?.date)
  const [year] = status?.date?.split('-') || []

  const finalTitle = title?.replace('{date}', year || '')
  let finalDesc = description.replace('{date}', date)
  if (type === 'discouraged' && date)
    finalDesc = `${finalDesc} Removal is expected as early as ${date}.`

  return {
    type,
    title: finalTitle,
    description: finalDesc,
    label,
    reason: status?.reason || '',
  }
}
