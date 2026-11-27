import { describe, expect, it } from 'vitest'
import { mirrorSupport } from '../src/services/bcd/mirror-support'

describe('mirrorSupport', () => {
  it('沿着 upstream 解析 mirror', () => {
    const supports = { chrome: 'mirror', safari: [{ version_added: '10' }] } as any
    const browsers = { chrome: { upstream: 'safari' }, safari: {} } as any
    expect(mirrorSupport(supports, browsers, 'chrome')).toEqual([{ version_added: '10' }])
  })

  it('缺少 upstream 时返回空数组', () => {
    const supports = { chrome: 'mirror' } as any
    expect(mirrorSupport(supports, { chrome: {} } as any, 'chrome')).toEqual([])
  })

  it('upstream 出现环时不会栈溢出', () => {
    const supports = { chrome: 'mirror', safari: 'mirror' } as any
    const browsers = { chrome: { upstream: 'safari' }, safari: { upstream: 'chrome' } } as any
    expect(mirrorSupport(supports, browsers, 'chrome')).toEqual([])
  })
})
