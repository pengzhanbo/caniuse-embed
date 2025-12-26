import type { BrowserName, Browsers, SimpleSupportStatement, SupportBlock } from '../../types'
import { toArray } from '@pengzhanbo/utils'

export function mirrorSupport(supports: SupportBlock, browsers: Browsers, browser: BrowserName): SimpleSupportStatement[] {
  const support = supports[browser]
  if (support === 'mirror') {
    const upstream = browsers[browser].upstream
    if (!upstream) {
      return []
    }
    return mirrorSupport(supports, browsers, upstream)
  }
  return toArray(support) as SimpleSupportStatement[]
}
