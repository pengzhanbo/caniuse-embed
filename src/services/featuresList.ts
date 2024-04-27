import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { FEATURE_IDENTIFIERS, MDN_BROWSERS_KEY } from '../common/constants'
import type {
  BrowserData,
  CaniuseFeatureList,
  Feature,
  FeatureList,
  FeatureSupport,
  MDNCompatDataList,
  MDNCompatSupport,
} from '../types'
import { toFixed } from '../utils/toFixed'
import { getFullData } from './getFullData'

const cache: { data: FeatureList | null, updated: number, maxAge: number } = {
  data: null,
  updated: 0,
  maxAge: import.meta.env.DEV ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000,
}

export async function getFeaturesList(): Promise<FeatureList> {
  if (cache.data && Date.now() - cache.updated < cache.maxAge)
    return cache.data

  if (import.meta.env.DEV) {
    const filepath = path.resolve(process.cwd(), 'data/features.json')
    const content = await fs.promises.readFile(filepath, 'utf-8')
    if (content) {
      cache.data = JSON.parse(content)
      cache.updated = Date.now()
      return cache.data!
    }
  }

  const { ciu, bcd, browsers } = await getFullData()
  const featureList: FeatureList = []

  addFeatureByCIU(ciu, browsers, featureList)
  addFeatureByBCD(bcd, browsers, featureList)

  cache.data = featureList
  cache.updated = Date.now()

  return featureList
}

function deepClone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export function addFeatureByBCD(
  bcd: MDNCompatDataList,
  browsers: BrowserData[],
  featureList: FeatureList,
) {
  for (const [feature, data] of bcd) {
    const item: Feature = {
      title: data.title,
      url: data.url,
      supports: deepClone(browsers) as FeatureSupport[],
      experimental: data.status?.experimental,
      deprecated: data.status?.deprecated,
    }

    for (const support of item.supports) {
      const supportData = data.support[MDN_BROWSERS_KEY[support.browser]]
      for (const period of support.periods) {
        const currentVersion = period.version
        if (supportData && currentVersion) {
          const added = getMDNSupportValue(supportData, 'version_added')
          const removed = getMDNSupportValue(supportData, 'version_removed')
          if (added === true)
            period.isSupported = true
          else if (currentVersion === 'TP' && Number.parseFloat(added) > 0)
            period.isSupported = true
          else if (Number.parseFloat(added) <= Number.parseFloat(currentVersion))
            period.isSupported = true

          if (removed && Number.parseFloat(removed) >= Number.parseFloat(currentVersion))
            period.isSupported = false

          period.supportType = period.isSupported ? FEATURE_IDENTIFIERS.supported : FEATURE_IDENTIFIERS.unsupported
        }
        else {
          period.isSupported = false
          if (currentVersion)
            item.unknown = true

          period.supportType = currentVersion ? FEATURE_IDENTIFIERS.unknown : ''
        }
      }
    }

    featureList.push([feature, item])
  }
}

function getMDNSupportValue<
  T extends MDNCompatSupport = MDNCompatSupport,
  K extends keyof T = keyof T,
>(
  support: T,
  key: K,
): T[K] {
  const _support = support as any
  let val!: T[K]

  if (_support[key])
    val = _support[key]
  else if (_support[0] && _support[0][key])
    val = _support[0][key]
  else if (_support[1] && _support[1][key])
    val = _support[1][key]

  if (typeof val === 'string')
    val = val.replace(/≤/g, '') as T[K]

  return val
}

export function addFeatureByCIU(
  ciu: CaniuseFeatureList,
  browsers: BrowserData[],
  featureList: FeatureList,
) {
  for (const [feature, data] of ciu) {
    const item: Feature = {
      title: data.title,
      description: data.description || '',
      url: `https://caniuse.com/#feat=${feature}`,
      supports: deepClone(browsers) as FeatureSupport[],
      globalA: data.usage_perc_a ? `${toFixed(data.usage_perc_a)}%` : '',
      globalY: data.usage_perc_y ? `${toFixed(data.usage_perc_y)}%` : '',
      flag: false,
      prefixed: false,
      unknown: false,
    }
    item.globalT = data.usage_perc_a && data.usage_perc_y
      ? `${toFixed(data.usage_perc_a + data.usage_perc_y)}%`
      : ''

    for (const support of item.supports) {
      for (const period of support.periods) {
        if (!period.version)
          continue

        const key = data.stats[support.browser][period.version] || ''
        period.supportType = key || ''
        period.isSupported = key.includes(FEATURE_IDENTIFIERS.supported)
        if (key.includes(FEATURE_IDENTIFIERS.flagged)) {
          period.flag = true
          item.flag = true
        }
        if (key.includes(FEATURE_IDENTIFIERS.prefixed)) {
          period.prefixed = true
          item.prefixed = true
        }
        if (key.includes(FEATURE_IDENTIFIERS.unknown)) {
          period.unknown = true
          item.unknown = true
        }
      }
    }

    featureList.push([feature, item])
  }
}
