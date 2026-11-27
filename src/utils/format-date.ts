/**
 * 统一使用 UTC 生成日期
 *
 * SSG 产物需要在不同时区的构建机上保持一致，否则跨零点时同一份数据
 * 会在 UTC 的 CI 与本地机器上得到不同日期。
 */
export function formatDate(date: number | string | Date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime()))
    return ['', ''] as const
  const iso = d.toISOString()
  return [iso.slice(0, 10), iso] as readonly [string, string]
}
