import type { CaniuseCompatData, CaniuseData, FeatureData } from '../../types'
import { uniq } from '@pengzhanbo/utils'
import { FEATURE_IDENTIFIERS } from '../../common/constants'
import { getFeatureSupport } from './supports'

export function* ciu2FeatureList({ data, agents }: CaniuseData): Generator<FeatureData> {
  for (const [featureName, compat] of Object.entries(data)) {
    const stats = flattenStatsValues(compat.stats)
    yield {
      id: featureName,
      source: 'caniuse',
      paths: featureName,
      title: compat.title,
      url: getCiuLink(featureName, compat.links),
      description: compat.description,
      deprecated: false,
      experimental: false,
      prefixed: stats.includes(FEATURE_IDENTIFIERS.prefixed),
      unknown: stats.includes(FEATURE_IDENTIFIERS.unknown),
      flag: stats.includes(FEATURE_IDENTIFIERS.flagged),
      usage: {
        partial: compat.usage_perc_a,
        supported: compat.usage_perc_y,
        total: compat.usage_perc_a + compat.usage_perc_y,
      },
      supports: getFeatureSupport(compat.stats, agents),
    }
  }
}

function getCiuLink(name: string, links: CaniuseCompatData['links']): string {
  const fallback = `https://caniuse.com/${name}`
  if (!links?.length)
    return fallback
  return links.find(({ url }) => url.includes('developer.mozilla.org'))?.url
    || fallback
}

function flattenStatsValues(stats: CaniuseCompatData['stats']): string {
  const result: string[] = []
  for (const versions of Object.values(stats)) {
    result.push(...Object.values(versions).flatMap(value => value.split(' ')))
  }
  return uniq(result).join(' ')
}
