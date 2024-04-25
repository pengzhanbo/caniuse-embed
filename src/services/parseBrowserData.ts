import { BROWSERS, PERIODS } from '../common/constants'
import type { BrowserData, CaniuseAgents } from '../types'
import { toFixed } from '../utils/toFixed'

export function parseBrowserData(agents: CaniuseAgents) {
  const browserData: BrowserData[] = []

  for (const browser of BROWSERS) {
    const agent = agents[browser]
    const currentVersion = agent.current_version
    const currentVersionIndex = agent.version_list.length < 2
      ? 0
      : agent.version_list.findIndex(v => v.era === 0)
    const item: BrowserData = { browser, periods: [] }

    for (const period of PERIODS) {
      let version!: string
      if (period === 'current') {
        version = currentVersion
      }
      else if (period.startsWith('past_')) {
        const n = Number(period[5])
        version = agent.version_list[currentVersionIndex - n]?.version
      }
      else if (period.startsWith('future_')) {
        const n = Number(period[7])
        version = agent.version_list[currentVersionIndex + n]?.version
      }
      const usage = toFixed(agent.usage_global[version] || 0)
      item.periods.push({
        period,
        version,
        usage: usage === 0 ? '0.00%' : `${usage}%`,
      })
    }
    browserData.push(item)
  }
  return browserData
}
