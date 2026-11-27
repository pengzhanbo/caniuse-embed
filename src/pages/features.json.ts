import { getFeaturesList } from '../services/get-feature-list'
import { formatId } from '../utils/format-id'
import { markdownToPlainText } from '../utils/markdown'

export const prerender = true

export async function GET() {
  const { featureList, baseline } = await getFeaturesList()

  // 使用紧凑的元组而不是对象，减少首页需要下载和解析的体积
  // [label, value, hasBaseline]
  const list = featureList.map(feature => [
    // 下游（首页下拉框）以纯文本渲染，避免把上游 HTML 当可信内容
    markdownToPlainText(feature.title),
    feature.id,
    Boolean(baseline[formatId(feature.source === 'mdn' ? feature.paths : feature.id)]) || feature.deprecated,
  ])

  return new Response(JSON.stringify(list), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json;charset=utf-8',
      'Cache-Control': import.meta.env?.DEV
        ? 'no-store'
        : 'public,max-age=86400,s-maxage=86400,stale-while-revalidate=604800',
    },
  })
}
