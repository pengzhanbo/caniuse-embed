export function formatId(id: string | string[]): string {
  const str = Array.isArray(id) ? id.join('_') : id
  return str.toLowerCase().replaceAll('@', '-')
}
