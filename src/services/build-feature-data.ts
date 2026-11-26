import type {
  BaselineFeatureData,
  CaniuseData,
  FeatureData,
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
