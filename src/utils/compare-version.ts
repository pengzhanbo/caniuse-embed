import { normalizeVersion } from './normalize-version'

const NUMERIC_VERSION = /^\d+(?:\.\d+)*$/

/**
 * 预览版本的不同写法
 *
 * BCD 使用 `preview`，caniuse 使用 `TP`（Safari Technology Preview），
 * 二者表达的是同一个版本通道，必须视为相等，否则 BCD 的前缀/别名判定
 * 永远对不上 Safari 的未来版本。
 */
const PREVIEW_VERSIONS = new Set(['tp', 'preview', 'beta', 'nightly', 'alpha', 'dev'])

function isPreviewVersion(version: string): boolean {
  return PREVIEW_VERSIONS.has(version.toLowerCase())
}

/**
 * 比较两个版本号的大小
 *
 * 版本号可能存在以下几种形态：
 * - 数字版本：`'120'`、`'15.2'`、`'4.4.3'`
 * - 非数字版本（预览版本）：`'TP'`（Safari Technology Preview）、`'preview'`
 * - 聚合版本：`'all'`（Opera Mini）
 *
 * 比较规则：
 * - 两个数字版本按每一段数字逐一比较，缺失的段视为 `0`（`'1.0.0'` === `'1'`）
 * - 非数字版本视为「比任何数字版本都新」（`'7' < 'TP'`）
 * - 两个非数字版本按字符串字典序比较
 *
 * @returns
 *  - `1`: v1 > v2
 *  - `-1`: v1 < v2
 *  - `0`: v1 = v2
 */
export function compareVersion(v1: string, v2: string): 0 | 1 | -1 {
  const a = normalizeVersion(v1)
  const b = normalizeVersion(v2)

  if (a === b)
    return 0

  if (isPreviewVersion(a) || isPreviewVersion(b)) {
    if (isPreviewVersion(a) && isPreviewVersion(b))
      return 0
    return isPreviewVersion(a) ? 1 : -1
  }

  const numA = parseNumericVersion(a)
  const numB = parseNumericVersion(b)

  if (numA && numB)
    return compareNumericParts(numA, numB)

  // 非数字版本（TP / preview / all）语义上不属于常规版本序列，
  // 统一视为比任何数字版本都新，避免被当作「相等」从而误判支持状态。
  if (numA)
    return -1
  if (numB)
    return 1

  return a > b ? 1 : -1
}

export function parseNumericVersion(version: string): number[] | null {
  if (!NUMERIC_VERSION.test(version))
    return null
  return version.split('.').map(segment => Number(segment))
}

function compareNumericParts(a: number[], b: number[]): 0 | 1 | -1 {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x > y)
      return 1
    if (x < y)
      return -1
  }
  return 0
}
