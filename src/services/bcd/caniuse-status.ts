import type { CaniuseStats, SimpleSupportStatement } from '../../types'
import { FEATURE_IDENTIFIERS } from '../../common/constants'
import { compareVersion } from '../../utils/compare-version'
import { normalizeVersion } from '../../utils/normalize-version'

type StatsCache = WeakMap<SimpleSupportStatement[], Map<string, CaniuseStats[]>>

/**
 * 以 support 数组的引用作为缓存键。
 */
let statsCache: StatsCache = new WeakMap()

export function clearStatsCache(): void {
  statsCache = new WeakMap()
}

/**
 * 判断某条 support 语句是否覆盖指定版本
 *
 * 数组语义是「按优先级描述的多个版本区间」，对某个具体版本
 * 应当取数组中第一个覆盖该版本的语句，而不是把所有命中语句的状态取并集。
 */
function coversVersion(statement: SimpleSupportStatement, version: string): boolean {
  // `version_added: false` 表示该浏览器明确不支持此特性
  if (statement.version_added === false)
    return true

  const added = normalizeVersion(statement.version_added)
  if (added && compareVersion(added, version) > 0)
    return false

  const removed = statement.version_removed
    ? normalizeVersion(statement.version_removed)
    : ''
  if (removed && compareVersion(version, removed) >= 0)
    return false

  return true
}

function toStats(statement: SimpleSupportStatement): CaniuseStats[] {
  // 明确不支持
  if (statement.version_added === false)
    return [FEATURE_IDENTIFIERS.unsupported]

  const stats: CaniuseStats[] = []
  const flagged = Boolean(statement.flags?.length)

  // flag 未开启时特性不可用，同时标注「可通过浏览器标识启用」
  if (flagged)
    stats.push(FEATURE_IDENTIFIERS.unsupported, FEATURE_IDENTIFIERS.flagged)

  // 别名实现说明标准名称不可用，按部分支持处理
  if (statement.partial_implementation || statement.alternative_name)
    stats.push(FEATURE_IDENTIFIERS.partial)

  // 需要前缀时，仅在支持前缀写法的引擎中可用
  if (statement.prefix)
    stats.push(FEATURE_IDENTIFIERS.prefixed)

  if (stats.length === 0)
    stats.push(FEATURE_IDENTIFIERS.supported)

  return stats
}

function hasValidStatement(supports: SimpleSupportStatement[]): boolean {
  return supports.some(statement => Boolean(statement.version_added))
}

export function getCaniuseStats(supports: SimpleSupportStatement[], version: string): CaniuseStats[] {
  if (!supports?.length)
    return [FEATURE_IDENTIFIERS.unknown]

  let byVersion = statsCache.get(supports)
  const cached = byVersion?.get(version)
  if (cached)
    return cached

  const statement = supports.find(item => coversVersion(item, version))

  // 没有任何语句覆盖该版本时，通常是「尚未实现」（早于首个 version_added）
  // 或「已被移除」（晚于 version_removed 且没有后续语句），都应展示为不支持。
  // 只有数据本身缺失（version_added 为空）才是真正的未知。
  const result = statement
    ? Array.from(new Set(toStats(statement)))
    : [hasValidStatement(supports) ? FEATURE_IDENTIFIERS.unsupported : FEATURE_IDENTIFIERS.unknown]

  if (!byVersion) {
    byVersion = new Map()
    statsCache.set(supports, byVersion)
  }
  byVersion.set(version, result)

  return result
}
