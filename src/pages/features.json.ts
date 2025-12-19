import { getFeaturesList } from '../services/get-feature-list'

export async function GET() {
  const { featureList } = await getFeaturesList()

  return new Response(JSON.stringify(
    featureList.map(feature => ({
      label: feature.title,
      value: feature.id,
    })),
  ), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json;charset=utf-8',
      'Cache-Control': `no-cache,max-age=${import.meta.env?.DEV ? 0 : 3 * 24 * 60 * 60}`,
    },
  })
}
