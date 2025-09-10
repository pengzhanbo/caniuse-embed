/**
 * https://caniuse-embed.vercel.app/{feature}?meta={meta}&past={past}&future={future}&theme={theme}&observer={observer}
 *
 * https://caniuse.pengzhanbo.cn/{feature}?meta={meta}&past={past}&future={future}&theme={theme}&observer={observer}
 *
 * feature: string
 * meta: string -  uuid
 * past: number - past browser version  range: 0 - 5
 * future: number - future browser version  range: 0 - 3
 * theme: optional string - light /dark / auto
 * observer: optional string - true / false
 */

const on = (ev: string, cb: EventListener) => window.addEventListener(ev, cb)
const toNum = (v: string) => Number.parseInt(v)
const $ = <T extends Element>(query: string) => document.querySelector<T>(query)

const el = $('.feature')
const embedLink = $('.embed-link') as HTMLAnchorElement

const featureName
    = $<HTMLInputElement>('.feature_id')?.value
let meta = ''

let themeMode = 'auto' // light / dark / auto

initTheme()
setEmbedLink()

on('hashchange', hashchange)
on('resize', resize)

requestAnimationFrame(() => {
  // delay execution to make Safari happy
  setTimeout(hashchange, 0)
})

function setEmbedLink() {
  const { origin, hostname } = location
  embedLink.href = origin
  embedLink.textContent = hostname
}

function hashchange() {
  const hash
      = window.location.hash.slice(1) || window.location.search.slice(1)
  const search = new URLSearchParams(hash)
  meta = noNullable(search.get('meta'), '')
  const past = toNum(noNullable(search.get('past'), '2'))
  const future = toNum(noNullable(search.get('future'), '1'))
  const list: string[] = []

  Array.from({ length: past }).fill(0).forEach((_, i) => list.push(`past_${i + 1}`))
  Array.from({ length: future }).fill(0).forEach((_, i) => list.push(`future_${i + 1}`))

  el?.setAttribute('class', `feature ${list.join(' ')}`)
  themeMode = noNullable(search.get('theme'), 'auto')
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  updateTheme(themeMode === 'auto' ? media.matches : themeMode === 'dark')

  resize()
}

function initTheme() {
  if (typeof window.matchMedia !== 'undefined') {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    if (themeMode === 'auto')
      updateTheme(media.matches)

    media.addEventListener('change', (ev) => {
      if (themeMode === 'auto')
        updateTheme(ev.matches)
    })
  }
}

function updateTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

function resize() {
  const height = el?.getBoundingClientRect().height
  const data = {
    type: 'ciu_embed',
    payload: { feature: featureName, height, meta },
  }
  window.parent?.postMessage(data, '*')
}

function noNullable(value: string | null, defaultValue = '') {
  return value === null || value === 'null' ? defaultValue : value || defaultValue
}
