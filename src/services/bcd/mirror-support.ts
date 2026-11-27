import type { BrowserName, Browsers, SimpleSupportStatement, SupportBlock } from '../../types'
import { toArray } from '@pengzhanbo/utils'

export function mirrorSupport(
  supports: SupportBlock,
  browsers: Browsers,
  browser: BrowserName,
  visited: Set<BrowserName> = new Set(),
): SimpleSupportStatement[] {
  const support = supports[browser]
  if (support === 'mirror') {
    // 上游 `upstream` 图理论上无环，但这是外部输入，命中环时直接返回空并告警
    if (visited.has(browser)) {
      console.warn(`[caniuse-embed] BCD 浏览器 upstream 出现环: ${[...visited, browser].join(' -> ')}`)
      return []
    }
    visited.add(browser)

    const upstream = browsers[browser]?.upstream
    if (!upstream)
      return []

    return mirrorSupport(supports, browsers, upstream, visited)
  }
  return toArray(support) as SimpleSupportStatement[]
}
