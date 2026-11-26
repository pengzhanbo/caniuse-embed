(function () {
  const $ = (query: string, el?: Element) => (el || document).querySelector(query)
  const $$ = (query: string) => document.querySelectorAll(query)
  const on = (ev: string, fn: (...args: any[]) => void) => window.addEventListener(ev, fn)

  const [ft, p, f, t, m, ciu, cbe] = ['feature', 'past', 'future', 'theme', 'meta', 'ciu-embed', 'ciu-baseline-embed']
  const [ce, cei] = [`.${ciu},.${cbe}`, 'ciu-embed-iframe']
  const style = (h: number) => `display:block;width:100%;height:${h}px;border:none;border-radius:0;`
  const qs = ['script[src*="caniuse"][src*="/embed.js"]', 'script[src*="/embed.js"]']

  // 无法从 script 标签推导地址时的兜底数据源（站点默认域名）
  // 国内镜像：https://caniuse.pengzhanbo.cn
  const DEFAULT_ORIGIN = 'https://caniuse-embed.vercel.app'
  // 嵌入内容的高度上限，避免异常消息把宿主页面撑高
  const MAX_HEIGHT = 4000

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
    if (!data || typeof data !== 'object' || data.type !== ciu)
      return

    const payload = data.payload && typeof data.payload === 'object' ? data.payload : {}
    const height = Number(payload.height)
    if (!Number.isFinite(height) || height <= 0)
      return

    for (const embed of $$(ce)) {
      const iframe = $(`.${cei}`, embed) as HTMLIFrameElement | null
      if (!iframe)
        continue
      // 只接受来自本组件 iframe 的消息，防止任意窗口伪造高度
      if (ev.source && ev.source !== iframe.contentWindow)
        continue
      if (ev.origin && ev.origin !== getOrigin(iframe.src))
        continue
      if (payload[ft] !== getFeature(embed) || payload[m] !== attr(embed, m))
        continue

      iframe.style.height = `${Math.min(Math.ceil(height), MAX_HEIGHT)}px`
      return
    }
  }

  function observer(embed: Element, iframe: HTMLIFrameElement) {
    if (typeof window.MutationObserver === 'undefined')
      return
    const obs = new MutationObserver(() => {
      const source = genSource(embed)
      iframe.title = getIframeTitle(embed)
      if (source && source !== iframe.src)
        iframe.src = source
    })
    obs.observe(embed, {
      attributes: true,
      attributeFilter: [`data-${ft}`, `data-${p}`, `data-${f}`, `data-${t}`, 'data-origin', 'class'],
    })
  }

  /**
   * 获取 embed.js 所在数据源
   *
   * 默认域名是 caniuse-embed.vercel.app，国内镜像域名是 caniuse.pengzhanbo.cn，
   * 两者内容一致，直接使用 script 标签上的地址即可（无需写死域名）。
   */
  function getEmbedOrigin(): string {
    const candidates = [
      document.currentScript as HTMLScriptElement | null,
      $(qs[0]!) as HTMLScriptElement | null,
      $(qs[1]!) as HTMLScriptElement | null,
    ]

    for (const script of candidates) {
      const src = script?.src
      if (!src)
        continue
      try {
        const url = new URL(src, location.href)
        if (url.pathname.includes('/embed.js'))
          return url.origin
      }
      catch {}
    }

    return DEFAULT_ORIGIN
  }

  function getOrigin(src: string): string {
    try {
      return new URL(src, location.href).origin
    }
    catch {
      return ''
    }
  }

  function resolveOrigin(embed: Element): string {
    const custom = attr(embed, 'origin').trim()
    if (!custom)
      return origin

    try {
      const url = new URL(custom, location.href)
      if (url.protocol === 'https:' || url.protocol === 'http:')
        return url.origin
    }
    catch {}

    return origin
  }

  function getFeature(embed: Element): string {
    return attr(embed, ft).trim()
  }

  function isBaselineEmbed(embed: Element): boolean {
    return embed.classList.contains(cbe)
  }

  function getIframeTitle(embed: Element): string {
    const feature = getFeature(embed)
    return isBaselineEmbed(embed)
      ? `Baseline support for ${feature}`
      : `Browser support for ${feature}`
  }

  function genSource(embed: Element) {
    const feature = getFeature(embed)
    if (!feature)
      return ''

    let meta = attr(embed, m)
    if (!meta)
      attr(embed, m, meta = `${Date.now()}-${uuid++}`)

    const isBaseline = isBaselineEmbed(embed)
    const params = [p, f, t]
      .map(k => [k, attr(embed, k)])
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&')

    return `${resolveOrigin(embed)}/${encodeURIComponent(feature)}${isBaseline ? '/baseline' : ''}#${m}=${meta}${params ? `&${params}` : ''}`
  }

  function createIframe(embed: Element, source: string) {
    const iframe = document.createElement('iframe') as HTMLIFrameElement
    iframe.src = source
    iframe.className = cei
    iframe.title = getIframeTitle(embed)
    iframe.loading = 'lazy'
    iframe.style.cssText = style(isBaselineEmbed(embed) ? 150 : 350)
    iframe.setAttribute('allow', 'fullscreen')
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
