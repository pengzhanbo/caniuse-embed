export function normalizeVersion(version: string, index = 0): string {
  if (version.includes('-'))
    version = version.split('-')[index]!
  if (version.startsWith('<='))
    return version.slice(2)
  return version
}
