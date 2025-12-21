(function () {
  const $ = (query: string, el?: Element) => (el || document).querySelector(query)
  const $$ = (query: string) => document.querySelectorAll(query)
  const on = (ev: string, fn: (...args: any[]) => void) => window.addEventListener(ev, fn)

  const [ft, p, f, t, m, ciu, cbe] = ['feature', 'past', 'future', 'theme', 'meta', 'ciu-embed', 'ciu-baseline-embed']
  const [ce, cei] = [`.${ciu},.${cbe}`, 'ciu-embed-iframe']
  const style = (h: number) => `display:block;width:100%;height:${h}px;border:none;border-radius:0;`
  const qs = ['script[src*="caniuse"][src*="/embed.js"]', 'script[src*="/embed.js"]']

  const origin = getEmbedOrigin()

  /**
   * uuid 是为了避免 假设存在多个相同的 feature，使用 meta 做唯一标识，
   * 正确设置 对应的 iframe height 值
   */
  let uuid = 1

  const embeds = $$(ce)

  for (const embed of embeds) {
    const source = genSource(embed)
    if (source) {
      /**
       * 支持 MutationObserver, 这在一些框架中比较有用，
       * 比如 切换 浅色 / 深色 模式
       */
      observer(embed, createIframe(embed, source))
    }
  }

  on('message', onmessage)

  function onmessage(ev: MessageEvent): void {
    const data = parseData(ev.data)
    const { type, payload = {} } = data
    if (type === ciu) {
      const embeds = $$(ce)
      for (const embed of embeds) {
        if (payload[ft] === attr(embed, ft) && payload[m] === attr(embed, m)) {
          const iframe = $(`.${cei}`, embed) as HTMLIFrameElement
          if (iframe)
            iframe.style.height = `${Math.ceil(payload.height)}px`
        }
      }
    }
  }

  function observer(embed: Element, iframe: HTMLIFrameElement) {
    if (typeof window.MutationObserver === 'undefined')
      return
    const obs = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const source = genSource(embed)
          if (source)
            iframe.src = source
        }
      }
    })
    obs.observe(embed, { attributes: true })
  }

  /**
   * 获取 embed.js 所在数据源
   * 对于国内的用户，使用 caniuse.pengzhanbo.cn 作为替代，解决 vercel.app 网站无法访问的问题
   */
  function getEmbedOrigin() {
    const currentScript = (document.currentScript || $(qs[0]!) || $(qs[1]!)) as HTMLScriptElement
    if (currentScript) {
      const src = currentScript.src
      if (src) {
        const source = new URL(src)
        if (source.pathname.includes('/embed.js')) {
          return source.origin
        }
      }
      return 'https://caniuse.pengzhanbo.cn'
    }
    return ''
  }

  function genSource(embed: Element) {
    const feature = attr(embed, ft)
    if (!feature)
      return ''

    let meta = attr(embed, m)
    if (!meta)
      attr(embed, m, meta = `${Date.now()}-${uuid++}`)

    const isBaseline = embed.classList.contains(cbe)
    const params = [p, f, t]
      .map(k => [k, attr(embed, k)])
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    return `${attr(embed, 'origin') || origin}/${feature}${isBaseline ? '/baseline' : ''}#${m}=${meta}${params ? `&${params}` : ''}`
  }

  function createIframe(embed: Element, source: string) {
    const iframe = document.createElement('iframe') as HTMLIFrameElement
    const isBaseline = embed.classList.contains(cbe)
    iframe.src = source
    iframe.className = cei
    iframe.style.cssText = style(isBaseline ? 150 : 350)
    iframe.allow = 'fullscreen'
    embed.appendChild(iframe)
    return iframe
  }

  function attr(el: Element, key: string): string
  function attr(el: Element, key: string, value: string): void
  function attr(el: Element, ...args: string[]): void | string {
    const name = `data-${args[0]}`
    if (args.length === 1)
      return el.getAttribute(name) || ''
    else
      el.setAttribute(name, args[1]!)
  }

  function parseData(data: unknown): any {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data
    }
    catch {}
    return {}
  }
})()
