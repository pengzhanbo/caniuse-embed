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
// 只匹配真正的标签：标签名之后必须是空白、`/` 或 `>`，
// 避免把 `<https://example.com>` 这类 autolink 当成标签删除
const TAG_PATTERN = /<\/?[a-z][\w-]*(?=[\s/>])[^>]*>/gi

function isSafeHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim())
}

/** 转义 markdown 链接文本中的方括号，避免破坏链接结构 */
function escapeLinkText(text: string): string {
  return text.replace(/([[\]])/g, '\\$1')
}

/** 链接目标使用尖括号包裹，并编码会破坏语法的字符 */
function escapeLinkHref(href: string): string {
  return href.replace(/[<>\s]/g, (char) => {
    if (char === '<')
      return '%3C'
    if (char === '>')
      return '%3E'
    return '%20'
  })
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

/**
 * 转换为 markdown 行内代码
 *
 * 需要根据内容中连续反引号的最大长度选择分隔符，
 * 并保留原始文本中的反引号，而不是把它们删掉。
 */
function toCodeSpan(content: string): string {
  const text = stripTags(content)
  if (!text)
    return ''

  const longest = (text.match(/`+/g) || []).reduce((max, run) => Math.max(max, run.length), 0)
  const fence = '`'.repeat(longest + 1)
  // 内容以空格或反引号开头/结尾时，两侧各补一个空格，渲染时会被去掉
  const padded = /^[` ]|[` ]$/.test(text) ? ` ${text} ` : text

  return `${fence}${padded}${fence}`
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
      return isSafeHref(href) ? `[${escapeLinkText(text)}](<${escapeLinkHref(href)}>)` : text
    })
    // 行内代码转换为 markdown 反引号
    .replace(CODE_PATTERN, (_, code: string) => toCodeSpan(code))
    // 其余 HTML 标签全部丢弃
    .replace(TAG_PATTERN, '')
}

function createMarkdown(linkify: boolean) {
  const instance = markdown({ html: false, linkify })
  instance.use(linkAttr, {
    attrs: {
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  })
  return instance
}

const md = createMarkdown(true)

/**
 * 标题专用实例：标题本身已经处于 `<a>` 内，
 * 这里不解析裸 URL（`linkify: false`），并把 `[text](url)` / autolink 渲染为纯文本，
 * 避免嵌套链接，也避免临时修改共享实例的选项。
 */
const mdPlain = createMarkdown(false)
mdPlain.renderer.rules.link_open = () => ''
mdPlain.renderer.rules.link_close = () => ''

export function markdownRender(content: string, inline = false, options?: PreprocessOptions): string {
  const source = preprocess(content, options)
  const instance = options?.links === false ? mdPlain : md
  if (inline)
    return instance.renderInline(source)
  return instance.render(source)
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
    .replaceAll(/&#(\d+);/g, (_, code: string) => decodeCodePoint(Number(code)))
    .replaceAll(/&#x([\da-f]+);/gi, (_, code: string) => decodeCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim()
}

/** 越界 / 非法码点直接丢弃，避免一条上游数据让整个构建崩溃 */
function decodeCodePoint(code: number): string {
  if (!Number.isInteger(code) || code <= 0 || code > 0x10FFFF)
    return ''
  if (code >= 0xD800 && code <= 0xDFFF)
    return '\uFFFD'
  return String.fromCodePoint(code)
}
