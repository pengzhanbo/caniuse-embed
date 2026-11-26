import { getFeaturesList } from '../services/get-feature-list'
import { markdownToPlainText } from '../utils/markdown'

export const prerender = true

export async function GET() {
  const { featureList } = await getFeaturesList()

  return new Response(JSON.stringify(
    featureList.map(feature => ({
      // 下游（首页下拉框）以纯文本渲染，避免把上游 HTML 当可信内容
      label: markdownToPlainText(feature.title),
      value: feature.id,
    })),
  ), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json;charset=utf-8',
      'Cache-Control': import.meta.env?.DEV
        ? 'no-store'
        : 'public,max-age=86400,s-maxage=86400,stale-while-revalidate=604800',
    },
  })
}
