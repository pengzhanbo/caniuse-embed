(function () {
  const $ = (query: string) => document.querySelector(query)
  const $$ = (query: string) => document.querySelectorAll(query)
  const attr = (el: Element, ...args: string[]) => {
    const name = `data-${args[0]}`
    if (args.length === 1)
      return el.getAttribute(name)
    else
      el.setAttribute(name, args[1])
  }

  const site = $('script[src*="caniuse"][src*="/embed.js"]')
  let origin = ''
  if (site) {
    const source = site.getAttribute('src') || ''
    origin = source.includes('vercel.app') ? 'https://caniuse-embed.vercel.app' : 'https://caniuse.pengzhanbo.cn'
  }

  const embeds = $$('.ciu-embed')
  let uuid = 1

  for (const embed of embeds) {
    const feature = attr(embed, 'feature')
    if (!feature)
      continue

    const past = attr(embed, 'past') || ''
    const future = attr(embed, 'future') || ''
    let meta = attr(embed, 'meta') || ''
    if (!meta) {
      meta = `${uuid++}`
      attr(embed, 'meta', meta)
    }
    const source = `${origin}/${feature}#meta=${meta}&past=${past}&future=${future}`
    const iframe = document.createElement('iframe') as HTMLIFrameElement
    iframe.src = source
    iframe.className = 'ciu-embed-iframe'
    iframe.setAttribute('style', 'display:block;width:100%;height:330px;border:none;')
    iframe.allow = 'fullscreen'
    embed.appendChild(iframe)
  }

  window.addEventListener('message', (ev): void => {
    const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
    const { type, payload } = data
    if (type === 'ciu_embed') {
      const embeds = $$('.ciu-embed')
      for (const embed of embeds) {
        const feature = attr(embed, 'feature')
        const meta = attr(embed, 'meta') || ''
        if (payload.feature === feature && payload.meta === meta) {
          const iframe = embed.querySelector('iframe') as HTMLIFrameElement
          iframe.style.height = `${Math.ceil(payload.height)}px`
        }
      }
    }
  })
})()
