import { API } from '../common/constants'
import type { BrowserData, CaniuseData, CaniuseFeatureList, MDNCompatData, MDNCompatDataList } from '../types'
import { parseBrowserData } from './parseBrowserData'
import { parseCompatData } from './parseCompatData'

async function fetchData<T>(url: string): Promise<T> {
  return await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())
}

export async function getFullData(): Promise<{
  ciu: CaniuseFeatureList
  bcd: MDNCompatDataList
  browsers: BrowserData[]
}> {
  const [raw_ciu, raw_bcd] = await Promise.all([
    fetchData<CaniuseData>(API.caniuse),
    fetchData<MDNCompatData>(API.bcd),
  ])

  const browsers: BrowserData[] = parseBrowserData(raw_ciu.agents)
  const ciu: CaniuseFeatureList = []
  const bcd: MDNCompatDataList = parseCompatData(raw_bcd)

  for (const feature in raw_ciu.data)
    ciu.push([feature, raw_ciu.data[feature]])

  return {
    browsers,
    ciu,
    bcd,
  }
}
