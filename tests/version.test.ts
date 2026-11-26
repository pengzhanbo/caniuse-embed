import { describe, expect, it } from 'vitest'
import { compareVersion } from '../src/utils/compare-version'
import { normalizeVersion } from '../src/utils/normalize-version'

describe('normalizeVersion', () => {
  it('去掉 BCD 中的比较符', () => {
    expect(normalizeVersion('≤12.1')).toBe('12.1')
    expect(normalizeVersion('≤3.2')).toBe('3.2')
    expect(normalizeVersion('>=15')).toBe('15')
    expect(normalizeVersion('<10')).toBe('10')
    expect(normalizeVersion('4+')).toBe('4')
  })

  it('处理多版本区间', () => {
    expect(normalizeVersion('15.2-15.3')).toBe('15.2')
    expect(normalizeVersion('15.2-15.3', 1)).toBe('15.3')
    expect(normalizeVersion('18.5-18.7')).toBe('18.5')
  })

  it('非数字版本原样返回', () => {
    expect(normalizeVersion('TP')).toBe('TP')
    expect(normalizeVersion('preview')).toBe('preview')
    expect(normalizeVersion('all')).toBe('all')
  })
})

describe('compareVersion', () => {
  it('数字版本按段比较', () => {
    expect(compareVersion('10', '9')).toBe(1)
    expect(compareVersion('9', '10')).toBe(-1)
    expect(compareVersion('12.1', '12.1')).toBe(0)
    expect(compareVersion('1.0.0', '1')).toBe(0)
    expect(compareVersion('4.4.3', '4.4')).toBe(1)
    expect(compareVersion('12.1', '≤12.1')).toBe(0)
  })

  it('预览版本视为比数字版本更新', () => {
    expect(compareVersion('7', 'TP')).toBe(-1)
    expect(compareVersion('14.1', 'TP')).toBe(-1)
    expect(compareVersion('TP', '18')).toBe(1)
    expect(compareVersion('preview', '120')).toBe(1)
    expect(compareVersion('TP', 'TP')).toBe(0)
    // BCD 与 caniuse 对同一个预览通道使用不同的写法
    expect(compareVersion('TP', 'preview')).toBe(0)
  })

  it('聚合版本', () => {
    expect(compareVersion('all', 'all')).toBe(0)
  })
})
