import type { BaselineFeatureData, CaniuseData, MDNCompatData } from '../src/types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { buildFeatureData } from '../src/services/build-feature-data'
import { getTransformVersion } from '../src/services/cache-version'
import { resolveDataSources } from '../src/services/data-source'
import { fetchData } from '../src/utils/fetch-data'

const cacheDir = path.join(process.cwd(), 'data')
const cacheFile = path.join(cacheDir, 'cached.json')

console.log('cache dir ->', cacheDir)
console.log('Generating feature list...')

// 与自动构建保持一致：解析上游最新发布版本后再获取数据
const sources = await resolveDataSources()
const [bcd, caniuse, webFeatures] = await Promise.all([
  fetchData<MDNCompatData>(sources.bcd.url),
  fetchData<CaniuseData>(sources.caniuse.url),
  fetchData<{ features: Record<string, BaselineFeatureData> }>(sources.baseline.url)
    .then(res => res.features),
])

const data = buildFeatureData(bcd, caniuse, webFeatures)
const version = await getTransformVersion()

await fs.mkdir(cacheDir, { recursive: true })
await fs.writeFile(cacheFile, JSON.stringify({
  ...data,
  version,
  cachedAt: Date.now(),
}), 'utf-8')

console.log('Feature list generated:', {
  bcd: `${sources.bcd.version} (${bcd.__meta.timestamp})`,
  caniuse: `${sources.caniuse.version} (${new Date(data.ciuUpdated).toISOString()})`,
  webFeatures: sources.baseline.version,
  features: data.featureList.length,
  baseline: Object.keys(data.baseline).length,
})
