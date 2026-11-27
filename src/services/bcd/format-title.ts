/**
 * 把描述与子路径对齐后拼接
 *
 * `descriptions` 与完整 `paths` 按下标一一对应（`flatten-compat-data` 中同步 push），
 * 而调用方传入的通常是尾部子路径，因此这里取描述数组的尾部同样长度，
 * 不能多取一位，否则每个描述都会与「上一层」的路径错位。
 */
function withDescriptions(paths: string[], descriptions: string[], sep = ': '): string {
  const offset = descriptions.length - paths.length
  const list = offset > 0 ? descriptions.slice(offset) : descriptions

  const res: string[] = []
  const length = Math.max(list.length, paths.length)
  for (let i = 0; i < length; i++) {
    const value = list[i] || paths[i] || ''
    const last = res[res.length - 1]
    // 描述与路径可能恰好相同（例如 `Array` 的构造器），合并相邻重复段；
    // 后一段以前一段开头时（`color-mix()` → `color-mix() with ...`）保留更完整的一段
    if (!value || value === last)
      continue
    if (last && value.startsWith(`${last} `))
      res[res.length - 1] = value
    else
      res.push(value)
  }
  return res.filter(Boolean).join(sep).trim()
}

/**
 * 格式化 MDN 特性的标题
 *
 * 尽可能的保持和 caniuse.com 的标题一致
 */
export function formatTitle(paths: string[], descriptions: string[]): string {
  if (paths.length <= 1)
    return paths[0] || ''

  const [root, ...rest] = paths

  switch (root) {
    case 'api': {
      const [title, ...titles] = withDescriptions(rest, descriptions, ' ').split(/\s+/)
      const before = `${title} API`
      if (!titles.length)
        return before
      if (titles.length <= 2) {
        return `${before}: ${(titles).join(' ')}`
      }

      return `${before}: ${cleanApiTitle(titles)}` // checked
    }
    case 'css': {
      const [type, ...css] = rest
      if (type === 'at-rules')
        return `CSS at-rule: ${withDescriptions(css.slice(1), descriptions, '')}` // checked
      if (type === 'properties')
        // css.properties.z-index
        // css.properties.z-index.auto
        return `CSS Property: ${withDescriptions(css, descriptions)}` // checked
      if (type === 'selectors')
        return `CSS Selector: ${css.join(' ')}`
      if (type === 'types') {
        // css.types.length.rch
        return `types: ${withDescriptions(css.slice(1), descriptions)}` // checked
      }
      return `CSS: ${withDescriptions(rest, descriptions)}` // fallback
    }

    case 'html': {
      const [type, ...html] = rest
      const title = withDescriptions(html, descriptions)
      if (type === 'manifest')
        return `Web App Manifest Property: ${title}` // checked
      if (type === 'global_attributes')
        return `Global HTML Attribute: ${title}` // checked
      if (type === 'elements') {
        return `HTML Element: ${title}` // checked
      }
      return `HTML: ${title}` // fallback
    }

    case 'http': {
      const [type, ...http] = rest
      if (type === 'data-url') {
        if (!http.length)
          return 'Data URLs' // checked
        return `data URL scheme: ${withDescriptions(http, descriptions)}` // checked
      }
      if (type === 'methods')
        return `HTTP Method: ${http[0]}` // checked
      if (type === 'status')
        return `HTTP status code: ${http[0]}${http[1] ? ` rel=${http[1]}` : ''}` // checked
      if (type === 'headers')
        return `headers HTTP Header: ${http[0]}` // checked
      if (type === 'mixed-content')
        return withDescriptions(rest, descriptions) // checked

      return `HTTP: ${withDescriptions(rest, descriptions)}`
    }

    case 'javascript':
      return `Javascript ${
        withDescriptions(rest, descriptions)
          .replace('@@iterator: ', '')}` // checked

    case 'manifests':
      return withDescriptions(rest, descriptions) // checked

    case 'mathml':
      return `MathML ${withDescriptions(rest, descriptions)}` // checked

    case 'svg':
      return `SVG ${withDescriptions(rest, descriptions)}` // checked
    case 'webassembly':
      return `Webassembly ${withDescriptions(rest, descriptions)}` // checked
  }

  return withDescriptions(rest, descriptions)
}

function cleanApiTitle(titles: string[]): string {
  const res: string[] = []
  let t: string | undefined
  // eslint-disable-next-line no-cond-assign
  while (t = titles.shift()) {
    if (!t.includes('_'))
      res.push(t)
  }
  let title = ''
  for (let i = 0; i < res.length; i++) {
    const temp = res[i]!
    if (temp.includes('parameter') || temp.includes('constructor') || temp.includes('method'))
      title += `${temp}: `
    else
      title += `${temp} `
  }

  return title.trim().replace(/:$/, '')
}
