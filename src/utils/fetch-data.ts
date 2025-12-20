export async function fetchData<T>(url: string): Promise<T> {
  return await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())
}
