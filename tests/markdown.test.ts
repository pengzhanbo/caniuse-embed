import { describe, expect, it } from 'vitest'
import { markdownRender, markdownToPlainText } from '../src/utils/markdown'

describe('markdownRender', () => {
  it('保留 <code> 的语义', () => {
    const html = markdownRender('AbortController API: <code>AbortController()</code> constructor', true)
    expect(html).toMatch(/<code>AbortController\(\)<\/code>/)
  })

  it('丢弃 <script> 与事件属性', () => {
    const html = markdownRender('<script>alert(1)</script>', true)
    expect(html).not.toContain('<script')

    const img = markdownRender('<img src=x onerror="alert(1)">', true)
    expect(img).not.toContain('onerror')
    expect(img).not.toContain('<img')
  })

  it('拒绝伪协议链接', () => {
    const html = markdownRender('<a href="javascript:alert(1)">click</a>', true)
    expect(html).not.toContain('javascript:')
    expect(html.trim()).toBe('click')
  })

  it('保留 http(s) 链接并加上安全属性', () => {
    const html = markdownRender('<a href="https://example.com/docs">docs</a>', true)
    expect(html).toMatch(/href="https:\/\/example\.com\/docs"/)
    expect(html).toMatch(/rel="noopener noreferrer"/)
  })

  it('标题场景下不生成嵌套链接', () => {
    const html = markdownRender('<a href="https://example.com">docs</a> <code>x</code>', true, { links: false })
    expect(html).not.toContain('<a ')
    expect(html).toMatch(/<code>x<\/code>/)
  })

  it('标题场景下不会把 markdown 链接与裸 URL 渲染成 <a>', () => {
    const html = markdownRender(
      '[docs](https://example.com) https://example.org <https://example.net>',
      true,
      { links: false },
    )
    expect(html).not.toContain('<a')
    expect(html).toBe('docs https://example.org https://example.net')
  })

  it('保留 code 内容中的反引号', () => {
    expect(markdownRender('<code>use `backticks` here</code>', true))
      .toBe('<code>use `backticks` here</code>')
    expect(markdownRender('<code>``a``</code>', true))
      .toBe('<code>``a``</code>')
  })
})

describe('markdownToPlainText', () => {
  it('移除 HTML 标签并解码实体', () => {
    expect(markdownToPlainText('A: <code>x</code> &amp; y')).toBe('A: x & y')
    expect(markdownToPlainText('AbortController API: <code>AbortController()</code> constructor'))
      .toBe('AbortController API: AbortController() constructor')
  })
})
