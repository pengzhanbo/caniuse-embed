import type {
  // Browser,
  CaniuseAgents,
  FeatureUsage,
  SupportBlock,
} from '../../types'
// import { toArray } from '@pengzhanbo/utils'
// import { compareVersion } from '../../utils/compare-version'
// import { BCD_BROWSERS_TO_CANIUSE_BROWSERS } from '../data'

/**
 * TODO 计算 BCD 特性的使用情况
 * 计算特性的使用情况
 *
 */
export function computeUsage(_support: SupportBlock, _agents: CaniuseAgents): FeatureUsage | undefined {
  // 由于不了解 caniuse.com 的计算规则
  // 无法计算出与之相符的结果
  // 实现待定

  // let supported = 0

  // for (const browser in support) {
  //   const name = (BCD_BROWSERS_TO_CANIUSE_BROWSERS[browser] || browser) as Browser
  //   const info = toArray(support[browser as keyof SupportBlock])[0]!
  //   const agent = agents[name]

  //   if (!agent || info === 'mirror' || info.version_added === false)
  //     continue

  //   const added = normalizeVersion(info.version_added)
  //   // const removed = normalizeVersion(info.version_removed || '')

  //   for (const { version, global_usage } of agent.version_list) {
  //     const ver = normalizeVersion(version)
  //     if (
  //       compareVersion(ver, added) >= 0
  //       // && (removed ? compareVersion(ver, removed) < 0 : true)
  //     ) {
  //       supported += global_usage * 10000000
  //     }
  //   }
  // }
  // if (supported > 0) {
  //   supported = Math.round(supported / 100000) / 100
  //   return { supported, partial: 0, total: supported }
  // }
  return undefined
}

// function normalizeVersion(version: string): string {
//   if (version.includes('-'))
//     version = version.split('-')[1]!
//   if (version.startsWith('<='))
//     return '0'
//   return version
// }
