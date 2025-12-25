import type { CaniuseAgents, CaniuseBrowserAgent, CaniuseBrowserStats, CaniuseStats, FeatureSupport, FeatureSupportPeriod, PeriodType } from '../../types'
import { deepEqual } from '@pengzhanbo/utils'
import {
  BROWSERS,
  FEATURE_IDENTIFIERS,
  MAX_FUTURE,
  MAX_PAST,
} from '../../common/constants'
import { sumUsage } from '../../utils/sum-usage'

export function getFeatureSupport(
  rawSupport: CaniuseBrowserStats,
  agents: CaniuseAgents,
): FeatureSupport[] {
  const supports: FeatureSupport[] = []

  for (const browser of BROWSERS) {
    supports.push({
      browser,
      periods: getBrowserPeriods(rawSupport[browser], agents[browser]),
    })
  }
  return supports
}

function getBrowserPeriods(stats: Record<string, CaniuseStats>, agent: CaniuseBrowserAgent): FeatureSupportPeriod[] {
  const { current_version, version_list } = agent
  const index = version_list.findIndex(({ version }) => version === current_version)

  const periods: FeatureSupportPeriod[] = [{
    period: 'current',
    version: [current_version],
    usage: version_list[index]!.global_usage,
    ...getPartialPeriodAboutStats(stats[current_version]),
  }]

  let pastPeriod: FeatureSupportPeriod | null = null
  let past = MAX_PAST
  // 查找过去的版本
  // 对于每个具体版本，如果多个相邻版本具有相同的支持情况，则将相邻版本合并
  for (let i = index - 1; i >= 0; i--) {
    const { version, global_usage } = version_list[i]!
    const partial = getPartialPeriodAboutStats(stats[version])
    if (!pastPeriod) {
      pastPeriod = {
        period: `past_${MAX_PAST - past + 1}` as PeriodType,
        version: [normalizeVersion(version, 1)],
        usage: global_usage,
        ...partial,
      }
      periods.unshift(pastPeriod)
      past--
      if (past === 0)
        break
    }
    else if (deepEqual(pastPeriod.stats, partial.stats)) {
      pastPeriod.usage = sumUsage(pastPeriod.usage, global_usage)
      if (pastPeriod.version.length < 2)
        pastPeriod.version.unshift(normalizeVersion(version))
      else
        pastPeriod.version[0] = normalizeVersion(version)
    }
    else {
      pastPeriod = null
      i++
    }
  }
  pastPeriod = null
  if (past > 0) {
    for (; past > 0; past--) {
      periods.unshift({ period: `past_${MAX_PAST - past + 1}` as PeriodType, version: [''], usage: 0 })
    }
  }

  let futurePeriod: FeatureSupportPeriod | null = null
  let future = 1
  // 查找未来的版本，对于每个具体版本，如果多个相邻版本具有相同的支持情况，则将相邻版本合并
  for (let j = index + 1; j < version_list.length; j++) {
    const { version, global_usage } = version_list[j]!
    const partial = getPartialPeriodAboutStats(stats[version])

    if (!futurePeriod) {
      futurePeriod = {
        period: `future_${future}` as PeriodType,
        version: [normalizeVersion(version)],
        usage: global_usage,
        ...partial,
      }
      periods.push(futurePeriod)
      future++
      if (future > MAX_FUTURE)
        break
    }
    else if (deepEqual(futurePeriod.stats, partial.stats)) {
      futurePeriod.usage = sumUsage(futurePeriod.usage, global_usage)
      if (futurePeriod.version.length < 2)
        futurePeriod.version.push(normalizeVersion(version, 1))
      else
        futurePeriod.version[1] = normalizeVersion(version, 1)
    }
    else {
      futurePeriod = null
      j--
    }
  }

  futurePeriod = null
  if (future < MAX_FUTURE) {
    for (; future <= MAX_FUTURE; future++) {
      periods.push({ period: `future_${future}` as PeriodType, version: [''], usage: 0 })
    }
  }

  return periods
}

function getPartialPeriodAboutStats(stats = ''): Pick<
  FeatureSupportPeriod,
  'stats' | 'supported' | 'partialSupported' | 'prefixed' | 'unknown' | 'flag'
> {
  stats = stats.replace(/#\d+/g, '').replaceAll('p', 'n').trim()
  return {
    stats: stats.split(/\s+/) as CaniuseStats[],
    supported: stats.includes(FEATURE_IDENTIFIERS.supported),
    partialSupported: stats.includes(FEATURE_IDENTIFIERS.partial),
    unknown: stats.includes(FEATURE_IDENTIFIERS.unknown),
    flag: stats.includes(FEATURE_IDENTIFIERS.flagged),
  }
}

function normalizeVersion(version: string, index = 0): string {
  if (version.includes('-'))
    version = version.split('-')[index]!
  return version
}
