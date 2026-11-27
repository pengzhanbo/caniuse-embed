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

  it('链接目标中的空格会被编码，括号不会破坏链接结构', () => {
    const html = markdownRender('<a href="https://example.com/a b(c)">docs</a>', true)
    expect(html).toMatch(/href="https:\/\/example\.com\/a%20b\(c\)"/)
  })

  it('链接文本中的方括号会被转义', () => {
    const html = markdownRender('<a href="https://example.com">[docs]</a>', true)
    expect(html).toContain('>[docs]</a>')
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

  it('越界或非法的数字实体不会让构建崩溃', () => {
    expect(markdownToPlainText('x &#99999999; y')).toBe('x y')
    expect(markdownToPlainText('a &#0; b')).toBe('a b')
  })

  it('支持十六进制实体', () => {
    expect(markdownToPlainText('&#x27;')).toBe('\'')
  })
})
