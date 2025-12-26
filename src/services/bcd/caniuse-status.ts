import type { CaniuseStats, SimpleSupportStatement } from '../../types'
import { uniq } from '@pengzhanbo/utils'
import { FEATURE_IDENTIFIERS } from '../../common/constants'
import { compareVersion } from '../../utils/compare-version'
import { normalizeVersion } from './normalize-version'

const versionPattern = /^\d+$|^\d+\.\d+$|^\d+\.\d+\.\d+$/

export function getCaniuseStats(supports: SimpleSupportStatement[], version: string): CaniuseStats[] {
  const support = supports[0]!

  if (!support)
    return [FEATURE_IDENTIFIERS.unknown]

  if (support.version_added === false)
    return [FEATURE_IDENTIFIERS.unsupported]

  const stats: CaniuseStats[] = []
  const currentVersion = normalizeVersion(version)
  const added = normalizeVersion(support.version_added)

  if (!versionPattern.test(currentVersion) || compareVersion(added, currentVersion) <= 0) {
    if (support.flags?.length || support.partial_implementation || support.alternative_name) {
      support.flags?.length && stats.push(FEATURE_IDENTIFIERS.unsupported, FEATURE_IDENTIFIERS.flagged)
      support.prefix && stats.push(FEATURE_IDENTIFIERS.prefixed)
      support.partial_implementation && stats.push(FEATURE_IDENTIFIERS.partial)
    }
    else {
      stats.push(FEATURE_IDENTIFIERS.supported)
    }
  }

  for (const extra of supports.slice(1)) {
    if (extra.version_added === false)
      continue
    const added = normalizeVersion(extra.version_added)
    const removed = normalizeVersion(extra.version_removed || '')
    if (compareVersion(added, version) <= 0
      && (removed ? compareVersion(removed, currentVersion) > 0 : true)
    ) {
      if (extra.flags?.length || extra.partial_implementation || extra.alternative_name) {
        extra.flags?.length && stats.push(FEATURE_IDENTIFIERS.unsupported, FEATURE_IDENTIFIERS.flagged)
        extra.prefix && stats.push(FEATURE_IDENTIFIERS.prefixed)
        extra.partial_implementation && stats.push(FEATURE_IDENTIFIERS.partial)
      }
      else {
        stats.push(FEATURE_IDENTIFIERS.supported)
      }
    }
  }

  if (stats.length === 0)
    stats.push(FEATURE_IDENTIFIERS.unsupported)

  return uniq(stats)
}
