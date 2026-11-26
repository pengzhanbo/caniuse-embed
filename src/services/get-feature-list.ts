import type { BaselineFeatureData, CaniuseData, MDNCompatData } from '../types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createSingletonPromise } from '@pengzhanbo/utils'
import { fetchData } from '../utils/fetch-data'
import { clearStatsCache } from './bcd/caniuse-status'
import { buildFeatureData, type FeatureDataBundle } from './build-feature-data'
import { getTransformVersion } from './cache-version'
import { resolveDataSources } from './data-source'

const cacheDir = path.join(process.cwd(), 'data')
const cacheFile = path.join(cacheDir, 'cached.json')

const isDev = Boolean(import.meta.env?.DEV)
const maxAge = (isDev ? 3 : 24) * 60 * 60 * 1000

interface CachedFeatureData extends FeatureDataBundle {
  /** 转换代码的 hash，代码变化后缓存立即失效 */
  version: string
  cachedAt: number
}

const memory: {
  data: FeatureDataBundle | null
  updated: number
  version: string
} = {
  data: null,
  updated: 0,
  version: '',
}

async function readDevCache(version: string): Promise<FeatureDataBundle | null> {
  try {
    const stat = await fs.stat(cacheFile)
    if (Date.now() - stat.mtimeMs > maxAge)
      return null

    const cached = JSON.parse(await fs.readFile(cacheFile, 'utf-8')) as CachedFeatureData
    if (!cached?.featureList?.length || cached.version !== version)
      return null

    return {
      featureList: cached.featureList,
      baseline: cached.baseline,
      bcdUpdated: cached.bcdUpdated,
      ciuUpdated: cached.ciuUpdated,
    }
  }
  catch {
    return null
  }
}

export const getFeaturesList = createSingletonPromise(async (): Promise<FeatureDataBundle> => {
  const version = await getTransformVersion()

  // 直接从内存缓存中读取
  if (memory.data && memory.version === version && Date.now() - memory.updated < maxAge)
    return memory.data

  if (isDev) {
    const cached = await readDevCache(version)
    if (cached) {
      memory.data = cached
      memory.updated = Date.now()
      memory.version = version
      getFeaturesList.reset()
      return cached
    }
  }

  let bcd!: MDNCompatData, caniuse!: CaniuseData, webFeatures!: Record<string, BaselineFeatureData>
  // 开发环境直接从本地读取
  if (isDev) {
    const def = await import('../common/data')
    bcd = def.bcd
    caniuse = def.caniuse
    webFeatures = def.baseline
  }
  else {
    // 自动构建必须拿到上游最新发布的数据，因此每次都从远程获取并解析到最新版本
    const sources = await resolveDataSources()
    const [bcdData, caniuseData, baselineData] = await Promise.all([
      fetchData<MDNCompatData>(sources.bcd.url),
      fetchData<CaniuseData>(sources.caniuse.url),
      fetchData<{ features: Record<string, BaselineFeatureData> }>(sources.baseline.url),
    ])
    bcd = bcdData
    caniuse = caniuseData
    webFeatures = baselineData.features
  }

  const data = buildFeatureData(bcd, caniuse, webFeatures)

  // 初始化完成，清除 stats 缓存，避免长期占用内存
  clearStatsCache()

  memory.data = data
  memory.updated = Date.now()
  memory.version = version

  if (isDev) {
    // 写入本地缓存文件
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(cacheFile, JSON.stringify({
      ...data,
      version,
      cachedAt: Date.now(),
    } satisfies CachedFeatureData), 'utf-8')
  }

  // 完成请求后重置单例锁
  getFeaturesList.reset()
  return data
})
