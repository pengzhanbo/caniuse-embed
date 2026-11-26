import { describe, expect, it } from 'vitest'
import { computeUsage } from '../src/services/bcd/compute-usage'

// computeUsage 内部会缓存各设备的全局使用率，因此整个文件共用同一份 agents
const agents = {
  chrome: {
    abbr: 'Chr.',
    browser: 'Chrome',
    long_name: 'Google Chrome',
    current_version: '120',
    prefix: '',
    type: 'desktop',
    usage_global: { 120: 100 },
    version_list: [
      { era: 0, global_usage: 100, prefix: '', release_date: 0, version: '120' },
    ],
  },
} as any

const browsers = {} as any

describe('computeUsage', () => {
  it('无 flag 的部分支持会计入使用率', () => {
    const usage = computeUsage(
      { chrome: [{ version_added: '100', partial_implementation: true }] } as any,
      agents,
      browsers,
    )
    expect(usage).toEqual({ supported: 0, partial: 100, total: 100 })
  })

  it('需要 flag 的别名实现不计入部分支持率', () => {
    // 默认不可用（需要浏览器标识），不应被计为可以使用该特性的用户
    const usage = computeUsage(
      {
        chrome: [{
          version_added: '100',
          alternative_name: 'legacyName',
          partial_implementation: true,
          flags: [{ type: 'preference', name: 'enable-experimental-web-platform-features' }],
        }],
      } as any,
      agents,
      browsers,
    )
    expect(usage).toBeUndefined()
  })
})
