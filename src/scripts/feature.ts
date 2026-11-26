/**
 * https://caniuse-embed.vercel.app/{feature}?meta={meta}&past={past}&future={future}&theme={theme}
 *
 * feature: string
 * meta: string -  uuid
 * past: number - past browser version  range: 0 - 5
 * future: number - future browser version  range: 0 - 3
 * theme: optional string - light /dark / auto
 */
import { $, el, initSearch, initTheme, noNullable, on, onFontLoading, resize, toNum, updateMeta, updateThemeWithSearch } from './shared'

const MAX_PAST = 5
const MAX_FUTURE = 3
const DEFAULT_PAST = 2
const DEFAULT_FUTURE = 1

const PERIOD_CLASSES = [
  'past_1',
  'past_2',
  'past_3',
  'past_4',
  'past_5',
  'future_1',
  'future_2',
  'future_3',
] as const

initTheme()

on('hashchange', hashchange)
on('resize', resize)
onFontLoading(resize)
// delay execution to make Safari happy
requestAnimationFrame(() => setTimeout(hashchange, 0))

const embed = $('.embed-link') as HTMLAnchorElement | null
if (embed) {
  embed.href = location.origin
  embed.innerHTML = location.hostname
}

function hashchange() {
  const search = initSearch()
  updateMeta(search)
  updatePeriod(search)
  updateThemeWithSearch(search)
  resize()
}

function toRange(value: string | null, fallback: number, max: number): number {
  const num = toNum(noNullable(value, `${fallback}`))
  if (!Number.isFinite(num))
    return fallback
  return Math.min(Math.max(Math.trunc(num), 0), max)
}

function updatePeriod(search: URLSearchParams) {
  const past = toRange(search.get('past'), DEFAULT_PAST, MAX_PAST)
  const future = toRange(search.get('future'), DEFAULT_FUTURE, MAX_FUTURE)

  if (!el)
    return

  // 逐项切换，避免覆盖元素的基础 class
  for (const name of PERIOD_CLASSES) {
    const [type, index] = name.split('_') as ['past' | 'future', string]
    const limit = type === 'past' ? past : future
    el.classList.toggle(name, Number(index) <= limit)
  }
}
