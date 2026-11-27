import { describe, expect, it } from 'vitest'
import { formatTitle } from '../src/services/bcd/format-title'

/**
 * `descriptions` 与完整 paths 按下标一一对应，因此这里按真实数据的形态构造。
 */
describe('formatTitle', () => {
  it.each([
    {
      paths: ['javascript', 'builtins', 'Array', 'Array'],
      descriptions: ['', '', '', '<code>Array()</code> constructor'],
      expected: 'Javascript builtins: Array: <code>Array()</code> constructor',
    },
    {
      paths: ['api', 'HTMLAnchorElement', 'referrerPolicy', 'unsafe-url'],
      descriptions: ['', '', '', 'unsafe-url'],
      expected: 'HTMLAnchorElement API: referrerPolicy unsafe-url',
    },
    {
      paths: ['html', 'elements', 'a', 'referrerpolicy', 'unsafe-url'],
      descriptions: ['', '', '', '', 'unsafe-url'],
      expected: 'HTML Element: a: referrerpolicy: unsafe-url',
    },
    {
      paths: ['css', 'types', 'length', 'rch'],
      descriptions: ['', '', '<code>&lt;length&gt;</code>', '<code>rch</code> unit'],
      expected: 'types: <code>rch</code> unit',
    },
    {
      paths: ['css', 'properties', 'z-index'],
      descriptions: ['', '', ''],
      expected: 'CSS Property: z-index',
    },
    {
      paths: ['api', 'AbortController', 'AbortController'],
      descriptions: ['', '', '<code>AbortController()</code> constructor'],
      expected: 'AbortController API: <code>AbortController()</code> constructor',
    },
  ])('$paths → $expected', ({ paths, descriptions, expected }) => {
    expect(formatTitle(paths, descriptions)).toBe(expected)
  })

  it('不会产生 `Array: Array` 这类相邻重复段', () => {
    const title = formatTitle(
      ['javascript', 'builtins', 'Array', 'Array'],
      ['', '', '', '<code>Array()</code> constructor'],
    )
    expect(title).not.toMatch(/Array: Array/)
  })

  it('描述缺失时回退到路径', () => {
    expect(formatTitle(['css', 'properties', 'gap'], ['', '', ''])).toBe('CSS Property: gap')
  })

  it('没有更深子路径时保留当前特性的描述', () => {
    expect(formatTitle(['css', 'at-rules', 'media'], ['', '', '<code>@media</code>']))
      .toBe('CSS at-rule: <code>@media</code>')
    expect(formatTitle(['css', 'types', 'length'], ['', '', '<code>&lt;length&gt;</code>']))
      .toBe('types: <code>&lt;length&gt;</code>')
  })
})
