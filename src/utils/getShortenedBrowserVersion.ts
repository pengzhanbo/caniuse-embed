export function getShortenedBrowserVersion(version: string): string {
  if (version && version.includes('-'))
    version = version.split('-')[1]!

  return version
}
