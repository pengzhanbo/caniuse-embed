import markdown from 'markdown-it'
import linkAttr from 'markdown-it-link-attributes'

/**
 * 上游数据（BCD / web-features）中的 title、description 是「纯文本 + 少量 HTML」，
 * 例如 `<code>AbortController()</code>`、`<a href="...">...</a>`。
 *
 * 这些 HTML 来自第三方 CDN，直接 `set:html` 渲染等同于把上游视为可信来源。
 * 因此这里把允许的少量标签转换成 markdown 语法，再由 markdown-it 以
 * `html: false` 渲染：其余标签（包括 `<script>`、事件属性）会作为纯文本转义输出。
 */

const ANCHOR_PATTERN = /<a\s[^>]*>([\s\S]*?)<\/a>/gi
const ANCHOR_HREF_PATTERN = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
const CODE_PATTERN = /<code>([\s\S]*?)<\/code>/gi
const TAG_PATTERN = /<\/?[a-z][^>]*>/gi

function isSafeHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim())
}

function stripTags(content: string): string {
  return content.replace(TAG_PATTERN, '')
}

function getHref(tag: string): string {
  const matched = ANCHOR_HREF_PATTERN.exec(tag)
  if (!matched)
    return ''
  return (matched[1] ?? matched[2] ?? matched[3] ?? '').trim()
}

interface PreprocessOptions {
  /**
   * 是否保留 `<a href>`（转换为 markdown 链接）
   *
   * 标题本身已经处于 `<a>` 内部，再插入链接会产生非法的嵌套 `<a>`。
   */
  links?: boolean
}

function preprocess(content: string, { links = true }: PreprocessOptions = {}): string {
  return content
    // 外链转换为 markdown 链接，仅允许 http(s)，其余保留链接文本
    .replace(ANCHOR_PATTERN, (tag: string, label: string) => {
      const text = stripTags(label).trim()
      if (!text)
        return ''
      if (!links)
        return text

      const href = getHref(tag)
      return isSafeHref(href) ? `[${text}](${href})` : text
    })
    // 行内代码转换为 markdown 反引号
    .replace(CODE_PATTERN, (_, code: string) => `\`${stripTags(code).replaceAll('`', '')}\``)
    // 其余 HTML 标签全部丢弃
    .replace(TAG_PATTERN, '')
}

const md = markdown({
  html: false,
  linkify: true,
})

md.use(linkAttr, {
  attrs: {
    target: '_blank',
    rel: 'noopener noreferrer',
  },
})

export function markdownRender(content: string, inline = false, options?: PreprocessOptions): string {
  const source = preprocess(content, options)
  if (inline)
    return md.renderInline(source)
  return md.render(source)
}

/**
 * 将可能包含 HTML 的文本转换为纯文本，用于 `<title>`、下拉选项等场景
 */
export function markdownToPlainText(content: string): string {
  return stripTags(content)
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', '\'')
    .replaceAll(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}
