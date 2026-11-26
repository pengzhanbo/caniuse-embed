import type { CaniuseBrowserAgent, CaniuseStats, FeatureSupportPeriod, PeriodType } from '../types'
import { decimalAdd } from '@pengzhanbo/utils'
import { MAX_FUTURE, MAX_PAST } from '../common/constants'
import { normalizeVersion } from '../utils/normalize-version'

export type PeriodStats = Pick<
  FeatureSupportPeriod,
  'stats' | 'supported' | 'partialSupported' | 'prefixed' | 'unknown' | 'flag'
>

export type GetVersionStats = (version: string) => PeriodStats

/**
 * 占位的空周期（浏览器没有更多历史 / 未来版本时补位）
 *
 * 这里只保留最小字段：每个特性 10 个浏览器 × 9 个周期
 */
function emptyPeriod(period: PeriodType): FeatureSupportPeriod {
  return { period, version: [''], usage: 0 }
}

function statsEqual(a: CaniuseStats[] | undefined, b: CaniuseStats[] | undefined): boolean {
  if (a === b)
    return true
  if (!a || !b)
    return false
  if (a.length !== b.length)
    return false
  return a.join(',') === b.join(',')
}

/**
 * 以当前最新发行版本为基准，生成 过去 5 个版本 / 当前版本 / 未来 3 个版本 的周期数据
 *
 * caniuse 与 BCD 两个数据源只有「如何获取某个版本的支持状态」不同，
 * 这里复用同一套周期合并逻辑，避免两份实现继续分叉。
 */
export function getBrowserPeriods(
  agent: Pick<CaniuseBrowserAgent, 'current_version' | 'version_list'>,
  getStats: GetVersionStats,
): FeatureSupportPeriod[] {
  const { current_version, version_list = [] } = agent
  const found = version_list.findIndex(({ version }) => version === current_version)
  if (found < 0) {
    // 上游数据变化导致 current_version 不在版本列表中时，
    // 退化为使用最新的一个版本，并告警，而不是直接抛出 TypeError
    console.warn(
      `[caniuse-embed] 当前版本 "${current_version}" 不在版本列表中，已使用最新的版本作为基准。`,
    )
  }

  const index = found >= 0 ? found : version_list.length - 1
  if (index < 0)
    return []

  const current = version_list[index]
  const currentVersion = current?.version || current_version

  const periods: FeatureSupportPeriod[] = [{
    period: 'current',
    version: [currentVersion],
    usage: current?.global_usage ?? 0,
    ...getStats(currentVersion),
  }]

  let pastPeriod: FeatureSupportPeriod | null = null
  let past = MAX_PAST
  // 查找过去的版本
  // 对于每个具体版本，如果多个相邻版本具有相同的支持情况，则将相邻版本合并
  for (let i = index - 1; i >= 0; i--) {
    const item = version_list[i]
    if (!item)
      break

    const { version, global_usage } = item
    const partial = getStats(version)
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
    else if (statsEqual(pastPeriod.stats, partial.stats)) {
      pastPeriod.usage = decimalAdd(pastPeriod.usage, global_usage)
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
    for (; past > 0; past--)
      periods.unshift(emptyPeriod(`past_${MAX_PAST - past + 1}` as PeriodType))
  }

  let futurePeriod: FeatureSupportPeriod | null = null
  let future = 1
  // 查找未来的版本，对于每个具体版本，如果多个相邻版本具有相同的支持情况，则将相邻版本合并
  for (let j = index + 1; j < version_list.length; j++) {
    const item = version_list[j]
    if (!item)
      break

    const { version, global_usage } = item
    const partial = getStats(version)

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
    else if (statsEqual(futurePeriod.stats, partial.stats)) {
      futurePeriod.usage = decimalAdd(futurePeriod.usage, global_usage)
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
    for (; future <= MAX_FUTURE; future++)
      periods.push(emptyPeriod(`future_${future}` as PeriodType))
  }

  return periods
}
