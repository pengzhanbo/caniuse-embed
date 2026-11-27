import type { FeatureData } from '../src/types'
import { describe, expect, it } from 'vitest'
import { getBaselineStatus } from '../src/services/get-baseline-status'

function feature(patch: Partial<FeatureData> = {}): FeatureData {
  return {
    id: 'mdn-api_foo',
    source: 'mdn',
    paths: 'api.Foo',
    title: 'Foo',
    url: '',
    experimental: false,
    deprecated: false,
    prefixed: false,
    unknown: false,
    flag: false,
    supports: [],
    ...patch,
  }
}

describe('getBaselineStatus', () => {
  it('没有 web-features 数据时返回 unknown，而不是 limit', () => {
    const res = getBaselineStatus(undefined, feature())
    expect(res.type).toBe('unknown')
    expect(res.label).toBe('Baseline status unknown')
    expect(res.description).not.toContain('not Baseline')
  })

  it('明确非基线时返回 limit', () => {
    const res = getBaselineStatus(
      { baseline: false, support: {} },
      feature(),
    )
    expect(res.type).toBe('limit')
  })

  it('实验性 / 已废弃优先于缺失的 baseline 数据', () => {
    expect(getBaselineStatus(undefined, feature({ experimental: true })).type).toBe('experimental')
    expect(getBaselineStatus(undefined, feature({ deprecated: true })).type).toBe('deprecated')
  })

  it('discouraged 保留原因与移除日期', () => {
    const res = getBaselineStatus(
      { baseline: 'discouraged', support: {}, reason: 'obsolete', date: '2029-12-31' },
      feature(),
    )
    expect(res.type).toBe('discouraged')
    expect(res.reason).toBe('obsolete')
    expect(res.description).toContain('December 2029')
  })
})
