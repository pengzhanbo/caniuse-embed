import type { FeatureData } from '../types'

interface DuplicateGroup {
  id: string
  features: FeatureData[]
}

/**
 * 保证特性 id 唯一
 *
 * BCD 中同时存在大小写不同的标识符，例如 `api.Crypto`（接口）与 `api.crypto`
 * （`navigator.crypto` 属性）。特性 id 会统一转成小写用于 URL，
 * 于是这些特性会生成相同的静态路径，Astro 只会保留其中一个，
 * 其余页面被静默丢弃。
 *
 * 这里做两件事：
 * 1. 对冲突的 id 生成确定性的唯一 id（保留原始路径为全小写的条目，
 *    避免影响线上已有的 URL，其余追加序号后缀）；
 * 2. 冲突处理后再次校验，仍有重复则直接抛错，让问题在构建期暴露，
 *    而不是静默丢失页面。
 *
 * 返回值是新数组，避免修改调用方 / dev 缓存复用的对象。
 */
export function ensureUniqueFeatureIds(featureList: FeatureData[]): FeatureData[] {
  const groups = new Map<string, FeatureData[]>()

  for (const feature of featureList) {
    const group = groups.get(feature.id)
    if (group)
      group.push(feature)
    else
      groups.set(feature.id, [feature])
  }

  const duplicates: DuplicateGroup[] = []
  for (const [id, features] of groups) {
    if (features.length > 1)
      duplicates.push({ id, features })
  }

  if (duplicates.length === 0)
    return featureList

  // 已占用的 id 包含所有既有 id（含唯一的 `xxx-2`），重命名时避开它们
  const used = new Set(featureList.map(feature => feature.id))
  const renamed = new Map<FeatureData, string>()

  for (const { id, features } of duplicates) {
    // 原始路径已经是小写的条目优先占用原 id（通常是线上正在使用的页面）
    const sorted = [...features].sort((a, b) => {
      const aPlain = Number(a.paths === a.paths.toLowerCase())
      const bPlain = Number(b.paths === b.paths.toLowerCase())
      if (aPlain !== bPlain)
        return bPlain - aPlain
      if (a.paths === b.paths)
        return 0
      return a.paths < b.paths ? -1 : 1
    })

    sorted.forEach((feature, index) => {
      if (index === 0)
        return
      const nextId = uniqueId(id, used)
      used.add(nextId)
      renamed.set(feature, nextId)
    })

    console.warn(
      `[caniuse-embed] 特性 id 冲突: "${id}" 对应 ${features.length} 个特性，已重命名为唯一的 id:\n${
        sorted.map(feature => `  - ${renamed.get(feature) || feature.id} <- ${feature.paths}`).join('\n')}`,
    )
  }

  const result = featureList.map((feature) => {
    const id = renamed.get(feature)
    return id ? { ...feature, id } : feature
  })

  const finalIds = new Set<string>()
  for (const feature of result) {
    if (finalIds.has(feature.id))
      throw new Error(`[caniuse-embed] 特性 id 生成失败，仍然存在重复 id: "${feature.id}" (${feature.paths})`)
    finalIds.add(feature.id)
  }

  return result
}

function uniqueId(base: string, used: Set<string>): string {
  let index = 2
  let candidate = `${base}-${index}`
  while (used.has(candidate)) {
    index++
    candidate = `${base}-${index}`
  }
  return candidate
}
