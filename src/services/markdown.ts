import markdown from 'markdown-it'
import linkAttr from 'markdown-it-link-attributes'

const md = markdown({
  html: true,
  linkify: true,
})

md.use(linkAttr, {
  attrs: {
    target: '_blank',
    rel: 'noopener',
  },
})

export function markdownRender(content: string): string {
  return md.render(content)
}
