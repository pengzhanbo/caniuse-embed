import type { BaselineFeatureData, CaniuseData, FeatureData, MDNCompatData } from '../src/types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { API } from '../src/common/constants'
import { getBaselineStatusData } from '../src/services/baseline'
import { bcd2FeatureList } from '../src/services/bcd'
import { ciu2FeatureList } from '../src/services/ciu'
import { fetchData } from '../src/utils/fetch-data'

const cacheDir = path.join(process.cwd(), 'data')
console.log('cache dir ->', cacheDir)

console.log('Generating feature list...')
await writeFeatureList()
console.log('Feature list generated')

export async function writeFeatureList(): Promise<void> {
  // 为保持自动构建时数据是新鲜的，每次都从远程获取
  const [bcd, caniuse, baseline] = await Promise.all([
    fetchData<MDNCompatData>(API.bcd),
    fetchData<CaniuseData>(API.caniuse),
    fetchData<Record<string, BaselineFeatureData>>(API.baseline).then(res => res.features as unknown as Record<string, BaselineFeatureData>),
  ])

  const featureList: FeatureData[] = [
    ...bcd2FeatureList(bcd, caniuse.agents),
    ...ciu2FeatureList(caniuse),
  ]

  // await fs.mkdir(path.join(cacheDir, 'bcd'), { recursive: true })
  // await fs.mkdir(path.join(cacheDir, 'ciu'), { recursive: true })
  // for (const item of bcd2FeatureList(bcd, caniuse.agents)) {
  //   featureList.push(item)
  //   await fs.writeFile(path.join(cacheDir, 'bcd', `${item.id}.json`), JSON.stringify(item, null, 2), 'utf-8')
  // }

  // for (const item of ciu2FeatureList(caniuse)) {
  //   featureList.push(item)
  //   await fs.writeFile(path.join(cacheDir, 'ciu', `${item.id}.json`), JSON.stringify(item, null, 2), 'utf-8')
  // }

  await fs.writeFile(path.join(cacheDir, 'agents.json'), JSON.stringify(caniuse.agents, null, 2), 'utf-8')

  // 写入本地缓存文件
  await fs.writeFile(path.join(cacheDir, 'cached.json'), JSON.stringify({
    featureList,
    bcdUpdated: bcd.__meta.timestamp,
    ciuUpdated: caniuse.updated * 1000,
    baseline: getBaselineStatusData(baseline),

  }), 'utf-8')
}
