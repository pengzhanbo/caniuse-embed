import type { BrowserName } from '@mdn/browser-compat-data'
import type {
  Browser,
  CaniuseAgents,
  FeatureUsage,
  SupportBlock,
} from '../../types'
import { toArray } from '@pengzhanbo/utils'
import { FEATURE_IDENTIFIERS } from '../../common/constants'
import { sumUsage } from '../../utils/sum-usage'
import { getCaniuseStats } from './supports'

const desktopBrowsers: Browser[] = [] // 仅统计桌面浏览器的使用情况
let totalUsage = 0
/**
 * 计算特性的使用情况
 */
export function computeUsage(support: SupportBlock, agents: CaniuseAgents): FeatureUsage | undefined {
  if (desktopBrowsers.length === 0) {
    for (const [name, { type, usage_global }] of Object.entries(agents)) {
      if (type === 'desktop') {
        desktopBrowsers.push(name as Browser)
        totalUsage += Object.values(usage_global).reduce((a, b) => sumUsage(a, b), 0)
      }
    }
  }
  // 由于不了解 caniuse.com 的计算规则
  // 无法计算出与之相符的结果
  // 实现待定

  let supported = 0
  let partial = 0

  for (const browser of desktopBrowsers) {
    const supports = toArray(support[browser as BrowserName])
    const agent = agents[browser as Browser]

    if (!agent)
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
    supported = (supported / totalUsage) * 100
    partial = (partial / totalUsage) * 100
    return { supported, partial, total: supported + partial }
  }
  return undefined
}
