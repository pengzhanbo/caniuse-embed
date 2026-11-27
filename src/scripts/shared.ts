export const on = (ev: string, cb: EventListener) => window.addEventListener(ev, cb)

export const toNum = (v: string) => Number.parseInt(v, 10)

export const $ = <T extends Element>(query: string) => document.querySelector<T>(query)

export function noNullable(value: string | null, defaultValue = '') {
  return value === null || value === 'null' ? defaultValue : value || defaultValue
}

export function initSearch() {
  const hash
    = window.location.hash.slice(1) || window.location.search.slice(1)
  return new URLSearchParams(hash)
}

export const el = $('.main')
const featureName
  = $<HTMLInputElement>('.feature_id')?.value
let meta = ''

export function updateMeta(search: URLSearchParams) {
  meta = noNullable(search.get('meta'), '')
}

// 拖动窗口会在短时间内触发大量 resize 事件，使用 rAF 合并，避免高频 postMessage
let pendingFrame = 0

export function resize() {
  if (pendingFrame)
    return
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = 0
    postHeight()
  })
}

function postHeight() {
  if (!el)
    return

  const height = el.getBoundingClientRect().height
  if (!Number.isFinite(height) || height <= 0)
    return

  const data = {
    type: 'ciu-embed',
    payload: { feature: featureName, height: Math.ceil(height), meta },
  }
  window.parent?.postMessage(data, '*')
}

let themeMode = 'auto' // light / dark / auto

export function initTheme() {
  // 先应用 URL 中的 theme，避免先按系统主题渲染再切换导致闪烁
  updateThemeWithSearch(initSearch())
  if (typeof window.matchMedia !== 'undefined') {
    darkMather().addEventListener('change', (ev) => {
      if (themeMode === 'auto')
        updateTheme(ev.matches)
    })
  }
}

export function updateThemeWithSearch(search: URLSearchParams) {
  themeMode = noNullable(search.get('theme'), 'auto')
  if (!['auto', 'light', 'dark'].includes(themeMode))
    themeMode = 'auto'
  const media = darkMather()
  updateTheme(themeMode === 'auto' ? media.matches : themeMode === 'dark')
}

export function darkMather() {
  return window.matchMedia('(prefers-color-scheme: dark)')
}

export function updateTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

export function onFontLoading(fn: () => void) {
  if ('fonts' in document) {
    document.fonts.ready?.then(() => fn())
  }
}

/**
 * 内容变化（文字折行、字体替换、图片加载）不一定触发 resize，
 * 用 ResizeObserver 观察根容器，确保 iframe 高度始终跟随内容。
 */
export function observeHeight() {
  if (!el || typeof ResizeObserver === 'undefined')
    return
  const observer = new ResizeObserver(() => resize())
  observer.observe(el)
}

observeHeight()
