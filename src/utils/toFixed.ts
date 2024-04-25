export function toFixed(n: number) {
  n = n * 100
  return Math.round(n) / 100
}
