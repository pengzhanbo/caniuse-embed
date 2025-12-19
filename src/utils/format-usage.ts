export function toFixed(n: number) {
  n = n * 100
  return Math.round(n) / 100
}

export function formatUsage(usage: number): string {
  if (usage === 0)
    return '0%'
  return `${toFixed(usage)}%`
}
