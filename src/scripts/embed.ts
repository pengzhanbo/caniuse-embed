(function () {
  const $ = (query: string) => document.querySelector(query)
  const $$ = (query: string) => document.querySelectorAll(query)

  const [ft, p, f, t, m] = ['feature', 'past', 'future', 'theme', 'meta']
  const [qs, vercel, peng] = ['script[src*="caniuse"][src*="/embed.js"]', 'caniuse-embed.vercel.app', 'caniuse.pengzhanbo.cn']

  /**
   * 对于国内的用户，使用 caniuse.pengzhanbo.cn 作为替代，解决 vercel.app 网站无法访问的问题
   */
  const site = $(qs)
  let origin = ''
  if (site) {
    const source = attr(site, 'src')
    origin = `https://${source.includes(vercel) ? vercel : peng}`
  }

  /**
   * uuid 是为了避免 假设存在多个相同的 feature，使用 meta 做唯一标识，
   * 正确设置 对应的 iframe height 值
   */
  let uuid = 1
  const embeds = $$('.ciu-embed')

  for (const embed of embeds) {
    const source = genSource(embed)
    if (source) {
      const iframe = createIframe(embed, source)
      /**
       * 支持 MutationObserver, 这在一些框架中比较有用，
       * 比如 切换 浅色 / 深色 模式
       */
      attr(embed, 'observer') === 'true' && observer(embed, iframe)
    }
  }

  window.addEventListener('message', onmessage)

  function onmessage(ev: MessageEvent): void {
    const data = parseData(ev.data)
    const { type, payload = {} } = data
    if (type === 'ciu_embed') {
      const embeds = $$('.ciu-embed')
      for (const embed of embeds) {
        if (payload.feature === attr(embed, ft) && payload.meta === attr(embed, m)) {
          const iframe = embed.querySelector('iframe')
          iframe && (iframe.style.height = `${Math.ceil(payload.height)}px`)
        }
      }
    }
  }

  function observer(embed: Element, iframe: HTMLIFrameElement) {
    if (typeof window.MutationObserver === 'undefined')
      return
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const source = genSource(embed)
          if (source)
            iframe.src = source
        }
      }
    })
    observer.observe(embed, { attributes: true })
  }

  function genSource(embed: Element) {
    const feature = attr(embed, ft)
    if (!feature)
      return ''

    let meta = attr(embed, m)
    if (!meta) {
      meta = `${Date.now()}-${uuid++}`
      attr(embed, m, meta)
    }

    const params = [p, f, t]
      .map(k => [k, attr(embed, k)])
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    return `${origin}/${feature}#${m}=${meta}${params ? `&${params}` : ''}`
  }

  function createIframe(embed: Element, source: string) {
    const iframe = document.createElement('iframe') as HTMLIFrameElement
    iframe.src = source
    iframe.className = 'ciu-embed-iframe'
    attr(iframe, 'style', 'display:block;width:100%;height:330px;border:none;')
    iframe.allow = 'fullscreen'
    embed.appendChild(iframe)
    return iframe
  }

  function attr(el: Element, key: string): string
  function attr(el: Element, key: string, value: string): void
  function attr(el: Element, ...args: string[]) {
    const name = `data-${args[0]}`
    if (args.length === 1)
      return el.getAttribute(name) || ''
    else
      el.setAttribute(name, args[1])
  }

  function parseData(data: unknown): any {
    let result = {}
    try {
      result = typeof data === 'string' ? JSON.parse(data) : data
    }
    catch {}
    return result
  }
})()
