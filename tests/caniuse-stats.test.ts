import type { SimpleSupportStatement } from '../src/types'
import { describe, expect, it } from 'vitest'
import { clearStatsCache, getCaniuseStats } from '../src/services/bcd/caniuse-status'

describe('getCaniuseStats', () => {
  it('仅有前缀的语句应判定为需要前缀', () => {
    const supports: SimpleSupportStatement[] = [{ version_added: '4', prefix: '-webkit-' }]
    expect(getCaniuseStats(supports, '120')).toEqual(['x'])
  })

  it('仅有别名实现的语句不应判定为不支持', () => {
    const supports: SimpleSupportStatement[] = [{ version_added: '14', alternative_name: 'setTargetValueAtTime' }]
    expect(getCaniuseStats(supports, '120')).toEqual(['a'])
  })

  it('部分支持 + 前缀', () => {
    const supports: SimpleSupportStatement[] = [{ version_added: '30', prefix: '-webkit-', partial_implementation: true }]
    expect(getCaniuseStats(supports, '60')).toEqual(['a', 'x'])
  })

  it('flag 未开启时不可用', () => {
    const supports: SimpleSupportStatement[] = [
      { version_added: '50', flags: [{ type: 'preference', name: 'enable-experimental-web-platform-features' }] },
    ]
    expect(getCaniuseStats(supports, '120')).toEqual(['n', 'd'])
  })

  it('version_added 为 false 时明确不支持', () => {
    expect(getCaniuseStats([{ version_added: false }], '120')).toEqual(['n'])
    expect(getCaniuseStats([], '120')).toEqual(['u'])
  })

  it('早于首个语句的版本按不支持处理', () => {
    expect(getCaniuseStats([{ version_added: '130' }], '120')).toEqual(['n'])
  })

  it('多语句取首个命中，而不是取并集', () => {
    const supports: SimpleSupportStatement[] = [
      { version_added: '89' },
      { version_added: '90', prefix: '-webkit-' },
      { version_added: '88', version_removed: '89', partial_implementation: true },
    ]
    expect(getCaniuseStats(supports, '120')).toEqual(['y'])
  })

  it('移除后由后续语句接管', () => {
    const supports: SimpleSupportStatement[] = [
      { version_added: '10', version_removed: '50' },
      { version_added: '50' },
    ]
    expect(getCaniuseStats(supports, '40')).toEqual(['y'])
    expect(getCaniuseStats(supports, '60')).toEqual(['y'])
  })

  it('预览版本不会被误判为命中所有区间', () => {
    const supports: SimpleSupportStatement[] = [
      { version_added: '1', version_removed: '18' },
      { version_added: 'preview' },
    ]
    expect(getCaniuseStats(supports, 'TP')).toEqual(['y'])
    expect(getCaniuseStats(supports, '17')).toEqual(['y'])
  })

  it('缓存以数组引用为键，结构不同的数组不会互相污染', () => {
    clearStatsCache()
    const plain: SimpleSupportStatement[] = [{ version_added: '4' }]
    const prefixed: SimpleSupportStatement[] = [{ version_added: '4', prefix: '-webkit-' }]

    expect(getCaniuseStats(plain, '120')).toEqual(['y'])
    expect(getCaniuseStats(prefixed, '120')).toEqual(['x'])
    expect(getCaniuseStats(plain, '120')).toEqual(['y'])
  })
})
