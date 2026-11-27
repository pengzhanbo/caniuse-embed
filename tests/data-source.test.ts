import { describe, expect, it } from 'vitest'
import { toDataVersion } from '../src/services/data-source'

describe('toDataVersion', () => {
  it('保留已解析的具体版本号', () => {
    expect(toDataVersion('8.1.11')).toBe('8.1.11')
    expect(toDataVersion('1.0.30001828')).toBe('1.0.30001828')
    expect(toDataVersion('3.48.0-rc.1')).toBe('3.48.0-rc.1')
  })

  it('版本选择器记录为 unknown', () => {
    expect(toDataVersion('latest')).toBe('unknown')
    expect(toDataVersion('next')).toBe('unknown')
    expect(toDataVersion('^8.1.10')).toBe('unknown')
    expect(toDataVersion('~3.48.0')).toBe('unknown')
    expect(toDataVersion(undefined)).toBe('unknown')
    expect(toDataVersion('')).toBe('unknown')
  })
})
