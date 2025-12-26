import type {
  BrowserName,
  Browsers,
  CaniuseAgents,
  CaniuseBrowserAgent,
  FeatureSupport,
  FeatureSupportPeriod,
  PeriodType,
  SimpleSupportStatement,
  SupportBlock,
} from '../../types'
import { deepEqual } from '@pengzhanbo/utils'
import {
  BROWSERS,
  CANIUSE_BROWSER_TO_BCD_BROWSERS,
  FEATURE_IDENTIFIERS,
  MAX_FUTURE,
  MAX_PAST,
} from '../../common/constants'
import { sumUsage } from '../../utils/sum-usage'
import { getCaniuseStats } from './caniuse-status'
import { mirrorSupport } from './mirror-support'
import { normalizeVersion } from './normalize-version'

export function getFeatureSupport(rawSupport: SupportBlock, agents: CaniuseAgents, browsers: Browsers): FeatureSupport[] {
  const supports: FeatureSupport[] = []

  for (const browser of BROWSERS) {
    const name = (CANIUSE_BROWSER_TO_BCD_BROWSERS[browser] || browser) as BrowserName
    const support = mirrorSupport(rawSupport, browsers, name)
    const agent = agents[browser]

    supports.push({
      browser,
      periods: getBrowserPeriods(support, agent),
    })
  }

  return supports
}

function getBrowserPeriods(support: SimpleSupportStatement[], agent: CaniuseBrowserAgent): FeatureSupportPeriod[] {
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
        version: [normalizeVersion(version, 1)],
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
          pastPeriod.version.unshift(normalizeVersion(version))
        else
          pastPeriod.version[0] = normalizeVersion(version)
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
        version: [normalizeVersion(version)],
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
          futurePeriod.version.push(normalizeVersion(version, 1))
        else
          futurePeriod.version[1] = normalizeVersion(version, 1)
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
  supports: SimpleSupportStatement[],
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
