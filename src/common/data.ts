import type { BaselineFeatureData, CaniuseData, MDNCompatData } from '../types'
import mdn from '@mdn/browser-compat-data'
import ciuDB from 'caniuse-db/fulldata-json/data-2.0.json' with { type: 'json' }
import { features } from 'web-features'

export const caniuse = ciuDB as unknown as CaniuseData

export const bcd = mdn as unknown as MDNCompatData

export const baseline = features as unknown as Record<string, BaselineFeatureData>
