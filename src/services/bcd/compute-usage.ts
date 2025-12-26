import type {
  Browser,
  BrowserName,
  Browsers,
  CaniuseAgents,
  FeatureUsage,
  SupportBlock,
} from '../../types'
import { CANIUSE_BROWSER_TO_BCD_BROWSERS, FEATURE_IDENTIFIERS } from '../../common/constants'
import { sumUsage } from '../../utils/sum-usage'
import { getCaniuseStats } from './caniuse-status'
import { mirrorSupport } from './mirror-support'

type Device = 'desktop' | 'mobile'

const globalUsages: Record<Device, {
  browserList: Browser[]
  total: number
}> = {
  desktop: { browserList: [], total: 0 },
  mobile: { browserList: [], total: 0 },
}

function computedGlobalUsage(agents: CaniuseAgents, device: Device) {
  const global = globalUsages[device]
  if (global.browserList.length === 0) {
    for (const [name, { type, usage_global }] of Object.entries(agents)) {
      if (type === device) {
        global.browserList.push(name as Browser)
        global.total += Object.values(usage_global).reduce((a, b) => sumUsage(a, b), 0)
      }
    }
  }
}

function computedUsageWithDevice(support: SupportBlock, agents: CaniuseAgents, browsers: Browsers, device: Device): FeatureUsage | undefined {
  const { browserList, total } = globalUsages[device]
  let supported = 0
  let partial = 0
  for (const browser of browserList) {
    const name = (CANIUSE_BROWSER_TO_BCD_BROWSERS[browser] || browser) as BrowserName
    const supports = mirrorSupport(support, browsers, name)
    const agent = agents[browser]

    if (!agent || supports.length === 0)
      continue

    for (const { version, global_usage } of agent.version_list) {
      const stats = getCaniuseStats(supports, version)
      if (stats.includes(FEATURE_IDENTIFIERS.partial))
        partial = sumUsage(partial, global_usage)
      else if (stats.includes(FEATURE_IDENTIFIERS.supported))
        supported = sumUsage(supported, global_usage)
    }
  }
  if (supported > 0 || partial > 0) {
    supported = (supported / total) * 100
    partial = (partial / total) * 100
    return { supported, partial, total: supported + partial }
  }
  return undefined
}

/**
 * 计算特性的使用情况
 */
export function computeUsage(support: SupportBlock, agents: CaniuseAgents, browsers: Browsers): FeatureUsage | undefined {
  computedGlobalUsage(agents, 'desktop')
  computedGlobalUsage(agents, 'mobile')

  const desktop = computedUsageWithDevice(support, agents, browsers, 'desktop')
  const mobile = computedUsageWithDevice(support, agents, browsers, 'mobile')

  if (desktop && mobile) {
    const supported = (desktop.supported + mobile.supported) / 2
    const partial = (desktop.partial + mobile.partial) / 2
    return {
      supported,
      partial,
      total: supported + partial,
    }
  }
  return desktop || mobile
}
