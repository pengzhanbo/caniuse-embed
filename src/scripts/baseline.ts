/**
 * https://caniuse-embed.vercel.app/{feature}/baseline?meta={meta}&theme={theme}
 *
 * https://caniuse.pengzhanbo.cn/{feature}?meta={meta}&theme={theme}
 *
 * feature: string
 * meta: string -  uuid
 * theme: optional string - light /dark / auto
 */

import { initSearch, initTheme, on, onFontLoading, resize, updateMeta, updateThemeWithSearch } from './shared'

initTheme()

on('hashchange', hashchange)
on('resize', resize)
onFontLoading(resize)
// delay execution to make Safari happy
requestAnimationFrame(() => setTimeout(hashchange, 0))

function hashchange() {
  const search = initSearch()
  updateMeta(search)
  updateThemeWithSearch(search)
  resize()
}
