// `markdown-it` 自带类型，不要在这里声明，否则会被抹成 any
declare module 'markdown-it-link-attributes' {
  import type { MarkdownIt } from 'markdown-it'

  interface Options {
    attrs?: Record<string, string>
    linkify?: boolean
    /**
     * 只对匹配的链接生效
     */
    matcher?: (link: string) => boolean
  }

  const plugin: (md: MarkdownIt, options?: Options) => void
  export default plugin
}
