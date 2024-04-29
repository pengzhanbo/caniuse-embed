import { getFeaturesList } from '../services/featuresList'

export async function GET() {
  const { featureList } = await getFeaturesList()
  const data = featureList.map(([feature, data]) => ({
    label: data.title,
    value: feature,
  }))
  return new Response(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  })
}
