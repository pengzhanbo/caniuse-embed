import type { BaselineFeatureData, CaniuseData, MDNCompatData } from '../src/types'
import process from 'node:process'
import mdn from '@mdn/browser-compat-data'
import ciuDB from 'caniuse-db/fulldata-json/data-2.0.json' with { type: 'json' }
import { features } from 'web-features'
import { buildFeatureData } from '../src/services/build-feature-data'
import { resolveDataSources } from '../src/services/data-source'
import { fetchData } from '../src/utils/fetch-data'

/**
 * 构建期数据体检
 *
 * 上游数据更新后，问题往往表现为「静默错误」而不是构建失败。
 * 这里把已知的数据异常变成显式的断言。
 *
 * - 默认读取 `node_modules` 中安装的数据集（离线、可重复）；
 * - `pnpm check:data --remote` 会像生产构建一样解析并拉取上游最新发布版本，
 *   用于在发布前确认最新数据没有引入新的异常。
 */
const remote = process.argv.includes('--remote')

async function loadData() {
  if (!remote) {
    return {
      bcd: mdn as unknown as MDNCompatData,
      caniuse: ciuDB as unknown as CaniuseData,
      webFeatures: features as unknown as Record<string, BaselineFeatureData>,
    }
  }

  const sources = await resolveDataSources()
  const [bcd, caniuse, webFeatures] = await Promise.all([
    fetchData<MDNCompatData>(sources.bcd.url),
    fetchData<CaniuseData>(sources.caniuse.url),
    fetchData<{ features: Record<string, BaselineFeatureData> }>(sources.baseline.url)
      .then(res => res.features),
  ])
  return { bcd, caniuse, webFeatures }
}

const { bcd, caniuse, webFeatures } = await loadData()
const { featureList, baseline } = buildFeatureData(bcd, caniuse, webFeatures)

const errors: string[] = []
const stats = {
  source: remote ? 'remote (latest)' : 'local node_modules',
  features: featureList.length,
  duplicateIds: 0,
  titlesWithHtml: 0,
  contradictory: { 'a+y': 0, 'x+y': 0, 'd-without-n': 0 },
  prefixedFeatures: 0,
  unknownCells: 0,
  discouraged: 0,
}

const ids = new Set<string>()
for (const feature of featureList) {
  if (ids.has(feature.id)) {
    stats.duplicateIds++
    errors.push(`重复的特性 id: ${feature.id}`)
  }
  ids.add(feature.id)

  if (/<[a-z]/i.test(feature.title))
    stats.titlesWithHtml++

  if (feature.prefixed)
    stats.prefixedFeatures++

  for (const support of feature.supports) {
    for (const period of support.periods) {
      const cell = new Set(period.stats || [])
      if (cell.has('u'))
        stats.unknownCells++
      if (cell.has('a') && cell.has('y'))
        stats.contradictory['a+y']++
      if (cell.has('x') && cell.has('y'))
        stats.contradictory['x+y']++
      if (cell.has('d') && !cell.has('n') && !cell.has('a'))
        stats.contradictory['d-without-n']++
    }
  }
}

const discouragedFeatures = Object.values(webFeatures)
  .filter(item => 'discouraged' in item && item.discouraged)
  .length
for (const status of Object.values(baseline)) {
  if (status.baseline === 'discouraged')
    stats.discouraged++
}

if (stats.contradictory['a+y'] > 0)
  errors.push(`存在 a+y 矛盾状态: ${stats.contradictory['a+y']}`)
if (stats.contradictory['x+y'] > 0)
  errors.push(`存在 x+y 矛盾状态: ${stats.contradictory['x+y']}`)
if (stats.discouraged < discouragedFeatures)
  errors.push(`baseline discouraged 数量(${stats.discouraged}) 少于 web-features(${discouragedFeatures})`)

console.log(JSON.stringify(stats, null, 2))

if (errors.length) {
  console.error('\n数据异常:')
  for (const error of errors.slice(0, 20))
    console.error(`- ${error}`)
  process.exitCode = 1
}
else {
  console.log('\n数据体检通过')
}
