/**
 * 比较两个版本号的大小
 * @returns
 *  - `1`: v1 > v2
 *  - `-1`: v1 < v2
 *  - `0`: v1 = v2
 */
export function compareVersion(v1: string, v2: string): 0 | 1 | -1 {
  if (v1 === v2)
    return 0

  const ver1 = v1.split('.')
  const ver2 = v2.split('.')

  const len = Math.max(ver1.length, ver2.length)
  let i = 0

  for (; i < len; i++) {
    const a = ver1[i]!
    const b = ver2[i]!
    if (
      (a && !b && Number.parseInt(a) > 0)
      || (Number.parseInt(a) > Number.parseInt(b))
    ) {
      return 1
    }
    else if (
      (b && !a && Number.parseInt(b) > 0)
      || (Number.parseInt(a) < Number.parseInt(b))
    ) {
      return -1
    }
  }

  return 0
}
