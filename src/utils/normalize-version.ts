// MDN browser-compat-data 中存在 `≤12.1`、`>=15` 这类非严格版本号描述。
// `≤` 表示「在 12.1 及之前就已支持」，因此参与大小比较时取下界（即去掉比较符）。
const LEADING_COMPARATOR = /^(?:[<>]=?|[≤≥])/
const TRAILING_PLUS = /\+$/

/**
 * 将版本号规范化为「可用于比较/展示的单一版本号」
 *
 * - `'15.2-15.3'` → `'15.2'`（`index = 0`）或 `'15.3'`（`index = 1`）
 * - `'≤12.1'` → `'12.1'`
 * - `'>=15'` → `'15'`
 * - `'4+'` → `'4'`
 * - `'TP'` / `'preview'` / `'all'` 原样返回
 */
export function normalizeVersion(version: string, index = 0): string {
  if (!version)
    return ''

  let value = String(version).trim()

  if (value.includes('-')) {
    const parts = value.split('-')
    value = (parts[index] ?? parts[0] ?? '').trim()
  }

  return value
    .replace(LEADING_COMPARATOR, '')
    .replace(TRAILING_PLUS, '')
    .trim()
}
