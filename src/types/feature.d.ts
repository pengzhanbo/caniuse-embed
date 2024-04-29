import type { Browser } from './caniuse'
import type { Period } from './browser'

export type FeatureList = [string, Feature][]

export interface FeatureData {
  featureList: FeatureList
  ciuUpdated: number
  bcdUpdated: number
}

export interface Feature {
  title: string
  description?: string
  url: string
  globalA?: string
  globalY?: string
  globalT?: string
  experimental?: boolean
  deprecated?: boolean
  prefixed?: boolean
  unknown?: boolean
  flag?: boolean
  supports: FeatureSupport[]
}

export interface FeatureSupport {
  browser: Browser
  periods: FeatureSupportPeriod[]
}

export interface FeatureSupportPeriod extends Period {
  isSupported: boolean
  supportType: string
  prefixed: boolean
  unknown: boolean
  flag: boolean
}

export interface FeatureBrowserSupport extends Omit<FeatureSupportPeriod, 'period'> {
  browser: Browser
}
