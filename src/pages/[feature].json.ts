import type { APIContext } from 'astro'
import type { FeatureData, FeatureStatus } from '../types'
import { getFeaturesList } from '../services/get-feature-list'
import { formatId } from '../utils/format-id'

export interface Params {
  feature: string
}

export interface Props {
  data: FeatureData
  status: FeatureStatus | undefined
}

export const prerender = true

export async function getStaticPaths() {
  const { featureList, baseline } = await getFeaturesList()

  return featureList.map(feature => ({
    params: { feature: feature.id },
    props: {
      data: feature,
      status: baseline[formatId(feature.source === 'mdn' ? feature.paths : feature.id)],
    },
  }))
}

/**
 * 特性数据接口
 *
 * `GET /{feature}.json` 返回该特性的完整浏览器兼容数据，
 * 与 `/{feature}` 页面使用同一份数据，便于实现自定义渲染器。
 *
 * 字段与 `FeatureData` 一致，并补充 `status`（web-features 的 Baseline 信息）：
 * - `baseline`: `high` / `low` / `discouraged` / `false`
 * - `date`: 达到该 Baseline 状态的日期，格式为 `YYYY-MM-DD`
 * - `reason`: 被劝阻使用的原因（仅 `discouraged`）
 * - `support`: 各浏览器开始支持该特性的版本
 *
 * `status` 为 `null` 表示 web-features 尚未收录该特性。
 */
export async function GET({ props }: APIContext<Props>) {
  const { data, status } = props

  return new Response(JSON.stringify({ ...data, status: status ?? null }), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json;charset=utf-8',
      'Cache-Control': import.meta.env?.DEV
        ? 'no-store'
        : 'public,max-age=86400,s-maxage=86400,stale-while-revalidate=604800',
    },
  })
}
