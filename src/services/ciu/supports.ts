import type {
  CaniuseAgents,
  CaniuseBrowserStats,
  CaniuseStats,
  FeatureSupport,
} from '../../types'
import { BROWSERS, FEATURE_IDENTIFIERS } from '../../common/constants'
import { getBrowserPeriods, type PeriodStats } from '../periods'

export function getFeatureSupport(
  rawSupport: CaniuseBrowserStats,
  agents: CaniuseAgents,
): FeatureSupport[] {
  const supports: FeatureSupport[] = []

  for (const browser of BROWSERS) {
    const agent = agents[browser]
    if (!agent)
      continue

    const stats = rawSupport?.[browser] || {}
    supports.push({
      browser,
      periods: getBrowserPeriods(agent, version => getPartialPeriodAboutStats(stats[version])),
    })
  }
  return supports
}

/**
 * caniuse 的 stats 是空格分隔的字符串，例如 `'a x #1 #3'`
 *
 * - `#n` 是 `notes_by_num` 的引用，当前不展示，先去掉
 * - `p` 表示需要 polyfill，按不支持处理
 * - `'y x'` 表示「支持，但需要前缀」，应归为需要前缀，不能同时展示为完全支持
 * - `'y d'` 表示「默认关闭，可通过浏览器标识启用」，应归为不支持 + flag
 */
function getPartialPeriodAboutStats(stats = ''): PeriodStats {
  const tokens = new Set<CaniuseStats>(
    stats
      .replace(/#\d+/g, '')
      .replaceAll('p', 'n')
      .trim()
      .split(/\s+/)
      .filter(Boolean) as CaniuseStats[],
  )

  // `y` 与其它状态同时出现时，以其它状态为准
  if (tokens.size > 1)
    tokens.delete(FEATURE_IDENTIFIERS.supported)
  // flag 未开启时特性不可用
  if (tokens.has(FEATURE_IDENTIFIERS.flagged))
    tokens.add(FEATURE_IDENTIFIERS.unsupported)

  // caniuse 数据缺失该版本时，语义是未知
  const result = tokens.size ? [...tokens] : [FEATURE_IDENTIFIERS.unknown]

  return { stats: result }
}
