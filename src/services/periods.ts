import type { CaniuseBrowserAgent, CaniuseStats, FeatureSupportPeriod, PeriodType } from '../types'
import { decimalAdd } from '@pengzhanbo/utils'
import { MAX_FUTURE, MAX_PAST } from '../common/constants'
import { normalizeVersion } from '../utils/normalize-version'

export interface PeriodStats {
  stats: CaniuseStats[]
}

export type GetVersionStats = (version: string) => PeriodStats

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
 * 只返回真实存在的周期：浏览器没有更多历史 / 未来版本时不补空占位，
 * 渲染层通过显式 `grid-column` 对齐，避免 70% 的周期对象只是空壳。
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

  return periods
}
