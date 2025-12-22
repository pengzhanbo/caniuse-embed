import type {
  BrowserName,
  CaniuseAgents,
  CaniuseBrowserAgent,
  CaniuseStats,
  FeatureSupport,
  FeatureSupportPeriod,
  PeriodType,
  SimpleSupportStatement,
  SupportBlock,
} from '../../types'
import { deepEqual, toArray, uniq } from '@pengzhanbo/utils'
import {
  BCD_BROWSERS_TO_CANIUSE_BROWSERS,
  BROWSERS,
  FEATURE_IDENTIFIERS,
  MAX_FUTURE,
  MAX_PAST,
} from '../../common/constants'
import { compareVersion } from '../../utils/compare-version'
import { sumUsage } from '../../utils/sum-usage'

const versionPattern = /^\d+$|^\d+\.\d+$|^\d+\.\d+\.\d+$/

export function getFeatureSupport(rawSupport: SupportBlock, agents: CaniuseAgents): FeatureSupport[] {
  const supports: FeatureSupport[] = []

  for (const browser of BROWSERS) {
    const name = (BCD_BROWSERS_TO_CANIUSE_BROWSERS[browser] || browser) as BrowserName
    const support = toArray(rawSupport[name])
    const agent = agents[browser]

    supports.push({
      browser,
      periods: getBrowserPeriods(support, agent),
    })
  }

  return supports
}

function getBrowserPeriods(support: (SimpleSupportStatement | 'mirror')[], agent: CaniuseBrowserAgent): FeatureSupportPeriod[] {
  const { current_version, version_list } = agent
  const index = version_list.findIndex(({ version }) => version === current_version)

  // 以 当前最新发行版本 为基准
  const periods: FeatureSupportPeriod[] = [{
    period: 'current',
    version: [current_version],
    usage: version_list[index]!.global_usage,
    ...getPartialPeriodAboutStats(support, current_version),
  }]

  let pastPeriod: FeatureSupportPeriod | null = null
  let past = MAX_PAST
  // 查找过去的版本
  // 对于每个具体版本，如果多个相邻版本具有相同的支持情况，则将相邻版本合并
  for (let i = index - 1; i >= 0; i--) {
    const { version, global_usage } = version_list[i]!
    const partial = getPartialPeriodAboutStats(support, version)
    if (!pastPeriod) {
      pastPeriod = {
        period: `past_${MAX_PAST - past + 1}` as PeriodType,
        version: [version],
        usage: global_usage,
        ...partial,
      }
      periods.unshift(pastPeriod)
      past--
      if (past === 0)
        break
    }
    else {
      if (deepEqual(pastPeriod.stats, partial.stats)) {
        pastPeriod.usage = sumUsage(pastPeriod.usage, global_usage)
        if (pastPeriod.version.length < 2)
          pastPeriod.version.unshift(version)
        else
          pastPeriod.version[0] = version
      }
      else {
        pastPeriod = null
        i++
      }
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
    const partial = getPartialPeriodAboutStats(support, version)

    if (!futurePeriod) {
      futurePeriod = {
        period: `future_${future}` as PeriodType,
        version: [version],
        usage: global_usage,
        ...partial,
      }
      periods.push(futurePeriod)
      future++
      if (future > MAX_FUTURE)
        break
    }
    else {
      if (deepEqual(futurePeriod.stats, partial.stats)) {
        futurePeriod.usage = sumUsage(futurePeriod.usage, global_usage)
        if (futurePeriod.version.length < 2)
          futurePeriod.version.push(version)
        else
          futurePeriod.version[1] = version
      }
      else {
        futurePeriod = null
        j--
      }
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

function getPartialPeriodAboutStats(
  supports: (SimpleSupportStatement | 'mirror')[],
  version: string,
): Pick<
  FeatureSupportPeriod,
  'stats' | 'supported' | 'partialSupported' | 'prefixed' | 'unknown' | 'flag'
> {
  const stats = getCaniuseStats(supports, version)
  return {
    supported: stats.includes(FEATURE_IDENTIFIERS.supported),
    partialSupported: stats.includes(FEATURE_IDENTIFIERS.partial),
    unknown: stats.includes(FEATURE_IDENTIFIERS.unknown),
    flag: stats.includes(FEATURE_IDENTIFIERS.flagged),
    prefixed: stats.includes(FEATURE_IDENTIFIERS.prefixed),
    stats,
  }
}

function getCaniuseStats(supports: (SimpleSupportStatement | 'mirror')[], version: string): CaniuseStats[] {
  const support = supports[0]!
  if (!support)
    return [FEATURE_IDENTIFIERS.unknown]
  if (support === 'mirror')
    return [FEATURE_IDENTIFIERS.supported]

  if (support.version_added === false)
    return [FEATURE_IDENTIFIERS.unsupported]

  const stats: CaniuseStats[] = []
  const added = normalizeVersion(support.version_added)

  if (!versionPattern.test(version) || compareVersion(added, version) <= 0) {
    if (support.flags?.length) {
      stats.push(FEATURE_IDENTIFIERS.unsupported, FEATURE_IDENTIFIERS.flagged)
    }
    else {
      stats.push(FEATURE_IDENTIFIERS.supported)
    }
  }

  for (const extra of supports.slice(1)) {
    if (extra === 'mirror' || extra.version_added === false)
      continue
    const added = normalizeVersion(extra.version_added)
    const removed = normalizeVersion(extra.version_removed || '')
    if (compareVersion(added, version) <= 0
      && (removed ? compareVersion(removed, version) > 0 : true)
    ) {
      if (extra.flags?.length) {
        stats.push(FEATURE_IDENTIFIERS.unsupported, FEATURE_IDENTIFIERS.flagged)
      }
      else {
        stats.push(FEATURE_IDENTIFIERS.supported)
      }
    }
    extra.prefix && stats.push(FEATURE_IDENTIFIERS.prefixed)
    extra.partial_implementation && stats.push(FEATURE_IDENTIFIERS.partial)
  }

  if (stats.length === 0)
    stats.push(FEATURE_IDENTIFIERS.unsupported)

  return uniq(stats)
}

function normalizeVersion(version: string): string {
  if (version.includes('-'))
    version = version.split('-')[0]!
  if (version.startsWith('<='))
    return '0'
  return version
}
