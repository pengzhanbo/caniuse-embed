import { getFeaturesList } from '../services/get-feature-list'

export const prerender = true

/**
 * 本次构建实际使用的上游数据版本
 *
 * 页面只展示「数据更新于」，无法判断具体版本；产物中保留一份显式记录，
 * 便于排查「数据没有更新」以及复现历史构建。
 */
export async function GET() {
  const { versions, bcdUpdated, ciuUpdated } = await getFeaturesList()

  return new Response(JSON.stringify({
    bcd: versions?.bcd || 'unknown',
    caniuse: versions?.caniuse || 'unknown',
    webFeatures: versions?.webFeatures || 'unknown',
    bcdUpdated,
    ciuUpdated,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Cache-Control': import.meta.env?.DEV
        ? 'no-store'
        : 'public,max-age=86400,s-maxage=86400',
    },
  })
}
