import type { CaniuseData, FeatureData, MDNCompatData } from '../types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { API } from '../common/constants'
import { bcd2FeatureList } from './bcd'
import { ciu2FeatureList } from './ciu'

const cacheDir = path.join(process.cwd(), 'data')
const cache: {
  data: null | { featureList: FeatureData[], bcdUpdated: string, ciuUpdated: number }
  updated: number
  maxAge: number
} = {
  data: null,
  updated: 0,
  maxAge: (import.meta.env?.DEV ? 3 : 24) * 60 * 60 * 1000,
}

export async function getFeaturesList(): Promise<{
  featureList: FeatureData[]
  bcdUpdated: string
  ciuUpdated: number
}> {
  // 直接从内存缓存中读取
  if (cache.data && Date.now() - cache.updated < cache.maxAge)
    return cache.data

  if (import.meta.env?.DEV) {
    // 读取本地缓存文件
    try {
      await fs.mkdir(path.join(cacheDir, 'bcd'), { recursive: true })
      await fs.mkdir(path.join(cacheDir, 'ciu'), { recursive: true })
      const filepath = path.join(cacheDir, 'features.json')
      const content = await fs.readFile(filepath, 'utf-8')
      if (content) {
        const current = Date.now()
        cache.data = JSON.parse(content)
        cache.updated = current
        return cache.data!
      }
    }
    catch {}
  }

  let bcd!: MDNCompatData, caniuse!: CaniuseData
  // 开发环境直接从本地读取
  if (import.meta.env?.DEV) {
    const def = await import('../common/data')
    bcd = def.bcd
    caniuse = def.caniuse
  }
  else {
    // 为保持自动构建时数据是新鲜的，每次都从远程获取
    [bcd, caniuse] = await Promise.all([
      fetchData<MDNCompatData>(API.bcd),
      fetchData<CaniuseData>(API.caniuse),
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
  }
  cache.updated = Date.now()

  if (import.meta.env?.DEV) {
    // 写入本地缓存文件
    await fs.writeFile(path.join(cacheDir, 'features.json'), JSON.stringify(cache.data), 'utf-8')
  }

  return cache.data
}

async function fetchData<T>(url: string): Promise<T> {
  return await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())
}
