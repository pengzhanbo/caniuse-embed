import type {
  BaselineFeatureData,
  CaniuseData,
  FeatureData,
  FeatureDataVersions,
  FeatureStatus,
  MDNCompatData,
} from '../types'
import { getBaselineStatusData } from './baseline'
import { bcd2FeatureList } from './bcd'
import { ciu2FeatureList } from './ciu'
import { ensureUniqueFeatureIds } from './ensure-unique-ids'

export interface FeatureDataBundle {
  featureList: FeatureData[]
  baseline: Record<string, FeatureStatus>
  bcdUpdated: string
  ciuUpdated: number
  /** 本次构建实际使用的上游数据版本（本地回退时为本地版本） */
  versions?: FeatureDataVersions | undefined
}

function assertUpstream(condition: unknown, message: string): asserts condition {
  if (!condition)
    throw new Error(`[caniuse-embed] 上游数据结构异常: ${message}`)
}

/**
 * 对远程数据做最小结构校验
 *
 * 上游改键时，报错信息需要指向具体的数据集，而不是在很远的
 * `Object.entries(undefined)` 处抛出 `TypeError`。
 */
function assertDataShape(bcd: MDNCompatData, caniuse: CaniuseData, webFeatures: Record<string, BaselineFeatureData>) {
  assertUpstream(bcd && typeof bcd === 'object', 'BCD 数据为空')
  assertUpstream(bcd.__meta?.timestamp, 'BCD 缺少 __meta.timestamp')
  assertUpstream(bcd.browsers && typeof bcd.browsers === 'object', 'BCD 缺少 browsers')
  assertUpstream(caniuse?.data && typeof caniuse.data === 'object', 'caniuse 缺少 data')
  assertUpstream(caniuse.agents && typeof caniuse.agents === 'object', 'caniuse 缺少 agents')
  assertUpstream(
    webFeatures && typeof webFeatures === 'object' && !Array.isArray(webFeatures),
    'web-features 缺少 features（应为 { [id]: feature }）',
  )
}

/**
 * 将三份上游数据转换为构建期使用的特性数据
 *
 * `scripts/datagen.ts` 与 `get-feature-list.ts` 共用这一处实现，
 * 避免两份转换逻辑各自演化、互相对不上。
 */
export function buildFeatureData(
  bcd: MDNCompatData,
  caniuse: CaniuseData,
  webFeatures: Record<string, BaselineFeatureData>,
): FeatureDataBundle {
  assertDataShape(bcd, caniuse, webFeatures)

  const featureList = ensureUniqueFeatureIds([
    ...bcd2FeatureList(bcd, caniuse.agents),
    ...ciu2FeatureList(caniuse),
  ])

  return {
    bcdUpdated: bcd.__meta.timestamp,
    ciuUpdated: caniuse.updated * 1000,
    featureList,
    baseline: getBaselineStatusData(webFeatures),
  }
}
