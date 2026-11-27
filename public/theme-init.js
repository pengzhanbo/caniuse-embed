/**
 * 在首次绘制前应用主题，避免暗色模式下白屏闪烁。
 *
 * 该文件由 <head> 中的同步脚本加载（非 module），
 * 因此 CSP 只需要 `script-src 'self'`，无需内联脚本或 unsafe-inline。
 */
(function () {
  try {
    const hash = window.location.hash.slice(1) || window.location.search.slice(1)
    const theme = new URLSearchParams(hash).get('theme') || 'auto'
    const isDark = theme === 'dark'
      || (theme === 'auto'
        && typeof window.matchMedia !== 'undefined'
        && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
    if (theme === 'light')
      document.documentElement.classList.add('light')
  }
  catch {
    // URLSearchParams / matchMedia 不可用时保持默认主题
  }
})()
