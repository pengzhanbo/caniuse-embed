import type { BaselineFeatureData, FeatureData, FeatureSupport } from '../src/types'
import { describe, expect, it } from 'vitest'
import { getBaselineStatusData } from '../src/services/baseline'
import { getFeatureSupport as getCiuFeatureSupport } from '../src/services/ciu/supports'
import { ensureUniqueFeatureIds } from '../src/services/ensure-unique-ids'
import { zipFeatureSupports } from '../src/services/zip-feature-supports'

function createFeature(id: string, paths: string): FeatureData {
  return {
    id,
    source: 'mdn',
    paths,
    title: paths,
    url: '',
    experimental: false,
    deprecated: false,
    prefixed: false,
    unknown: false,
    flag: false,
    supports: [],
  }
}

describe('ensureUniqueFeatureIds', () => {
  it('大小写碰撞时生成唯一的 id，并保留线上已有的 URL', () => {
    // api.Crypto 与 api.crypto 曾经生成同一个 id，导致接口页面被丢弃
    const list = [
      createFeature('mdn-api_crypto', 'api.Crypto'),
      createFeature('mdn-api_crypto', 'api.crypto'),
    ]

    ensureUniqueFeatureIds(list)

    const ids = list.map(item => item.id).sort()
    expect(ids).toEqual(['mdn-api_crypto', 'mdn-api_crypto-2'])
    // 原始路径为全小写的条目保持原 id
    expect(list.find(item => item.paths === 'api.crypto')?.id).toBe('mdn-api_crypto')
  })

  it('没有冲突时不改变 id', () => {
    const list = [createFeature('css-grid', 'css-grid')]
    ensureUniqueFeatureIds(list)
    expect(list[0]?.id).toBe('css-grid')
  })
})

describe('getBaselineStatusData', () => {
  it('discouraged 会下发到 BCD compat key', () => {
    const features = {
      'document-write': {
        kind: 'feature',
        compat_features: ['api.document.write'],
        caniuse: ['document-write-command'],
        discouraged: {
          according_to: ['https://example.com'],
          reason: 'The dynamic markup insertion API is discouraged.',
          reason_html: '',
          removal_date: '2029-12-31',
        },
        status: {
          baseline: false,
          support: { chrome: '1' },
          by_compat_key: {
            'api.document.write': { baseline: false, support: { chrome: '1' } },
          },
        },
      },
    } as unknown as Record<string, BaselineFeatureData>

    const res = getBaselineStatusData(features)

    expect(res['api.document.write']?.baseline).toBe('discouraged')
    expect(res['api.document.write']?.reason).toBe('The dynamic markup insertion API is discouraged.')
    expect(res['api.document.write']?.date).toBe('2029-12-31')
    expect(res['document-write-command']?.baseline).toBe('discouraged')
  })

  it('discouraged 条目即使没有 status 也会下发到 compat key', () => {
    const features = {
      'legacy-thing': {
        kind: 'feature',
        compat_features: ['api.legacy.thing', 'css.property.thing'],
        discouraged: {
          according_to: [],
          reason: 'Obsolete.',
          reason_html: '',
          removal_date: '2030-01-01',
        },
      },
    } as unknown as Record<string, BaselineFeatureData>

    const res = getBaselineStatusData(features)

    expect(res['api.legacy.thing']?.baseline).toBe('discouraged')
    expect(res['api.legacy.thing']?.reason).toBe('Obsolete.')
    expect(res['css.property.thing']?.baseline).toBe('discouraged')
    expect(res['legacy-thing']?.baseline).toBe('discouraged')
  })
})

describe('caniuse supports', () => {
  const agents = {
    chrome: {
      abbr: 'Chr.',
      browser: 'Chrome',
      long_name: 'Google Chrome',
      current_version: '120',
      prefix: '',
      type: 'desktop',
      usage_global: {},
      version_list: [
        { era: -1, global_usage: 1, prefix: '', release_date: 0, version: '119' },
        { era: 0, global_usage: 2, prefix: '', release_date: 0, version: '120' },
      ],
    },
  }

  it('每个版本都会带上 prefixed 字段', () => {
    // caniuse 源漏返回 prefixed
    const supports = getCiuFeatureSupport(
      { chrome: { 119: 'x', 120: 'y' } } as any,
      agents as any,
    )
    const periods = supports.find(item => item.browser === 'chrome')?.periods || []
    const real = periods.filter(period => period.version[0])
    expect(real.every(period => typeof period.prefixed === 'boolean')).toBe(true)
    expect(real.at(-1)?.prefixed).toBe(false)
    expect(real[0]?.prefixed).toBe(true)
  })

  it('caniuse 的 y x 组合归为需要前缀', () => {
    const supports = getCiuFeatureSupport(
      { chrome: { 119: 'y x', 120: 'y d' } } as any,
      agents as any,
    )
    const periods = supports.find(item => item.browser === 'chrome')?.periods || []
    const past = periods.find(period => period.version[0] === '119')
    const current = periods.find(period => period.version[0] === '120')
    expect(past?.prefixed).toBe(true)
    expect(past?.supported).toBe(false)
    // `y d` 表示默认关闭，可通过 flag 启用
    expect([...(current?.stats || [])].sort()).toEqual(['d', 'n'])
  })

  it('current_version 不在版本列表中时不会崩溃', () => {
    const supports = getCiuFeatureSupport(
      { chrome: {} } as any,
      {
        chrome: { ...agents.chrome, current_version: 'unknown' },
      } as any,
    )
    expect(supports.find(item => item.browser === 'chrome')).toBeDefined()
  })

  it('current_version 缺失时，current 周期使用版本列表中的条目版本', () => {
    const supports = getCiuFeatureSupport(
      { chrome: { 120: 'y' } } as any,
      {
        chrome: { ...agents.chrome, current_version: 'unknown' },
      } as any,
    )
    const periods = supports.find(item => item.browser === 'chrome')?.periods || []
    const current = periods.find(period => period.period === 'current')
    expect(current?.version).toEqual(['120'])
    expect(current?.usage).toBe(2)
    expect(current?.supported).toBe(true)
  })
})

describe('zipFeatureSupports', () => {
  it('缺少某个 period 时不会抛错', () => {
    const supports: FeatureSupport[] = [
      {
        browser: 'chrome',
        periods: [
          { period: 'current', version: ['120'], usage: 1, stats: ['y'] },
        ],
      },
    ]
    const zipped = zipFeatureSupports(supports)
    expect(zipped).toHaveLength(1)
    expect(zipped[0]?.[0]).toBe('current')
  })
})
