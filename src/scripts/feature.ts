/**
 * https://caniuse-embed.vercel.app/{feature}?meta={meta}&past={past}&future={future}&theme={theme}
 * meta: string -  uuid
 * past: number - past browser version  range: 1 - 5
 * future: number - future browser version  range: 1 - 3
 * theme: string - light/dark
 */
(function () {
  const el = document.querySelector('.feature')
  const featureName
    = document.querySelector<HTMLInputElement>('.feature_id')?.value
  let meta = ''
  function hashchange() {
    const hash
      = window.location.hash.slice(1) || window.location.search.slice(1)
    const search = new URLSearchParams(hash)
    meta = noNullable(search.get('meta'), '')
    const past = Number.parseInt(noNullable(search.get('past'), '2'))
    const future = Number.parseInt(noNullable(search.get('future'), '1'))
    const list: string[] = []

    Array(past).fill(0).forEach((_, i) => list.push(`past_${i + 1}`))
    Array(future).fill(0).forEach((_, i) => list.push(`future_${i + 1}`))

    el?.setAttribute('class', `feature ${list.join(' ')}`)
    document.documentElement.classList.toggle('dark', search.get('theme') === 'dark')
    resize()
  }

  function noNullable(value: string | null, defaultValue = '') {
    return value === null || value === 'null' ? defaultValue : value || defaultValue
  }
  function resize() {
    const height = el?.getBoundingClientRect().height
    const data = {
      type: 'ciu_embed',
      payload: { feature: featureName, height, meta },
    }
    window.parent?.postMessage(JSON.stringify(data), '*')
  }
  hashchange()
  window.addEventListener('hashchange', hashchange)
  window.addEventListener('resize', resize)
})()
