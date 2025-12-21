/**
 * https://caniuse-embed.vercel.app/{feature}?meta={meta}&past={past}&future={future}&theme={theme}
 *
 * https://caniuse.pengzhanbo.cn/{feature}?meta={meta}&past={past}&future={future}&theme={theme}
 *
 * feature: string
 * meta: string -  uuid
 * past: number - past browser version  range: 0 - 5
 * future: number - future browser version  range: 0 - 3
 * theme: optional string - light /dark / auto
 */
import { el, initSearch, initTheme, noNullable, on, onFontLoading, resize, toNum, updateMeta, updateThemeWithSearch } from './shared'

initTheme()

on('hashchange', hashchange)
on('resize', resize)
onFontLoading(resize)
// delay execution to make Safari happy
requestAnimationFrame(() => setTimeout(hashchange, 0))

function hashchange() {
  const search = initSearch()
  updateMeta(search)
  updatePeriod(search)
  updateThemeWithSearch(search)
  resize()
}

function updatePeriod(search: URLSearchParams) {
  const past = toNum(noNullable(search.get('past'), '2'))
  const future = toNum(noNullable(search.get('future'), '1'))
  const list: string[] = []

  Array.from({ length: past }).fill(0).forEach((_, i) => list.push(`past_${i + 1}`))
  Array.from({ length: future }).fill(0).forEach((_, i) => list.push(`future_${i + 1}`))

  el?.setAttribute('class', `feature ${list.join(' ')}`)
}
