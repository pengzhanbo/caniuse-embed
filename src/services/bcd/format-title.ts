function withDescriptions(paths: string[], descriptions: string[], sep = ': '): string {
  if (paths.length < descriptions.length)
    descriptions = descriptions.slice(descriptions.length - paths.length - 1)

  const res: string[] = []
  for (let i = 0; i < descriptions.length; i++) {
    res.push(descriptions[i] || paths[i]!)
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
      const temp = titles.join(' ')
      if (temp.includes('constructor') || temp.includes('@@'))
        titles.shift()
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
