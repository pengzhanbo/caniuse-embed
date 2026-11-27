import type {
  BrowserName,
  Browsers,
  CaniuseAgents,
  FeatureSupport,
  SimpleSupportStatement,
  SupportBlock,
} from '../../types'
import {
  BROWSERS,
  CANIUSE_BROWSER_TO_BCD_BROWSERS,
} from '../../common/constants'
import { getBrowserPeriods, type PeriodStats } from '../periods'
import { getCaniuseStats } from './caniuse-status'
import { mirrorSupport } from './mirror-support'

export function getFeatureSupport(rawSupport: SupportBlock, agents: CaniuseAgents, browsers: Browsers): FeatureSupport[] {
  const supports: FeatureSupport[] = []

  for (const browser of BROWSERS) {
    const name = (CANIUSE_BROWSER_TO_BCD_BROWSERS[browser] || browser) as BrowserName
    const support = mirrorSupport(rawSupport, browsers, name)
    const agent = agents[browser]

    if (!agent)
      continue

    supports.push({
      browser,
      periods: getBrowserPeriods(agent, version => getPartialPeriodAboutStats(support, version)),
    })
  }

  return supports
}

export function getPartialPeriodAboutStats(
  supports: SimpleSupportStatement[],
  version: string,
): PeriodStats {
  return { stats: getCaniuseStats(supports, version) }
}
