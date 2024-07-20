import { hasOwn } from '@pengzhanbo/utils'
import type { MDNCompatData, MDNCompatDataList } from '../types'

export function parseCompatData(
  bcd: Omit<MDNCompatData, '__meta'>,
  res: MDNCompatDataList = [],
  prefix: string[] = [],
): MDNCompatDataList {
  for (const feature in bcd) {
    if (hasOwn(bcd, feature)) {
      const { __compat, ...data } = bcd[feature]
      const newPrefix = [...prefix, feature]
      if (__compat) {
        __compat.url = __compat.mdn_url
        __compat.title = formatMDNCompatTitle(newPrefix)
        res.push([`mdn-${newPrefix.join('_')}`, __compat])
      }
      const keys = Object.keys(data)
      if (keys.length && keys[0] !== '0')
        parseCompatData(data, res, newPrefix)
    }
  }
  return res
}

function formatMDNCompatTitle(path: string[]): string {
  if (path.length <= 1)
    return path.join(' ')

  const [type, ...clone] = path

  switch (type) {
    case 'api':
      return `${clone.join(' ')} API`

    case 'css': {
      const [cssType, ...css] = clone
      if (cssType === 'at-rules')
        return `CSS at-rule: @${css.join(' ')}`
      if (cssType === 'properties')
        return `CSS Property: ${css.length === 1 ? css[0] : `${css[0]}:${css[1]} ${css.slice(2).join(' ')}`.trim()}`
      if (cssType === 'selectors')
        return `CSS Selector: ${css.join(' ')}`
      if (cssType === 'types')
        return `CSS Data Type: ${css.join(' ')}`

      break
    }

    case 'html': {
      const [htmlType, ...html] = clone

      if (htmlType === 'manifest')
        return `Web App Manifest Property: ${html.join(' ')}`
      if (htmlType === 'global_attributes')
        return `Global HTML Attribute: ${html.join(' ')}`
      if (htmlType === 'elements') {
        if (html[0] === 'input')
          return `HTML Element: ${html.slice(2).join(' ')}`
        return `HTML Element: ${html.slice(1).join()}`
      }
      break
    }

    case 'http': {
      if (clone.length !== 2)
        break

      const [httpType, name] = clone
      if (httpType === 'methods')
        return `HTTP Method: ${name}`
      if (httpType === 'status')
        return `HTTP Status: ${name}`
      if (httpType === 'headers')
        return `HTTP Header: ${name}`

      break
    }

    case 'javascript':
      return `Javascript ${clone.join(' ')}`

    case 'mathml':
      if (clone.length !== 2)
        break

      if (clone[0] === 'elements')
        return `MathML Element: ${clone[1]}`

      break

    case 'svg': {
      if (clone.length !== 2 && clone.length !== 3)
        break
      const [svgType, ...svg] = clone
      if (svgType === 'elements')
        return `SVG Element: ${svg[0]}`

      if (svgType === 'attributes')
        return svg.length === 2 ? `SVG Attribute: ${svg[1]}` : `SVG Attribute: ${svg[0]}`

      break
    }

    case 'webextensions': {
      if (clone.length !== 2 && clone.length !== 3)
        break
      const [extType, ...ext] = clone

      if (extType === 'manifest' && ext.length === 1)
        return `WebExtension Manifest Property: ${path[0]}`

      if (extType === 'api' && ext.length === 2)
        return `WebExtensions API: ${path[0]} ${path[1]}`

      break
    }
  }

  return path.join(' ')
}
