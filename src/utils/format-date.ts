export function formatDate(date: number | string | Date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return [`${year}-${month}-${day}`, d.toISOString()] as readonly [string, string]
}
