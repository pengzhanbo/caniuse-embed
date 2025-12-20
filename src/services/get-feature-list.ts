import type { BaselineFeatureData, CaniuseData, FeatureData, FeatureStatus, MDNCompatData } from '../types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { API } from '../common/constants'
import { fetchData } from '../utils/fetch-data'
import { getBaselineStatusData } from './baseline'
import { bcd2FeatureList } from './bcd'
import { ciu2FeatureList } from './ciu'

const cacheDir = path.join(process.cwd(), 'data')
const cache: {
  data: null | {
    featureList: FeatureData[]
    baseline: Record<string, FeatureStatus>
    bcdUpdated: string
    ciuUpdated: number
  }
  updated: number
  maxAge: number
} = {
  data: null,
  updated: 0,
  maxAge: (import.meta.env?.DEV ? 3 : 24) * 60 * 60 * 1000,
}

export async function getFeaturesList(): Promise<{
  featureList: FeatureData[]
  baseline: Record<string, FeatureStatus>
  bcdUpdated: string
  ciuUpdated: number
}> {
  // 直接从内存缓存中读取
  if (cache.data && Date.now() - cache.updated < cache.maxAge)
    return cache.data

  if (import.meta.env?.DEV) {
    // 读取本地缓存文件
    try {
      const featuresContent = await fs.readFile(path.join(cacheDir, 'cached.json'), 'utf-8')
      if (featuresContent) {
        const current = Date.now()
        cache.data = JSON.parse(featuresContent)
        cache.updated = current
        return cache.data!
      }
    }
    catch {}
  }

  let bcd!: MDNCompatData, caniuse!: CaniuseData, baseline!: Record<string, BaselineFeatureData>
  // 开发环境直接从本地读取
  if (import.meta.env?.DEV) {
    const def = await import('../common/data')
    bcd = def.bcd
    caniuse = def.caniuse
    baseline = def.baseline
  }
  else {
    // 为保持自动构建时数据是新鲜的，每次都从远程获取
    [bcd, caniuse, baseline] = await Promise.all([
      fetchData<MDNCompatData>(API.bcd),
      fetchData<CaniuseData>(API.caniuse),
      fetchData<Record<string, BaselineFeatureData>>(API.baseline)
        .then(res => res.features as unknown as Record<string, BaselineFeatureData>),
    ])
  }

  const featureList: FeatureData[] = [
    ...bcd2FeatureList(bcd, caniuse.agents),
    ...ciu2FeatureList(caniuse),
  ]

  cache.data = {
    bcdUpdated: bcd.__meta.timestamp,
    ciuUpdated: caniuse.updated * 1000,
    featureList,
    baseline: getBaselineStatusData(baseline),
  }
  cache.updated = Date.now()

  if (import.meta.env?.DEV) {
    // 写入本地缓存文件
    await fs.writeFile(path.join(cacheDir, 'cached.json'), JSON.stringify(cache.data), 'utf-8')
  }

  return cache.data
}
