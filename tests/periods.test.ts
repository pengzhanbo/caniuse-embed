import type { CaniuseBrowserAgent } from '../src/types'
import { describe, expect, it } from 'vitest'
import { getBrowserPeriods } from '../src/services/periods'

const agent = {
  current_version: '120',
  version_list: [
    { era: -3, global_usage: 1, prefix: '', release_date: 0, version: '117' },
    { era: -2, global_usage: 1, prefix: '', release_date: 0, version: '118' },
    { era: -1, global_usage: 1, prefix: '', release_date: 0, version: '119' },
    { era: 0, global_usage: 1, prefix: '', release_date: 0, version: '120' },
    { era: 1, global_usage: 1, prefix: '', release_date: 0, version: '121' },
    { era: 2, global_usage: 1, prefix: '', release_date: 0, version: '122' },
    { era: 3, global_usage: 1, prefix: '', release_date: 0, version: '123' },
    { era: 4, global_usage: 1, prefix: '', release_date: 0, version: '124' },
  ],
} as unknown as Pick<CaniuseBrowserAgent, 'current_version' | 'version_list'>

function stats(version: string) {
  if (version === '121')
    return { stats: ['n' as const] }
  if (version === '122')
    return { stats: ['y' as const] }
  if (version === '123')
    return { stats: ['n' as const] }
  return { stats: ['y' as const] }
}

describe('getBrowserPeriods', () => {
  it('只返回真实周期，最多 3 个未来分组', () => {
    const periods = getBrowserPeriods(agent, stats)

    expect(periods.map(period => period.period)).toEqual([
      'past_1',
      'current',
      'future_1',
      'future_2',
      'future_3',
    ])
    expect(periods.every(period => Boolean(period.version[0]))).toBe(true)
  })

  it('没有更多未来版本时不补空占位', () => {
    const shortAgent = {
      current_version: '120',
      version_list: agent.version_list.slice(0, 5),
    } as unknown as Pick<CaniuseBrowserAgent, 'current_version' | 'version_list'>

    const periods = getBrowserPeriods(shortAgent, stats)
    expect(periods.map(period => period.period)).toEqual(['past_1', 'current', 'future_1'])
  })

  it('过去周期最多 5 个', () => {
    const longAgent = {
      current_version: '120',
      version_list: Array.from({ length: 12 }, (_, index) => ({
        era: index - 11,
        global_usage: 1,
        prefix: '',
        release_date: 0,
        version: String(110 + index),
      })),
    } as unknown as Pick<CaniuseBrowserAgent, 'current_version' | 'version_list'>

    const periods = getBrowserPeriods(longAgent, version => ({
      stats: [Number(version) % 2 === 0 ? 'y' : 'n'],
    }))
    expect(periods.filter(period => period.period.startsWith('past_'))).toHaveLength(5)
  })
})
