import type { BaselineFeatureData, CaniuseData, FeatureDataVersions, MDNCompatData } from '../types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createSingletonPromise } from '@pengzhanbo/utils'
import { fetchData } from '../utils/fetch-data'
import { writeFileAtomic } from '../utils/write-file'
import { clearStatsCache } from './bcd/caniuse-status'
import { resetUsageCaches } from './bcd/compute-usage'
import { buildFeatureData, type FeatureDataBundle } from './build-feature-data'
import { getTransformVersion } from './cache-version'
import { getLocalDataVersions, resolveDataSources, toDataVersion } from './data-source'

const cacheDir = path.join(process.cwd(), 'data')
const cacheFile = path.join(cacheDir, 'cached.json')

const isDev = Boolean(import.meta.env?.DEV)
const maxAge = (isDev ? 3 : 24) * 60 * 60 * 1000
/** 缓存结构版本，结构变化时旧缓存直接失效 */
const CACHE_SCHEMA = 1

interface CachedFeatureData extends FeatureDataBundle {
  schema?: number
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
    if (!cached?.featureList?.length || cached.version !== version || cached.schema !== CACHE_SCHEMA)
      return null

    return {
      featureList: cached.featureList,
      baseline: cached.baseline,
      bcdUpdated: cached.bcdUpdated,
      ciuUpdated: cached.ciuUpdated,
      versions: cached.versions,
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
  let versions: FeatureDataVersions
  // 开发环境直接从本地读取
  if (isDev) {
    const def = await import('../common/data')
    bcd = def.bcd
    caniuse = def.caniuse
    webFeatures = def.baseline
    versions = await getLocalDataVersions()
  }
  else {
    // 自动构建优先拿到上游最新发布的数据；CDN 不稳定时回退到已安装的版本，
    // 避免一次网络抖动导致整次部署失败。
    try {
      const sources = await resolveDataSources()
      const [bcdData, caniuseData, baselineData] = await Promise.all([
        fetchData<MDNCompatData>(sources.bcd.url),
        fetchData<CaniuseData>(sources.caniuse.url),
        fetchData<{ features: Record<string, BaselineFeatureData> }>(sources.baseline.url),
      ])
      bcd = bcdData
      caniuse = caniuseData
      webFeatures = baselineData.features
      versions = {
        bcd: toDataVersion(sources.bcd.version),
        caniuse: toDataVersion(sources.caniuse.version),
        webFeatures: toDataVersion(sources.baseline.version),
      }
    }
    catch (error) {
      console.warn(
        '[caniuse-embed] 远程数据获取失败，回退到 node_modules 中已安装的版本。',
        error instanceof Error ? error.message : error,
      )
      const def = await import('../common/data')
      bcd = def.bcd
      caniuse = def.caniuse
      webFeatures = def.baseline
      versions = await getLocalDataVersions()
    }
  }

  const data = { ...buildFeatureData(bcd, caniuse, webFeatures), versions }

  // 初始化完成，清除统计缓存，避免长期占用内存 / 影响下一次数据重载
  clearStatsCache()
  resetUsageCaches()

  memory.data = data
  memory.updated = Date.now()
  memory.version = version

  if (isDev) {
    // 写入本地缓存文件
    await fs.mkdir(cacheDir, { recursive: true })
    await writeFileAtomic(cacheFile, JSON.stringify({
      ...data,
      schema: CACHE_SCHEMA,
      version,
      cachedAt: Date.now(),
    } satisfies CachedFeatureData))
  }

  // 完成请求后重置单例锁
  getFeaturesList.reset()
  return data
})
