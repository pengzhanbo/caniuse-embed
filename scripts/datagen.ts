import type { BaselineFeatureData, CaniuseData, MDNCompatData } from '../src/types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { buildFeatureData } from '../src/services/build-feature-data'
import { getTransformVersion } from '../src/services/cache-version'
import { resolveDataSources } from '../src/services/data-source'
import { fetchData } from '../src/utils/fetch-data'
import { writeFileAtomic } from '../src/utils/write-file'

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

const data = {
  ...buildFeatureData(bcd, caniuse, webFeatures),
  versions: {
    bcd: sources.bcd.version,
    caniuse: sources.caniuse.version,
    webFeatures: sources.baseline.version,
  },
}
const version = await getTransformVersion()

await fs.mkdir(cacheDir, { recursive: true })
await writeFileAtomic(cacheFile, JSON.stringify({
  ...data,
  schema: 1,
  version,
  cachedAt: Date.now(),
}))

console.log('Feature list generated:', {
  bcd: `${sources.bcd.version} (${bcd.__meta.timestamp})`,
  caniuse: `${sources.caniuse.version} (${new Date(data.ciuUpdated).toISOString()})`,
  webFeatures: sources.baseline.version,
  features: data.featureList.length,
  baseline: Object.keys(data.baseline).length,
})
