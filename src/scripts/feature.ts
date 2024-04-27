/**
 * https://caniuse-embed.vercel.app/{feature}?meta={meta}&past={past}&future={future}&theme={theme}
 * meta: string -  uuid
 * past: number - past browser version  range: 1 - 5
 * future: number - future browser version  range: 1 - 3
 * theme: string - light/dark
 */

const on = window.addEventListener
const toNum = Number.parseInt

const el = document.querySelector('.feature')
const embedLink = document.querySelector('.embed-link') as HTMLAnchorElement

const featureName
    = document.querySelector<HTMLInputElement>('.feature_id')?.value
let meta = ''

hashchange()
setEmbedLink()

on('hashchange', hashchange)
on('resize', resize)

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

  Array(past).fill(0).forEach((_, i) => list.push(`past_${i + 1}`))
  Array(future).fill(0).forEach((_, i) => list.push(`future_${i + 1}`))

  el?.setAttribute('class', `feature ${list.join(' ')}`)
  document.documentElement.classList.toggle('dark', search.get('theme') === 'dark')
  resize()
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
