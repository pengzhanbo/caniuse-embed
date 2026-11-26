/**
 * 只允许 http(s) 绝对 URL
 *
 * 上游数据中的链接会在页面上直接渲染为 `href`，
 * 这里统一收敛，避免出现 `javascript:` 之类的伪协议。
 */
export function safeHttpUrl(url: string | undefined | null): string {
  if (!url)
    return ''
  const value = url.trim()
  return /^https?:\/\//i.test(value) ? value : ''
}
