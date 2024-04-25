(function () {
  const embeds = document.querySelectorAll('.ciu-embed')
  let uuid = 1

  for (const embed of embeds) {
    const feature = embed.getAttribute('data-feature')
    if (!feature)
      continue

    const past = embed.getAttribute('data-past') || ''
    const future = embed.getAttribute('data-future') || ''
    let meta = embed.getAttribute('data-meta') || ''
    if (!meta) {
      meta = `${uuid++}`
      embed.setAttribute('data-meta', meta)
    }
    const source = `/${feature}#meta=${meta}&past=${past}&future=${future}`
    const iframe = document.createElement('iframe') as HTMLIFrameElement
    iframe.src = source
    iframe.className = 'ciu-embed-iframe'
    iframe.setAttribute('style', 'width:100%;height:330px;border:none;')
    iframe.allow = 'fullscreen'
    embed.appendChild(iframe)
  }

  window.addEventListener('message', (ev) => {
    const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
    const { type, payload } = data
    if (type === 'ciu_embed') {
      const embeds = document.querySelectorAll('.ciu-embed')
      for (const embed of embeds) {
        const feature = embed.getAttribute('data-feature')
        const meta = embed.getAttribute('data-meta') || ''
        if (payload.feature === feature && payload.meta === meta) {
          const iframe = embed.querySelector('iframe') as HTMLIFrameElement
          iframe.style.height = `${payload.height}px`
        }
      }
    }
  })
})()
