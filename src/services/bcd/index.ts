import type { CaniuseAgents, FeatureData, FeatureSupport, MDNCompatData } from '../../types'
import { omit } from '@pengzhanbo/utils'
import { FEATURE_IDENTIFIERS } from '../../common/constants'
import { computeUsage } from './compute-usage'
import { flattenCompatData } from './flatten-compat-data'
import { formatTitle } from './format-title'
import { getFeatureSupport } from './supports'

/**
 * 转换为 feature 的生成器函数
 */
export function* bcd2FeatureList(bcd: MDNCompatData, agents: CaniuseAgents): Generator<FeatureData> {
  const data = omit(bcd, ['__meta', 'browsers', 'mediatypes', 'webdriver', 'webextensions'])

  for (const { compat, paths, descriptions } of flattenCompatData(data)) {
    const supports = getFeatureSupport(compat.support, agents)
    const stats = flattenSupportsStats(supports)
    yield {
      id: `mdn-${paths.join('_')}`.toLowerCase(),
      source: 'mdn',
      paths: paths.join('.'),
      title: formatTitle(paths, descriptions),
      url: compat.mdn_url || '',
      description: '', // mdn 的 description 实际上被用于 标题，因此这里为空
      deprecated: compat.status?.deprecated || false,
      experimental: compat.status?.experimental || false,
      prefixed: stats.includes(FEATURE_IDENTIFIERS.prefixed),
      unknown: stats.includes(FEATURE_IDENTIFIERS.unknown),
      flag: stats.includes(FEATURE_IDENTIFIERS.flagged),
      usage: computeUsage(compat.support, agents), // Not implemented 未实现
      supports,
    }
  }
}

function flattenSupportsStats(supports: FeatureSupport[]): string {
  return supports.flatMap(support => support.periods.map(period => period.stats), Infinity).join(' ')
}
